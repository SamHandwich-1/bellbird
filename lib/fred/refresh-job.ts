// Shared logic between the three macro routes:
//   • /api/macro/refresh   — daily, 90-day window
//   • /api/macro/resync    — annual, 24-month window
//   • /api/macro/backfill  — one-off, 30-year window
//
// All three call `runRefresh(startDate)` then `buildCycleReadings()`. The job
// is fully idempotent (all writes are UPSERT against unique constraints) so
// re-running is always safe.

import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchObservations } from './client';
import { fetchCape } from './shiller';
import { computeBuffett } from './buffett';
import {
  SERIES,
  type SeriesDefinition,
} from './series';
import {
  zScoreSeries,
  yoyChange,
  normaliseSeries,
  anyBelow,
  crossedFromBelow,
  deltaBps3m,
  type Datum,
} from './stats';
import {
  classifyCredit,
  classifyMarket,
  classifyJuglar,
} from './classify';
import type { CycleName, CycleStatus } from '@/lib/types';

const FREQUENCY_TO_YOY_LOOKBACK: Record<SeriesDefinition['frequency'], number> = {
  daily: 252,
  weekly: 52,
  monthly: 12,
  quarterly: 4,
};

export type RefreshSummary = {
  started: string;
  finished: string;
  startDate: string;
  series: Array<{
    id: string;
    source: 'fred' | 'shiller' | 'derived';
    fetched: number;
    upserted: number;
    error?: string;
  }>;
  shiller_source?: 'yale' | 'multpl';
  cycle_readings_written: number;
};

export async function runRefresh(
  supabase: SupabaseClient,
  startDate: string,
): Promise<RefreshSummary> {
  const started = new Date().toISOString();
  const summary: RefreshSummary = {
    started,
    finished: '',
    startDate,
    series: [],
    cycle_readings_written: 0,
  };

  // Fetch raw data per series (sequentially within FRED-side, but Shiller +
  // derived run in parallel with FRED on the scheduler since they hit
  // different hosts).
  const fetched = await fetchAllSeries(startDate, summary);

  // Upsert observations per series, with YoY + z-score computed against the
  // full DB history merged with this fetch.
  for (const { definition, observations } of fetched) {
    if (observations === null) continue;        // fetch error already logged in summary
    const upserted = await upsertSeries(supabase, definition, observations);
    const entry = summary.series.find((s) => s.id === definition.id);
    if (entry) entry.upserted = upserted;
  }

  // Derive cycle readings from latest data + write to cycle_readings.
  summary.cycle_readings_written = await buildCycleReadings(supabase);

  summary.finished = new Date().toISOString();
  return summary;
}

async function fetchAllSeries(
  startDate: string,
  summary: RefreshSummary,
): Promise<Array<{ definition: SeriesDefinition; observations: Datum[] | null }>> {
  const results: Array<{ definition: SeriesDefinition; observations: Datum[] | null }> = [];

  for (const def of SERIES) {
    const entry: RefreshSummary['series'][number] = {
      id: def.id,
      source: def.source,
      fetched: 0,
      upserted: 0,
    };
    summary.series.push(entry);

    try {
      let observations: Datum[];
      if (def.source === 'fred') {
        if (!def.fredId) throw new Error('FRED series missing fredId');
        const raw = await fetchObservations(def.fredId, { startDate });
        observations = raw.map((r) => ({ date: r.date, value: r.value }));
      } else if (def.source === 'shiller') {
        const result = await fetchCape({ startDate });
        observations = result.observations;
        summary.shiller_source = result.source;
      } else if (def.source === 'derived') {
        observations = await buildDerivedSeries(def, startDate);
      } else {
        throw new Error(`Unknown series source: ${def.source}`);
      }
      entry.fetched = observations.length;
      results.push({ definition: def, observations });
    } catch (err) {
      entry.error = err instanceof Error ? err.message : String(err);
      console.error(`[refresh] ${def.id} fetch failed:`, entry.error);
      results.push({ definition: def, observations: null });
    }
  }

  return results;
}

