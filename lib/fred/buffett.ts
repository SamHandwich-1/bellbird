// Buffett Indicator — directional proxy.
//
// Standard textbook ratio is total US market cap / GDP × 100. FRED no longer
// hosts WILL5000PRFC (Wilshire stopped feeding the index to FRED), so we use
// SP500 instead. SP500 on FRED begins 2010-05-26 — Buffett history is shorter
// than the original 30-year plan called for, but the post-GFC era is the
// load-bearing window for cycle classification anyway. Tooltip in series.ts
// flags the absolute-level caveat ("directional proxy — not the textbook
// market-cap-to-GDP level").

import { fetchObservations } from './client';
import { forwardFill, latestOnOrBefore, normaliseSeries, type Datum } from './stats';

const EQUITY_SERIES = 'SP500';
const GDP_SERIES = 'GDP';

export async function fetchBuffettIndicator(opts?: {
  startDate?: string;
}): Promise<Datum[]> {
  const startDate = opts?.startDate;
  const [equity, gdp] = await Promise.all([
    fetchObservations(EQUITY_SERIES, { startDate }),
    fetchObservations(GDP_SERIES, { startDate: '1990-01-01' }),  // GDP needs broad window for lookback
  ]);

  return computeBuffett(equity, gdp);
}

export function computeBuffett(equity: Datum[], gdp: Datum[]): Datum[] {
  const e = normaliseSeries(equity);
  const g = forwardFill(normaliseSeries(gdp));
  if (g.length === 0) return [];

  const out: Datum[] = [];
  for (const eDatum of e) {
    if (eDatum.value === null) {
      out.push({ date: eDatum.date, value: null });
      continue;
    }
    const gdpVal = latestOnOrBefore(g, eDatum.date);
    if (gdpVal === null || gdpVal === 0) {
      out.push({ date: eDatum.date, value: null });
      continue;
    }
    // Index-not-market-cap; the ratio is unitless but directionally meaningful.
    // Multiply by 100 so the z-score and visual range feel comparable to a percent.
    out.push({ date: eDatum.date, value: (eDatum.value / gdpVal) * 100 });
  }
  return out;
}
