// Time-series helpers — z-score against rolling 30y, YoY %, forward-fill, etc.
//
// Inputs are arrays of { date: 'YYYY-MM-DD', value: number | null } sorted by
// date ascending. None of these functions mutate input arrays.

export type Datum = { date: string; value: number | null };

// Standard population z-score (mean and stdev over the full history slice).
export function zScore(values: number[], current: number): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / values.length;
  const stdev = Math.sqrt(variance);
  if (stdev === 0) return 0;
  return (current - mean) / stdev;
}

// Z-score the current value of `series` against the full window provided.
// Returns null if there aren't enough non-null observations.
export function zScoreLatest(series: Datum[]): number | null {
  const nums = series.map((d) => d.value).filter((v): v is number => v !== null);
  if (nums.length < 12) return null;
  const current = nums[nums.length - 1];
  return zScore(nums, current);
}

// Year-over-year percent change for the most recent observation.
// For monthly series we look back 12 entries; for daily we look back ~252.
// Caller chooses the lookback to match the series frequency.
export function yoyChange(series: Datum[], lookbackPeriods: number): number | null {
  if (series.length <= lookbackPeriods) return null;
  const latest = series[series.length - 1];
  const prior = series[series.length - 1 - lookbackPeriods];
  if (latest.value === null || prior.value === null || prior.value === 0) return null;
  return ((latest.value - prior.value) / prior.value) * 100;
}

// Compute z-score for every observation against the full series. Useful for
// rendering sparkline points coloured by stress.
export function zScoreSeries(series: Datum[]): Datum[] {
  const nums = series.map((d) => d.value).filter((v): v is number => v !== null);
  if (nums.length < 12) return series.map((d) => ({ date: d.date, value: null }));
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const variance = nums.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / nums.length;
  const stdev = Math.sqrt(variance);
  return series.map((d) => ({
    date: d.date,
    value: d.value === null || stdev === 0 ? null : (d.value - mean) / stdev,
  }));
}

// Forward-fill null values with the most recent non-null value. Used when
// pairing daily series with quarterly GDP, etc.
export function forwardFill(series: Datum[]): Datum[] {
  let last: number | null = null;
  return series.map((d) => {
    if (d.value !== null) last = d.value;
    return { date: d.date, value: last };
  });
}

// Resample a daily series to monthly by taking the last observation per
// (year, month). Preserves null only if a month had no observations.
export function resampleToMonthly(series: Datum[]): Datum[] {
  const buckets = new Map<string, Datum>();
  for (const d of series) {
    if (d.value === null) continue;
    const key = d.date.slice(0, 7);             // 'YYYY-MM'
    const existing = buckets.get(key);
    if (!existing || existing.date < d.date) {
      buckets.set(key, d);
    }
  }
  return [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date));
}

// Find the most recent value at or before `target`.
export function latestOnOrBefore(series: Datum[], target: string): number | null {
  let result: number | null = null;
  for (const d of series) {
    if (d.date <= target && d.value !== null) result = d.value;
    if (d.date > target) break;
  }
  return result;
}

// Sort + dedupe by date (last entry per date wins).
export function normaliseSeries(series: Datum[]): Datum[] {
  const map = new Map<string, Datum>();
  for (const d of series) map.set(d.date, d);
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

// Compute 3-month basis-point delta on a daily series — used for HY spread
// momentum in the Credit classifier.
export function deltaBps3m(series: Datum[]): number | null {
  if (series.length < 64) return null;
  const latest = series[series.length - 1];
  const prior = series[series.length - 64];
  if (latest.value === null || prior.value === null) return null;
  return (latest.value - prior.value) * 100;       // values in %, output in bps
}

// Test whether the series crossed `threshold` from below within the lookback.
export function crossedFromBelow(
  series: Datum[],
  threshold: number,
  lookback: number,
): boolean {
  const tail = series.slice(-lookback);
  if (tail.length < 2) return false;
  let lastBelow = false;
  for (const d of tail) {
    if (d.value === null) continue;
    if (d.value < threshold) lastBelow = true;
    if (lastBelow && d.value >= threshold) return true;
  }
  return false;
}

// True if the series has any value below `threshold` within the lookback.
export function anyBelow(series: Datum[], threshold: number, lookback: number): boolean {
  const tail = series.slice(-lookback);
  for (const d of tail) {
    if (d.value === null) continue;
    if (d.value < threshold) return true;
  }
  return false;
}
