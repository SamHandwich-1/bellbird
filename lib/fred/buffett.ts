// Buffett Indicator — directional proxy.
//
// Standard textbook ratio is total US market cap / GDP × 100. FRED publishes
// WILL5000PRFC (Wilshire 5000 Total Market Full Cap Index — an index level,
// not dollars) and GDP (quarterly, USD billions). The index moves
// proportionally to market cap, so trend and z-score are correct; the
// absolute level on the dashboard will not match the textbook number. The
// indicator tooltip flags this explicitly.

import { fetchObservations } from './client';
import { forwardFill, latestOnOrBefore, normaliseSeries, type Datum } from './stats';

const WILSHIRE_SERIES = 'WILL5000PRFC';
const GDP_SERIES = 'GDP';

export async function fetchBuffettIndicator(opts?: {
  startDate?: string;
}): Promise<Datum[]> {
  const startDate = opts?.startDate;
  const [wilshire, gdp] = await Promise.all([
    fetchObservations(WILSHIRE_SERIES, { startDate }),
    fetchObservations(GDP_SERIES, { startDate: '1990-01-01' }),  // GDP needs broad window for lookback
  ]);

  return computeBuffett(wilshire, gdp);
}

export function computeBuffett(wilshire: Datum[], gdp: Datum[]): Datum[] {
  const w = normaliseSeries(wilshire);
  const g = forwardFill(normaliseSeries(gdp));
  if (g.length === 0) return [];

  const out: Datum[] = [];
  for (const wDatum of w) {
    if (wDatum.value === null) {
      out.push({ date: wDatum.date, value: null });
      continue;
    }
    const gdpVal = latestOnOrBefore(g, wDatum.date);
    if (gdpVal === null || gdpVal === 0) {
      out.push({ date: wDatum.date, value: null });
      continue;
    }
    // Index-not-market-cap; the ratio is unitless but directionally meaningful.
    // Multiply by 100 so the z-score and visual range feel comparable to a percent.
    out.push({ date: wDatum.date, value: (wDatum.value / gdpVal) * 100 });
  }
  return out;
}
