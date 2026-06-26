// Pre-flight fact pack — slice 1 (item 24).
//
// Assembles a one-shot LIVE macro snapshot at conversation start: a curated
// headline subset of macro_indicators (already populated by the FRED cron)
// plus the three rules-derived cycle gauges. The pack is persisted on the
// conversation row and injected into the Phase-1 system prompt on every turn
// so theses are developed against current reality from message one.
//
// This is NOT behaviour-preserving: it deliberately changes Phase-1 context.
// It is a one-shot snapshot, not surveillance — no polling, no watch loop.

import type { SupabaseClient } from '@supabase/supabase-js';
import { getMergedCycleReadings } from '@/lib/supabase/cycles-queries';
import { getSeries } from '@/lib/fred/series';
import type { FactPack, FactPackCycle, FactPackMacroRow } from '@/lib/types';

// Curated regime-headline subset, in render order: rates → credit → sentiment
// → real economy → valuation. ≤500-token budget; z-scores kept (they turn raw
// levels into regime signal cheaply). HY-only (no IG series exists yet);
// real-yield / breakeven (DFII10 / T10YIE) and IG OAS are deferred series-adds.
export const HEADLINE_SERIES: readonly string[] = [
  'FEDFUNDS', // Fed Funds Rate
  'T10Y2Y', // 2s10s curve
  'DGS30', // 30Y Treasury
  'DTWEXBGS', // DXY
  'BAMLH0A0HYM2', // HY OAS
  'VIXCLS', // VIX
  'CPILFESL', // Core CPI YoY
  'UNRATE', // Unemployment
  'A191RL1Q225SBEA', // Real GDP growth
  'CAPE', // Shiller PE (valuation anchor)
] as const;

// Enough history to capture the latest quarterly print (Real GDP) alongside
// the dailies; we then keep the most recent row per series.
const LOOKBACK_DAYS = 450;

type MacroRow = {
  series_id: string;
  display_name: string;
  value: number | null;
  yoy_change: number | null;
  z_score_30y: number | null;
  observation_date: string;
};

// Read the latest observation per headline series. Mirrors the dedupe idiom in
// cycles-queries.ts getLatestCycleReadings: order newest-first, keep first seen
// per series_id.
async function readLatestMacro(
  supabase: SupabaseClient,
): Promise<FactPackMacroRow[]> {
  const cutoff = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const { data, error } = await supabase
    .from('macro_indicators')
    .select('series_id, display_name, value, yoy_change, z_score_30y, observation_date')
    .in('series_id', [...HEADLINE_SERIES])
    .gte('observation_date', cutoff)
    .order('observation_date', { ascending: false });
  if (error) throw error;

  const latest = new Map<string, MacroRow>();
  for (const row of (data ?? []) as MacroRow[]) {
    if (!latest.has(row.series_id)) latest.set(row.series_id, row);
  }

  // Emit in HEADLINE_SERIES order; skip any series with no data yet.
  const out: FactPackMacroRow[] = [];
  for (const id of HEADLINE_SERIES) {
    const row = latest.get(id);
    if (!row) continue;
    out.push({
      series_id: row.series_id,
      display_name: row.display_name,
      value: row.value,
      yoy_change: row.yoy_change,
      z_score_30y: row.z_score_30y,
      observation_date: row.observation_date,
      display_as: getSeries(id)?.displayAs ?? 'level',
    });
  }
  return out;
}

export async function buildMacroFactPack(
  supabase: SupabaseClient,
): Promise<FactPack> {
  const [macro, merged] = await Promise.all([
    readLatestMacro(supabase),
    getMergedCycleReadings(),
  ]);

  const cycles: FactPackCycle[] = merged.map((c) => ({
    cycle_name: c.cycle_name,
    status: c.status,
    reading: c.reading,
    detail: c.detail,
  }));

  return {
    as_of: new Date().toISOString(),
    cycles,
    macro,
  };
}

function fmt(n: number | null): string {
  if (n == null) return 'n/a';
  // Compact: 2 decimals, trailing zeros trimmed.
  return Number(n.toFixed(2)).toString();
}

function macroLine(row: FactPackMacroRow): string {
  const headline =
    row.display_as === 'yoy_pct'
      ? `${fmt(row.yoy_change)}% yoy`
      : fmt(row.value);
  const z = row.z_score_30y == null ? '' : ` · z(30y) ${fmt(row.z_score_30y)}`;
  return `- ${row.display_name}: ${headline}${z} · as of ${row.observation_date}`;
}

function cycleLine(c: FactPackCycle): string {
  const detail = c.detail ? ` — ${c.detail}` : '';
  return `- ${c.cycle_name}: ${c.status} (${c.reading})${detail}`;
}

// Render the persisted pack into the delimited block injected into the Phase-1
// system prompt. Carries its own ground-truth framing so the prompt file just
// slots it in.
export function renderFactPack(pack: FactPack): string {
  const lines: string[] = [];
  lines.push(`── LIVE MARKET & MACRO STATE — as of ${pack.as_of} ──`);
  lines.push(
    'This is current market and macro reality at conversation start, not a thesis assertion. Treat it as ground truth. If a premise contradicts it, surface the contradiction with the live figure.',
  );
  if (pack.cycles.length) {
    lines.push('');
    lines.push('Cycle gauges:');
    for (const c of pack.cycles) lines.push(cycleLine(c));
  }
  if (pack.macro.length) {
    lines.push('');
    lines.push('Headline macro:');
    for (const row of pack.macro) lines.push(macroLine(row));
  }
  lines.push('────────────────────────────────────────────');
  return lines.join('\n');
}