async function buildDerivedSeries(
  def: SeriesDefinition,
  startDate: string,
): Promise<Datum[]> {
  if (def.id === 'BUFFETT_INDICATOR') {
    const [wilshire, gdp] = await Promise.all([
      fetchObservations('WILL5000PRFC', { startDate }),
      fetchObservations('GDP', { startDate: '1990-01-01' }),
    ]);
    return computeBuffett(
      wilshire.map((r) => ({ date: r.date, value: r.value })),
      gdp.map((r) => ({ date: r.date, value: r.value })),
    );
  }
  if (def.id === 'REAL_WAGE_GROWTH') {
    // Real wage proxy: AHETPI / CPILFESL × 100 (deflated nominal wage).
    // YoY% on this composite gives "real wage growth".
    const [ahetpi, cpi] = await Promise.all([
      fetchObservations('AHETPI', { startDate }),
      fetchObservations('CPILFESL', { startDate }),
    ]);
    const cpiMap = new Map(cpi.map((r) => [r.date, r.value]));
    const out: Datum[] = [];
    for (const w of ahetpi) {
      const cpiVal = cpiMap.get(w.date);
      if (w.value === null || cpiVal === null || cpiVal === undefined || cpiVal === 0) {
        out.push({ date: w.date, value: null });
        continue;
      }
      out.push({ date: w.date, value: (w.value / cpiVal) * 100 });
    }
    return out;
  }
  throw new Error(`Unknown derived series: ${def.id}`);
}

async function upsertSeries(
  supabase: SupabaseClient,
  def: SeriesDefinition,
  observations: Datum[],
): Promise<number> {
  if (observations.length === 0) return 0;

  // Read existing history so z-scores reflect the full series, not just the
  // refresh window. Only series_id + value + observation_date needed here.
  const { data: existing, error: existingErr } = await supabase
    .from('macro_indicators')
    .select('observation_date, value')
    .eq('series_id', def.id)
    .order('observation_date', { ascending: true });
  if (existingErr) throw existingErr;

  // Merge: new observations win over existing for shared dates.
  const merged = new Map<string, number | null>();
  for (const row of (existing ?? []) as Array<{ observation_date: string; value: number | null }>) {
    merged.set(row.observation_date, row.value);
  }
  for (const obs of observations) {
    merged.set(obs.date, obs.value);
  }
  const fullSeries: Datum[] = [...merged.entries()]
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Z-score every observation against full history.
  const zSeries = zScoreSeries(fullSeries);
  const zByDate = new Map(zSeries.map((d) => [d.date, d.value]));

  // YoY for series where it makes sense (everything except 2s10s which is
  // already a spread; we still compute it but the value won't be displayed
  // for non-level series — UI hides it).
  const lookback = FREQUENCY_TO_YOY_LOOKBACK[def.frequency];
  const yoyByDate = new Map<string, number | null>();
  for (let i = 0; i < fullSeries.length; i++) {
    const slice = fullSeries.slice(0, i + 1);
    const y = yoyChange(slice, lookback);
    yoyByDate.set(fullSeries[i].date, y);
  }

  // Build rows for the refresh window only (don't churn untouched historical rows).
  const nowIso = new Date().toISOString();
  const refreshDates = new Set(observations.map((o) => o.date));
  const rows = fullSeries
    .filter((d) => refreshDates.has(d.date))
    .map((d) => ({
      series_id: def.id,
      display_name: def.displayName,
      category: def.category,
      observation_date: d.date,
      value: d.value,
      yoy_change: yoyByDate.get(d.date) ?? null,
      z_score_30y: zByDate.get(d.date) ?? null,
      updated_at: nowIso,
    }));

  if (rows.length === 0) return 0;

  const { error: upsertErr } = await supabase
    .from('macro_indicators')
    .upsert(rows, { onConflict: 'series_id,observation_date' });
  if (upsertErr) throw upsertErr;

  return rows.length;
}

