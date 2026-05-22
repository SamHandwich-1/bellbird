import { createClient } from '@/lib/supabase/server';
import type {
  CycleName,
  CycleStatus,
  CycleOverride,
  CycleReading,
  CycleStage,
  MacroIndicator,
  MergedCycleReading,
} from '@/lib/types';
import { SERIES } from '@/lib/fred/series';

// One row per series — latest observation plus the resampled 30y history for
// the sparkline. The history is monthly resampled in the DB for storage
// efficiency; daily series get the last value of each month.
export type IndicatorSnapshot = {
  series_id: string;
  display_name: string;
  category: MacroIndicator['category'];
  latest_value: number | null;
  yoy_change: number | null;
  z_score_30y: number | null;
  observation_date: string | null;
  updated_at: string | null;
  history: Array<{ date: string; value: number | null }>;
};

// Pull the full set of indicators in the canonical series order. Each
// snapshot includes monthly history for the sparkline. Series with no rows
// yet (cron hasn't backfilled, FRED key missing, etc.) come back with empty
// history and null latest values so the UI still renders the cell.
//
// One query per series in parallel — a single cross-series `.select('*')`
// hit the PostgREST 1000-row cap and returned only the oldest ~1995 rows
// across all series. Per-series `.limit(10000)` keeps each query well under
// the cap (largest daily series is ~8.2k rows over 30y) and gives every
// series its real latest observation.
export async function getIndicatorSnapshots(): Promise<IndicatorSnapshot[]> {
  const supabase = await createClient();

  const results = await Promise.all(
    SERIES.map(async (s) => {
      const { data, error } = await supabase
        .from('macro_indicators')
        .select('*')
        .eq('series_id', s.id)
        .order('observation_date', { ascending: true })
        .limit(10000);
      if (error) throw error;
      return { series: s, rows: (data ?? []) as MacroIndicator[] };
    }),
  );

  return results.map(({ series: s, rows }) => {
    const monthly = resampleToMonthly(rows);
    const latest = rows[rows.length - 1];
    return {
      series_id: s.id,
      display_name: s.displayName,
      category: s.category,
      latest_value: latest?.value ?? null,
      yoy_change: latest?.yoy_change ?? null,
      z_score_30y: latest?.z_score_30y ?? null,
      observation_date: latest?.observation_date ?? null,
      updated_at: latest?.updated_at ?? null,
      history: monthly.map((r) => ({ date: r.observation_date, value: r.value })),
    };
  });
}

function resampleToMonthly(rows: MacroIndicator[]): MacroIndicator[] {
  if (rows.length === 0) return [];
  const buckets = new Map<string, MacroIndicator>();
  for (const r of rows) {
    if (r.value === null) continue;
    const key = r.observation_date.slice(0, 7);
    const existing = buckets.get(key);
    if (!existing || existing.observation_date < r.observation_date) {
      buckets.set(key, r);
    }
  }
  return [...buckets.values()].sort((a, b) =>
    a.observation_date.localeCompare(b.observation_date),
  );
}

// Latest cycle_readings row per cycle_name. Cron writes one row per day per
// cycle; we read the most recent.
export async function getLatestCycleReadings(): Promise<CycleReading[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cycle_readings')
    .select('*')
    .order('reading_date', { ascending: false });
  if (error) throw error;

  const seen = new Set<string>();
  const out: CycleReading[] = [];
  for (const row of (data ?? []) as CycleReading[]) {
    if (seen.has(row.cycle_name)) continue;
    seen.add(row.cycle_name);
    out.push(row);
  }
  return out;
}

export async function getCycleOverrides(): Promise<CycleOverride[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('cycle_overrides').select('*');
  if (error) throw error;
  return (data ?? []) as CycleOverride[];
}

// Merge rules-derived readings with manual overrides. Override wins when set
// and not expired; rules fill in the blanks. Always returns one entry per
// cycle name, in the canonical credit/market/juglar order, even when there's
// no underlying data yet (so the page renders three gauges before the cron
// has ever run).
export async function getMergedCycleReadings(): Promise<MergedCycleReading[]> {
  const [readings, overrides] = await Promise.all([
    getLatestCycleReadings(),
    getCycleOverrides(),
  ]);
  const readingByName = new Map(readings.map((r) => [r.cycle_name, r]));
  const overrideByName = new Map(overrides.map((o) => [o.cycle_name, o]));
  const now = new Date().toISOString();

  const order: CycleName[] = ['credit', 'market', 'juglar'];
  return order.map<MergedCycleReading>((cycle_name) => {
    const reading = readingByName.get(cycle_name);
    const override = overrideByName.get(cycle_name);
    const overrideActive = !!override && (override.expires_at === null || override.expires_at > now);

    const rules_status: CycleStatus = reading?.status ?? 'healthy';
    const rules_reading = reading?.classification ?? null;

    const status: CycleStatus = overrideActive && override.override_status
      ? override.override_status
      : rules_status;

    const reading_text: string = overrideActive
      ? override.reading_override
      : (rules_reading ?? 'Awaiting data');

    const detail: string | null = overrideActive && override.detail_override
      ? override.detail_override
      : (reading?.detail ?? null);

    return {
      cycle_name,
      status,
      reading: reading_text,
      detail,
      is_manual: overrideActive,
      set_at: overrideActive ? override.set_at : null,
      rules_status,
      rules_reading,
      contributing_series: reading?.contributing_series ?? null,
      reading_date: reading?.reading_date ?? '',
    };
  });
}

// {cycleStage: count} for the book-distribution rows. Includes the explicit
// null/unset bucket so the total matches SELECT COUNT(*) FROM theses.
export type BookDistribution = {
  total: number;
  bystage: Record<CycleStage | 'unset', number>;
};

export async function getBookDistribution(): Promise<BookDistribution> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('theses').select('cycle_stage');
  if (error) throw error;
  const rows = (data ?? []) as Array<{ cycle_stage: CycleStage | null }>;
  const counts: Record<string, number> = {};
  for (const r of rows) {
    const key = r.cycle_stage ?? 'unset';
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return {
    total: rows.length,
    bystage: {
      secular: counts.secular ?? 0,
      'long-cycle': counts['long-cycle'] ?? 0,
      'mid-cycle': counts['mid-cycle'] ?? 0,
      'credit-cycle': counts['credit-cycle'] ?? 0,
      'narrative-cycle': counts['narrative-cycle'] ?? 0,
      unset: counts.unset ?? 0,
    },
  };
}

// Most recent updated_at across macro_indicators — used by the LastRefreshed
// footer. Null if the table is empty (cron hasn't run yet).
export async function getLastRefreshTime(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('macro_indicators')
    .select('updated_at')
    .order('updated_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0]?.updated_at ?? null;
}
