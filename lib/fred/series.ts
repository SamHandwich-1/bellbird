// The 16-series indicator registry for the Cycles dashboard.
//
// See PLAN.md §4 (revised) and the Turn 5 plan for source rationale. The
// `contributesTo` field tells the classifier which cycle gauge(s) the series
// feeds into. ISM contributes to both real_economy (display category) and
// the Juglar gauge — only one row per observation_date sits in DB, the
// classifier reads it twice.

import type { CycleName, IndicatorCategory } from '@/lib/types';

export type SeriesSource = 'fred' | 'shiller' | 'derived';

export type SeriesDefinition = {
  id: string;                          // canonical id used as macro_indicators.series_id
  fredId?: string;                     // FRED series_id if source === 'fred'
  displayName: string;
  category: IndicatorCategory;
  source: SeriesSource;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  // Which gauges this series feeds into. May be empty if displayed only.
  contributesTo: CycleName[];
  // Optional tooltip extra (e.g. Buffett's "directional proxy" caveat).
  tooltip?: string;
};

export const SERIES: readonly SeriesDefinition[] = [
  // ─── Real economy ────────────────────────────────────────────────────────
  {
    id: 'A191RL1Q225SBEA',
    fredId: 'A191RL1Q225SBEA',
    displayName: 'Real GDP growth',
    category: 'real_economy',
    source: 'fred',
    frequency: 'quarterly',
    contributesTo: [],
  },
  {
    id: 'REAL_WAGE_GROWTH',
    displayName: 'Real wage growth',
    category: 'real_economy',
    source: 'derived',
    frequency: 'monthly',
    contributesTo: [],
    tooltip: 'AHETPI (production/nonsupervisory hourly earnings) deflated by CPILFESL.',
  },
  {
    id: 'CPILFESL',
    fredId: 'CPILFESL',
    displayName: 'Core CPI YoY',
    category: 'real_economy',
    source: 'fred',
    frequency: 'monthly',
    contributesTo: [],
    tooltip: 'YoY % change of the core CPI index.',
  },
  {
    id: 'UNRATE',
    fredId: 'UNRATE',
    displayName: 'Unemployment',
    category: 'real_economy',
    source: 'fred',
    frequency: 'monthly',
    contributesTo: [],
  },
  {
    id: 'PAYEMS',
    fredId: 'PAYEMS',
    displayName: 'Nonfarm Payrolls',
    category: 'real_economy',
    source: 'fred',
    frequency: 'monthly',
    contributesTo: [],
    tooltip: 'YoY % change derived for the dashboard.',
  },
  {
    id: 'NAPM',
    fredId: 'NAPM',
    displayName: 'ISM Manufacturing',
    category: 'real_economy',
    source: 'fred',
    frequency: 'monthly',
    contributesTo: ['juglar'],
    tooltip: 'Below 50 = contraction. Contributes to the Juglar gauge.',
  },

  // ─── Rates & liquidity ───────────────────────────────────────────────────
  {
    id: 'FEDFUNDS',
    fredId: 'FEDFUNDS',
    displayName: 'Fed Funds Rate',
    category: 'rates',
    source: 'fred',
    frequency: 'monthly',
    contributesTo: [],
  },
  {
    id: 'T10Y2Y',
    fredId: 'T10Y2Y',
    displayName: '2s10s Yield Curve',
    category: 'rates',
    source: 'fred',
    frequency: 'daily',
    contributesTo: ['credit'],
    tooltip: 'Negative = inverted. Modifier on the Credit gauge.',
  },
  {
    id: 'DGS30',
    fredId: 'DGS30',
    displayName: '30Y Treasury Yield',
    category: 'rates',
    source: 'fred',
    frequency: 'daily',
    contributesTo: [],
  },
  {
    id: 'WALCL',
    fredId: 'WALCL',
    displayName: 'Fed Balance Sheet',
    category: 'liquidity',
    source: 'fred',
    frequency: 'weekly',
    contributesTo: [],
    tooltip: 'YoY % change derived for the dashboard.',
  },
  {
    id: 'DTWEXBGS',
    fredId: 'DTWEXBGS',
    displayName: 'DXY (USD Index)',
    category: 'rates',
    source: 'fred',
    frequency: 'daily',
    contributesTo: [],
  },

  // ─── Credit ──────────────────────────────────────────────────────────────
  {
    id: 'BAMLH0A0HYM2',
    fredId: 'BAMLH0A0HYM2',
    displayName: 'HY Credit Spreads',
    category: 'credit',
    source: 'fred',
    frequency: 'daily',
    contributesTo: ['credit'],
    tooltip: 'Primary driver of the Credit gauge.',
  },

  // ─── Capex ───────────────────────────────────────────────────────────────
  {
    id: 'TCU',
    fredId: 'TCU',
    displayName: 'Capacity Utilization',
    category: 'capex',
    source: 'fred',
    frequency: 'monthly',
    contributesTo: ['juglar'],
    tooltip: 'Primary driver of the Juglar gauge alongside ISM.',
  },

  // ─── Equity valuation & sentiment ────────────────────────────────────────
  {
    id: 'CAPE',
    displayName: 'CAPE / Shiller PE',
    category: 'equity_valuation',
    source: 'shiller',
    frequency: 'monthly',
    contributesTo: ['market'],
    tooltip: 'From Robert Shiller (Yale). Primary driver of the Market gauge.',
  },
  {
    id: 'BUFFETT_INDICATOR',
    displayName: 'Buffett Indicator',
    category: 'equity_valuation',
    source: 'derived',
    frequency: 'daily',
    contributesTo: ['market'],
    tooltip:
      'Directional proxy — not the textbook market-cap-to-GDP level. Derived from WILL5000PRFC ÷ GDP.',
  },
  {
    id: 'VIXCLS',
    fredId: 'VIXCLS',
    displayName: 'VIX',
    category: 'sentiment',
    source: 'fred',
    frequency: 'daily',
    contributesTo: ['market'],
    tooltip: 'Modifier on the Market gauge.',
  },
] as const;

export function getSeries(id: string): SeriesDefinition | undefined {
  return SERIES.find((s) => s.id === id);
}

export function seriesByCategory(): Record<IndicatorCategory, SeriesDefinition[]> {
  const out: Partial<Record<IndicatorCategory, SeriesDefinition[]>> = {};
  for (const s of SERIES) {
    (out[s.category] ??= []).push(s);
  }
  return out as Record<IndicatorCategory, SeriesDefinition[]>;
}

export function seriesContributingTo(cycle: CycleName): SeriesDefinition[] {
  return SERIES.filter((s) => s.contributesTo.includes(cycle));
}

// Default ordered category list for the dashboard grid.
export const CATEGORY_ORDER: readonly IndicatorCategory[] = [
  'real_economy',
  'rates',
  'liquidity',
  'credit',
  'capex',
  'equity_valuation',
  'sentiment',
] as const;

export const CATEGORY_LABEL: Record<IndicatorCategory, string> = {
  real_economy: 'Real economy',
  rates: 'Rates',
  liquidity: 'Liquidity',
  credit: 'Credit',
  capex: 'Capex',
  equity_valuation: 'Equity valuation',
  sentiment: 'Sentiment',
};