// Derive credit/market/Juglar readings from latest macro_indicators rows and
// write one cycle_readings row per cycle for today.
async function buildCycleReadings(supabase: SupabaseClient): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);

  // Pull recent history for the series the classifier needs. T10Y2Y needs
  // 180+ days for inversion detection; HY needs ~90 days for the 3m delta.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 200);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const neededSeries = ['BAMLH0A0HYM2', 'T10Y2Y', 'CAPE', 'BUFFETT_INDICATOR', 'VIXCLS', 'TCU', 'NAPM'];

  const { data: rows, error } = await supabase
    .from('macro_indicators')
    .select('series_id, observation_date, value, z_score_30y')
    .in('series_id', neededSeries)
    .gte('observation_date', cutoffStr)
    .order('observation_date', { ascending: true });
  if (error) throw error;

  const bySeriesId = new Map<string, Array<{ date: string; value: number | null; z: number | null }>>();
  for (const row of (rows ?? []) as Array<{
    series_id: string;
    observation_date: string;
    value: number | null;
    z_score_30y: number | null;
  }>) {
    const arr = bySeriesId.get(row.series_id) ?? [];
    arr.push({ date: row.observation_date, value: row.value, z: row.z_score_30y });
    bySeriesId.set(row.series_id, arr);
  }

  // Pull standalone latest z-scores for series we only need the most recent value of.
  const latestZ = (id: string): number => {
    const arr = bySeriesId.get(id) ?? [];
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i].z !== null) return arr[i].z!;
    }
    return 0;
  };
  const latestValue = (id: string): number | null => {
    const arr = bySeriesId.get(id) ?? [];
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i].value !== null) return arr[i].value!;
    }
    return null;
  };

  // Build inputs
  const hySeries: Datum[] = (bySeriesId.get('BAMLH0A0HYM2') ?? []).map((r) => ({ date: r.date, value: r.value }));
  const curveSeries: Datum[] = (bySeriesId.get('T10Y2Y') ?? []).map((r) => ({ date: r.date, value: r.value }));
  const hy_delta = deltaBps3m(normaliseSeries(hySeries));
  const curve_inverted_last_90d = anyBelow(curveSeries, 0, 90);
  const curve_recently_uninverted =
    !curve_inverted_last_90d && crossedFromBelow(curveSeries, 0, 180);

  const credit = classifyCredit({
    hy_z: latestZ('BAMLH0A0HYM2'),
    hy_delta_3m_bps: hy_delta,
    curve_inverted_last_90d,
    curve_recently_uninverted,
  });
  const market = classifyMarket({
    cape_z: latestZ('CAPE'),
    buffett_z: latestZ('BUFFETT_INDICATOR'),
    vix_z: latestZ('VIXCLS'),
  });
  const ism_value = latestValue('NAPM') ?? 50;
  const tcu_value = latestValue('TCU') ?? 78;
  const juglar = classifyJuglar({
    tcu_z: latestZ('TCU'),
    ism_z: latestZ('NAPM'),
    ism_value,
    tcu_value,
  });

  const readings: Array<{
    cycle_name: CycleName;
    reading_date: string;
    status: CycleStatus;
    classification: string;
    detail: string;
    contributing_series: Record<string, unknown>;
  }> = [
    { cycle_name: 'credit', reading_date: today, status: credit.status, classification: credit.reading, detail: credit.detail, contributing_series: credit.contributing_series },
    { cycle_name: 'market', reading_date: today, status: market.status, classification: market.reading, detail: market.detail, contributing_series: market.contributing_series },
    { cycle_name: 'juglar', reading_date: today, status: juglar.status, classification: juglar.reading, detail: juglar.detail, contributing_series: juglar.contributing_series },
  ];

  const { error: upsertErr } = await supabase
    .from('cycle_readings')
    .upsert(readings, { onConflict: 'cycle_name,reading_date' });
  if (upsertErr) throw upsertErr;

  return readings.length;
}
