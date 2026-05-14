# Lovebird — Technical Brief

## Component summary

Lovebird is the pair trading discovery and management component of the Bowerbird Investment Agent platform. Its role is to identify candidate pairs, monitor active pair positions, track fundamental and statistical relationships between paired assets, and produce pair-specific signals that feed back into Magpie and ultimately Huginn's decision context.

The component is named after the lovebird, an African parrot famous for forming strong, lifelong pair bonds. The naming captures the system's core purpose: finding and maintaining productive pairings between assets.

## What Lovebird is

A dedicated pipeline for pair-based strategies including:
- Statistical arbitrage on cointegrated pairs
- Sector-relative trades (long the leader, short the laggard)
- Cross-listing arbitrage (BHP ASX vs LSE, dual-listed AU/US securities)
- Holding company / subsidiary spreads
- Spin-off and merger arbitrage pairs
- ETF vs underlying basket inefficiencies
- Long-short fundamental pairs (similar businesses, divergent valuations)

## What Lovebird is not

- It is **not** a high-frequency arb engine. Pair signals here are daily-to-weekly cadence, not microsecond.
- It is **not** a black-box statistical model. Every candidate pair surfaces with explainable rationale (sector, correlation regime, cointegration result, fundamental gap).
- It is **not** market-neutral guarantee. Pairs can and do break; Lovebird's job is to identify *when* they're likely to.

## Core thesis

Pair-based strategies offer specific advantages for a self-directed investor:

1. **Reduced market exposure.** A well-constructed pair captures relative performance, not absolute. Less dependent on getting market direction right.
2. **Mean reversion is more reliable than trend prediction** at retail timeframes (days to months) when applied to genuinely related assets.
3. **Special situations** (M&A, spin-offs, index changes, dual listings) create periodic high-conviction pair opportunities that systematic funds may not pursue at retail size.
4. **Discipline structure**. Pair trading enforces explicit thinking about both legs of a position, which is healthier than directional speculation.

But the honest framing also matters. Generic statistical arb across large equity universes is heavily arbitraged. The realistic edge for retail-scale pair trading sits in:
- Selectivity and patience over volume
- Combining statistical signals with fundamental and event context
- Disciplined risk management when correlations break

Lovebird is built for the selective-and-disciplined approach, not the high-volume statistical approach.

## Responsibilities

### 1. Pair discovery

Scan defined universes (ASX 200, SP 500 sectors, custom watchlists) for candidate pairs. Apply layered filters:

- **Sector and business similarity**: Same GICS sector and ideally sub-industry. Optional manual override for cross-sector special situations.
- **Liquidity matching**: Both legs must clear minimum daily volume thresholds.
- **Market cap similarity**: Within reasonable ratio (1:5 by default) to avoid mismatched positioning.
- **Correlation history**: Rolling 1y and 3y correlation above thresholds (typically 0.6+).
- **Cointegration tests**: Engle-Granger and Johansen tests on log-price series. Statistically significant cointegration relationship.
- **Spread stationarity**: Augmented Dickey-Fuller test on the spread.
- **Half-life of mean reversion**: Computed via Ornstein-Uhlenbeck fit. Typical target: 5–60 days.
- **Regime stability**: Has the relationship held across multiple market regimes, not just the recent benign period?

Output: ranked candidate list with explainable scoring per criterion.

### 2. Pair monitoring

For active positions and watchlist pairs, compute and update daily:

- **Spread**: log-price spread or hedge-ratio-adjusted spread depending on pair type
- **Z-score**: spread relative to rolling mean (typically 60-day) and standard deviation
- **Half-life**: rolling Ornstein-Uhlenbeck fit, watch for changes
- **Beta stability**: rolling beta of leg A vs leg B, watch for drift
- **Correlation regime**: rolling correlation, flag breakdowns
- **Volume profile**: are both legs trading normally, any unusual activity

### 3. Fundamental diff tracking

For each watched pair, track the *fundamental* spread alongside the price spread:

- P/E ratio difference (rolling)
- EV/EBITDA difference
- FCF yield difference
- Growth rate difference (revenue, EPS)
- ROIC difference

When fundamentals diverge from price spread (price says they're far apart, fundamentals say they're converging — or vice versa), that's actionable. Updates are slower than price (quarterly earnings) but matter more for thesis validation.

### 4. Event watch

Monitor for events that could break pair relationships:

