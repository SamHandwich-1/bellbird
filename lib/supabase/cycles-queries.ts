import { createClient } from '@/lib/supabase/server';
import type {
  CycleName,
  CycleStatus,
  CycleOverride,
  CycleReading,
  MergedCycleReading,
} from '@/lib/types';

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