- Earnings announcements (either leg)
- M&A activity (either leg or competitors)
- Index inclusions/removals
- Regulatory events (drug approvals, antitrust)
- Management changes
- Dividend changes
- Buyback programs

Surface event calendar for active pairs; flag warnings 1–2 weeks ahead.

### 5. Sizing and risk

For candidate pairs, compute:

- **Dollar-neutral sizing**: equal dollar long/short
- **Beta-neutral sizing**: leg sizes adjusted by individual betas
- **Hedge-ratio sizing**: based on cointegration vector
- **Risk metrics**: max historical spread excursion, expected vol, breakdown stress test (what if correlation drops to zero overnight?)

### 6. Outcome tracking

For closed pair positions, record:

- Entry z-score, exit z-score, holding period
- P&L attribution (spread compression vs leg drift)
- Half-life realized vs predicted
- Did the pair break? If so, why?
- Was the SwanSong regime context predictive of pair behavior?

Feed to Muninn for attribution analysis.

## Database schema

```sql
-- ============================================================
-- TABLE 1: love_pairs
-- The master registry of pairs — both candidates and active
-- ============================================================
CREATE TABLE love_pairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    pair_name TEXT NOT NULL,                    -- "BHP_RIO" or "CBA_WBC"
    leg_a_symbol TEXT NOT NULL,
    leg_b_symbol TEXT NOT NULL,
    pair_type TEXT NOT NULL,                    -- 'sector', 'cross_listing', 'holdco_sub', 'merger_arb', 'spinoff', 'etf_basket', 'fundamental_long_short'

    -- Status
    status TEXT NOT NULL,                       -- 'candidate', 'watchlist', 'active', 'closed', 'broken', 'archived'
    discovered_at TIMESTAMPTZ DEFAULT now(),
    activated_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,

    -- Rationale
    discovery_reason TEXT,                      -- 'sector_scan', 'manual', 'event_driven', 'fundamental_screen'
    description TEXT,                           -- 1-2 paragraph human-readable thesis

    -- Statistical relationship (most recent)
    correlation_1y NUMERIC,
    correlation_3y NUMERIC,
    cointegration_pvalue NUMERIC,
    half_life_days NUMERIC,
    hedge_ratio NUMERIC,                        -- from cointegration vector

    -- Scoring
    discovery_score NUMERIC,                    -- composite candidate score 0-100
    regime_stability_score NUMERIC,             -- 0-100; how stable across regimes

    -- Meta
    sector TEXT,
    tags TEXT[],

    embedding VECTOR(1536),                     -- for similarity search across pairs

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE 2: love_pair_snapshots
-- Daily snapshot of pair statistics — the time series
-- ============================================================
CREATE TABLE love_pair_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pair_id UUID REFERENCES love_pairs(id) ON DELETE CASCADE,

    snapshot_date DATE NOT NULL,

    -- Prices and spread
    leg_a_price NUMERIC,
    leg_b_price NUMERIC,
    spread NUMERIC,                             -- log spread or hedge-ratio adjusted
    spread_zscore NUMERIC,

    -- Rolling statistics
    correlation_60d NUMERIC,
    half_life_60d NUMERIC,
    beta_60d NUMERIC,                           -- leg_a vs leg_b
    spread_vol_60d NUMERIC,

    -- Volume
    leg_a_volume NUMERIC,
    leg_b_volume NUMERIC,
    leg_a_volume_vs_avg NUMERIC,                -- ratio of today's volume to 30d avg
    leg_b_volume_vs_avg NUMERIC,

    -- Regime (from SwanSong)
    swansong_fragility_score NUMERIC,
    swansong_regime TEXT,

    UNIQUE(pair_id, snapshot_date)
);

-- ============================================================
-- TABLE 3: love_fundamental_diffs
-- Quarterly fundamental relationship between pair legs
-- ============================================================
CREATE TABLE love_fundamental_diffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pair_id UUID REFERENCES love_pairs(id) ON DELETE CASCADE,

    period_end DATE NOT NULL,                   -- quarter end

    -- Valuation diffs (leg_a - leg_b)
    pe_diff NUMERIC,
    ev_ebitda_diff NUMERIC,
    fcf_yield_diff NUMERIC,
    pb_diff NUMERIC,

    -- Growth diffs
    revenue_growth_diff NUMERIC,
    eps_growth_diff NUMERIC,

    -- Quality diffs
    roic_diff NUMERIC,
    margin_diff NUMERIC,
    debt_ebitda_diff NUMERIC,

    -- Composite
    fundamental_gap_score NUMERIC,              -- composite of relative valuation
    fundamental_direction TEXT,                 -- 'converging', 'diverging', 'stable'

    notes TEXT,
    UNIQUE(pair_id, period_end)
);

-- ============================================================
-- TABLE 4: love_pair_events
-- Events affecting either leg
-- ============================================================
CREATE TABLE love_pair_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pair_id UUID REFERENCES love_pairs(id) ON DELETE CASCADE,

    leg TEXT NOT NULL,                          -- 'a', 'b', 'both'
    event_type TEXT NOT NULL,                   -- 'earnings', 'm_and_a', 'index_change', 'regulatory', 'dividend', 'buyback', 'management_change'
    event_date DATE NOT NULL,

    description TEXT,
    expected_impact TEXT,                       -- 'pair_breaking', 'pair_strengthening', 'neutral', 'unknown'
    actual_impact TEXT,                         -- filled in retrospectively

    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE 5: love_pair_signals
-- Signals fired by Lovebird back to Magpie
-- ============================================================
CREATE TABLE love_pair_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pair_id UUID REFERENCES love_pairs(id) ON DELETE CASCADE,

    signal_type TEXT NOT NULL,                  -- 'entry_long_a_short_b', 'entry_long_b_short_a', 'exit', 'reduce', 'add', 'breakdown_warning'
    signal_date DATE NOT NULL,

    spread_zscore_at_signal NUMERIC,
    half_life_at_signal NUMERIC,
    confidence NUMERIC,                         -- 0-1

    rationale TEXT,
    forwarded_to_magpie_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE 6: love_pair_positions
-- Active and historical positions
-- ============================================================
CREATE TABLE love_pair_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pair_id UUID REFERENCES love_pairs(id) ON DELETE CASCADE,

    -- Position
    direction TEXT NOT NULL,                    -- 'long_a_short_b' or 'long_b_short_a'
    leg_a_size NUMERIC,                         -- shares or units
    leg_b_size NUMERIC,
    sizing_method TEXT,                         -- 'dollar_neutral', 'beta_neutral', 'hedge_ratio'

    -- Entry
    entry_date DATE NOT NULL,
    entry_zscore NUMERIC,
    entry_spread NUMERIC,
    entry_thesis TEXT,

    -- Exit (nullable while open)
    exit_date DATE,
    exit_zscore NUMERIC,
    exit_spread NUMERIC,
    exit_reason TEXT,                           -- 'mean_reversion_target', 'stop_loss', 'time_stop', 'thesis_invalidation', 'pair_breakdown'

    -- Performance
    realized_pnl NUMERIC,
    realized_pnl_pct NUMERIC,
    holding_days INT,

    -- Mode
    is_paper BOOLEAN DEFAULT TRUE,

    -- Cross-reference
    huginn_decision_id UUID,                    -- link to Huginn decision that opened this

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Pair-type-specific logic

Different pair types use different discovery and monitoring approaches:

### Sector pairs
- Universe: same GICS sub-industry
- Discovery: cointegration + fundamental similarity
- Entry: z-score breach (typically ±2)
- Exit: mean reversion to z = 0, or stop at z = ±3.5
- Half-life target: 5–30 days

### Cross-listings (e.g., BHP ASX/LSE)
- Universe: known dual-listed securities
- Discovery: structural; same security, different exchange
- Entry: spread breaches FX-adjusted parity by transaction-cost-aware threshold
- Exit: rapid; same-day or next-day reversion expected
- Half-life target: 1–3 days

### Holdco / subsidiary
- Universe: known structural relationships (Berkshire/operating subs in some cases, AU LICs, holding cos)
- Discovery: structural; tracked manually
- Entry: NAV discount/premium reaches outlier levels
- Exit: NAV discount normalizes
- Half-life target: 30–180 days (slower)

### Merger arbitrage
- Universe: announced M&A deals
- Discovery: deal announcements scraped from ASX, SEC filings
- Entry: spread to deal price exceeds completion-probability-adjusted threshold
- Exit: deal completion or break
- Half-life: deal-dependent

### Spin-off pairs
- Universe: announced and recent spin-offs
- Discovery: scrape spin-off calendar
- Entry: parent/spin-off spread post-distribution often inefficient
- Exit: relative valuation normalizes (typically 30–90 days)

### ETF vs basket
- Universe: known ETFs with computable underlying baskets
- Discovery: structural
- Entry: ETF premium/discount to NAV exceeds threshold
- Exit: rapid arb closure
- Half-life target: intraday to 3 days

### Fundamental long-short
- Universe: same sector, similar business model, divergent valuation
- Discovery: fundamental screen (P/E gap + revenue growth gap + ROIC gap)
- Entry: position when fundamentals strongly favor one leg
- Exit: relative re-rating
- Half-life target: 60–365 days (slowest)

## Integration with broader Bowerbird

### Inputs from Magpie
- Live and historical price data for both legs
- Fundamental data (quarterly)
- Volume and liquidity data
- News and event feeds (filtered to active pair legs)

### Outputs to Magpie
- Synthesized pair-level signals (entry, exit, breakdown warnings)
- These flow back through Magpie to ensure all signals route through one ingestion point, simplifying Huginn's view

### Outputs to Huginn
- When a pair signal triggers, Huginn evaluates with full pair context: statistical state, fundamental state, event calendar, regime context
- Huginn's reasoning prompt includes pair-specific sections: "Here's the cointegration history. Here's the fundamental gap. Here's the half-life. Here are similar pair setups from Muninn."

### Inputs from SwanSong
- Regime classification (pair behavior is regime-dependent)
- Fragility score (high fragility → reduce confidence in mean reversion)
- Historical analogue warnings (e.g., "August 2007 quant quake broke pair trading; current regime shows similarities")

### Outputs to Muninn
- Closed pair positions with full attribution
- Pair-specific outcome metrics: half-life realized vs. predicted, breakdown frequency, attribution between leg drift and spread compression
- Pair-level signal reliability scorecards over time

### Outputs to Bower
- Active pairs view: spreads, z-scores, half-lives, P&L
- Candidate pairs view: ranked discovery list with rationale
- Watchlist pairs: monitored but not yet positioned
- Closed pair history with attribution

### Inputs from Lyrebird
- Backtested performance of pair strategies
- Parameter sensitivity (z-score thresholds, half-life filters, sizing methods)
- Historical regime-conditional pair behavior

## Build sequencing

Lovebird sits in the build sequence after Huginn v1 (which has Muninn integration) but before SwanSong v2 integration. Suggested fit within the broader Bowerbird 16-week plan:

| Week | Lovebird task |
|------|---------------|
| 9 | Schema setup; manual pair entry for testing |
| 10 | Cointegration and stationarity test pipeline |
| 11 | Daily snapshot job; spread and z-score computation |
| 12 | Discovery scanner for ASX 200 sector pairs |
| 13 | Signal emission to Magpie; Huginn integration |
| 14 | Cross-listing pair watchlist (BHP, RIO, etc.) |
| Ongoing | Add pair types incrementally; tune discovery filters |

This adds ~5 weeks to the original 16-week plan, pushing the dashboard (Bower) to roughly week 21. Worth it given pair trading is core to your strategy.

## Honest framing

Three things worth keeping visible about pair trading specifically:

**1. Generic statistical arb has been heavily competed away.** The Gatev/Goetzmann/Rouwenhorst papers from the 1990s/2000s identified clear pair trading alpha; subsequent research shows that alpha has decayed substantially as quant funds entered the space. Lovebird's edge is most likely in *selectivity, fundamental overlay, and disciplined risk management*, not in raw statistical arb volume.

**2. Pair trading is uniquely vulnerable to regime change.** August 2007 (the quant quake) hit pair trades before the broader market cracked. March 2020 broke many "stable" pairs as correlations went to 1. The SwanSong integration is critical here, not optional.

**3. Pair trading at retail size has specific cost considerations.** Two legs means double the commission and slippage. Short-leg borrowing costs eat into returns. Tax treatment of paired positions is sometimes awkward. The realistic edge after all-in costs is smaller than backtests suggest.

These are reasons to be selective and patient with pair trades, not reasons to avoid them. Patient, well-researched pair trades during specific dislocations remain a legitimate retail edge. Lovebird is built to find those moments and execute them with discipline.

## Etymology

Lovebirds are small parrots native to Africa and Madagascar. They are famous for forming strong, monogamous pair bonds — pairs preen each other for hours, feed each other, and become visibly stressed when separated. The name maps directly to the component's purpose: finding and maintaining productive pairings between assets, with attention to when those pairings are strong and when they're starting to fail.
