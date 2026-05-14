# SwanSong — Technical Brief

## Component summary

SwanSong is the macro fragility and regime-monitoring component of the Bowerbird Investment Agent platform. Its role is to maintain a structured library of historical 10%+ market drawdown events, monitor live macro indicators, perform regime classification, and surface rare, well-contextualised alerts when the current state strongly resembles historical pre-event conditions.

SwanSong does not predict crashes. It identifies fragility, surfaces analogues, and informs the position sizing and strategy selection of the Huginn decision engine. The system's value is in process discipline and risk management, not prediction. A realistic alert cadence is 4–8 alerts per year — rare, rich, actionable.

## Design principles

1. **Separate facts from interpretations.** Facts (drawdown magnitudes, dates, named events) don't change. Interpretations (root cause attribution, lessons) evolve. Schema must let interpretations update without rewriting history.
2. **Capture pre-state with as much fidelity as the event.** For analogue matching, what the world looked like 6–18 months *before* the drawdown matters more than the drawdown itself.
3. **Quantitative fields for vector matching, qualitative fields for human reasoning.** Both are needed.
4. **Tag arrays over fixed enums** where new categories will emerge (e.g., "AI capex shock" wasn't a category 5 years ago).
5. **Capture what was visible at the time, not just what we know now.** This is what differentiates SwanSong from a postmortem database.

## Database schema

All tables live in Supabase (Postgres + pgvector). Naming convention: `swan_*` prefix.

### `swan_events`

The master record. One row per market drawdown event.

```sql
CREATE TABLE swan_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name TEXT NOT NULL,                        -- "GFC 2008", "COVID Crash"
    short_code TEXT UNIQUE,                    -- "gfc_2008", "covid_2020"

    -- Timing
    pre_event_start DATE,                      -- when fragility began building
    drawdown_start DATE NOT NULL,              -- peak before fall
    drawdown_trough DATE NOT NULL,             -- bottom
    recovery_to_peak DATE,                     -- nullable; some never recover nominally
    duration_to_trough_days INT,
    duration_to_recovery_days INT,

    -- Magnitude (primary index of impact)
    primary_index TEXT NOT NULL,               -- "SPX", "ASX200", "NKY", "HSI"
    peak_value NUMERIC,
    trough_value NUMERIC,
    drawdown_pct NUMERIC NOT NULL,             -- 0.348 for 34.8%

    -- Cross-market
    affected_markets JSONB,                    -- {"SPX": -0.348, "ASX200": -0.398}

    -- Classification
    severity_tier INT NOT NULL,                -- 1: 10-15%, 2: 15-25%, 3: 25-40%, 4: 40%+
    drawdown_character TEXT,                   -- 'flash_crash', 'slow_grind', 'panic_cascade', 'contagion_spiral'

    -- Meta
    description TEXT,                          -- 2-3 paragraph human-readable summary
    historical_significance INT,               -- 1-5

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    embedding VECTOR(1536)                     -- pgvector; for similarity search
);
```

### `swan_triggers`

Events have many triggers. The 1987 crash had portfolio insurance + Fed concerns + dollar weakness + Friday selloff. Don't force a single root cause.

```sql
CREATE TABLE swan_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES swan_events(id) ON DELETE CASCADE,

    category TEXT NOT NULL,                    -- see categories below
    subcategory TEXT,

    name TEXT NOT NULL,                        -- "Lehman bankruptcy"
    trigger_date DATE,
    description TEXT,

    is_primary BOOLEAN DEFAULT FALSE,
    centrality NUMERIC,                        -- 0-1; how central was this

    created_at TIMESTAMPTZ DEFAULT now()
);
```

**Trigger categories** (extensible):
- `monetary_policy`, `fiscal_policy`, `sovereign_debt`
- `banking_crisis`, `credit_event`, `liquidity_event`, `leverage_unwind`
- `war`, `sanctions`, `terrorism`, `civil_unrest`
- `pandemic`, `epidemic`, `public_health`
- `climate`, `natural_disaster`, `famine`, `water_crisis`
- `commodity_shock`, `energy_crisis`, `supply_chain`
- `regulatory`, `judicial`, `antitrust`, `tax_regime`
- `tech_disruption`, `ai_shock`, `cyber_attack`
- `concentration_unwind`, `flash_crash`, `algo_cascade`
- `currency_crisis`, `reserve_currency_event`
- `geopolitical_realignment`, `demographic_shock`
- `narrative_collapse`, `bubble_burst`

### `swan_indicator_snapshots`

The largest table by row count and the most important for analogue matching. Each event has 7+ snapshots (pre_12m, pre_6m, pre_3m, pre_1m, at_peak, at_trough, at_recovery).

```sql
CREATE TABLE swan_indicator_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES swan_events(id) ON DELETE CASCADE,

    snapshot_date DATE NOT NULL,
    snapshot_phase TEXT NOT NULL,              -- 'pre_12m', 'pre_6m', 'pre_3m', 'pre_1m', 'at_peak', 'at_trough', 'at_recovery'

    -- Yield curve & rates
    yield_curve_2s10s NUMERIC,                 -- bp; negative = inverted
    yield_curve_3m10y NUMERIC,
    fed_funds_rate NUMERIC,
    real_rate_10y NUMERIC,

    -- Credit
    ig_credit_spread_bp NUMERIC,
    hy_credit_spread_bp NUMERIC,
    move_index NUMERIC,                        -- bond volatility

    -- Equity valuation & concentration
    primary_index_pe NUMERIC,
    primary_index_cape NUMERIC,
    market_cap_to_gdp NUMERIC,
    top_10_concentration_pct NUMERIC,

    -- Volatility
    vix NUMERIC,
    vix_term_structure NUMERIC,                -- 1m vs 6m; negative = inverted (stress)
    vvix NUMERIC,

    -- Currency
    dxy NUMERIC,
    em_currency_stress_index NUMERIC,

    -- Commodities
    oil_brent NUMERIC,
    gold_usd NUMERIC,
    copper_usd NUMERIC,
    grains_index NUMERIC,

    -- Macro
    global_pmi_manufacturing NUMERIC,
    inflation_yoy_us NUMERIC,
    inflation_yoy_eu NUMERIC,
    inflation_yoy_china NUMERIC,
    unemployment_us NUMERIC,

    -- Fragility / positioning
    margin_debt_pct_gdp NUMERIC,
    retail_call_put_ratio NUMERIC,
    bull_bear_spread NUMERIC,                  -- AAII or similar

    -- Liquidity
    fra_ois_spread_bp NUMERIC,
    repo_rate_stress NUMERIC,

    -- Extensible
    extra JSONB,                               -- emerging indicators
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(event_id, snapshot_date, snapshot_phase)
);
```

NULL fields are expected for older events (CAPE wasn't tracked the same way in 1929; FRA-OIS didn't exist before 2008). Matching can work on partial vectors.

### `swan_leading_indicators`

Qualitative signals that, in retrospect, were predictive. Captures what was *visible at the time* — Burry's CDS positions, Hussman's valuation warnings, the analysts who got 1987 right.

```sql
CREATE TABLE swan_leading_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES swan_events(id) ON DELETE CASCADE,

    indicator_type TEXT NOT NULL,              -- 'analyst_warning', 'news_pattern', 'positioning', 'narrative', 'cross_asset_divergence'
    name TEXT NOT NULL,
    first_visible_date DATE,
    months_before_drawdown NUMERIC,            -- computed

    description TEXT,
    source TEXT,
    source_url TEXT,

    visibility INT,                            -- 1-5; visible to average investor?
    reliability_in_retrospect INT,             -- 1-5

    created_at TIMESTAMPTZ DEFAULT now()
);
```

### `swan_outcomes`

What happened during and after; what was learned. The action library.

```sql
CREATE TABLE swan_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES swan_events(id) ON DELETE CASCADE,

    -- Sector behavior
    sector_winners JSONB,                      -- [{"sector": "consumer_staples", "drawdown": -0.12, "vs_market": +0.20}]
    sector_losers JSONB,

    -- Asset class
    bonds_performance NUMERIC,
    gold_performance NUMERIC,
    dxy_performance NUMERIC,
    crypto_performance NUMERIC,

    -- Recovery
    sectors_leading_recovery JSONB,
    recovery_pattern TEXT,                     -- 'V', 'U', 'L', 'W', 'K'

    -- Policy response
    policy_response_summary TEXT,
    rate_change_during_event NUMERIC,          -- bp; negative = cuts
    qe_announced BOOLEAN,
    fiscal_stimulus_pct_gdp NUMERIC,

    -- Lessons
    primary_lesson TEXT,
    contrarian_lesson TEXT,
    what_would_have_protected TEXT,

    -- Modern relevance
    structural_changes_after TEXT,
    can_recur_today BOOLEAN,
    relevance_today INT,                       -- 1-5

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### `swan_event_tags`

Many-to-many tags for cross-cutting filtering and similarity.

```sql
CREATE TABLE swan_event_tags (
    event_id UUID REFERENCES swan_events(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    PRIMARY KEY (event_id, tag)
);
```

**Example tags** (extensible):
- Geography: `us_centric`, `asia_centric`, `europe_centric`, `global`
- Driver: `currency_driven`, `rates_driven`, `credit_driven`, `equity_driven`
- Speed: `fast_event`, `slow_event`
- Fed regime: `fed_pause_period`, `fed_hiking_period`, `fed_cutting_period`
- Cycle: `late_cycle`, `mid_cycle`, `early_cycle`
- Inflation regime: `high_inflation_regime`, `disinflation_regime`, `deflation_regime`
- Era: `pre_internet`, `post_internet`, `algorithmic_era`, `ai_era`
- Pattern: `first_of_kind`, `recurrence_pattern`

## Seed event list

Don't try to be comprehensive on day one. Start with high-impact, well-documented events and grow outward.

### Tier 1 — Modern, directly applicable (do first)
1. COVID Crash (Feb–Mar 2020)
2. GFC (2007–2009, multi-phase)
3. Dot-com Crash (2000–2002)
4. 1987 Black Monday
5. 2018 Q4 Selloff
6. 2022 Bear Market (rates-driven)
7. SVB / Regional Banking Crisis (Mar 2023)
8. Volmageddon (Feb 2018)
9. Aug 2024 Yen Carry Unwind
10. DeepSeek shock (Jan 2025)

### Tier 2 — Structurally important
11. 1997 Asian Financial Crisis
12. 1998 LTCM / Russia Crisis
13. 2010 Flash Crash
14. 2011 US Debt Ceiling / S&P Downgrade
15. 2015–2016 China Devaluation Selloff
16. 2008 commodity supercycle peak
17. Brexit Vote (Jun 2016)

### Tier 3 — Historical depth
18. 1973–1974 Oil Crisis / Stagflation
19. 1929 Great Crash (and 1937 second leg)
20. 1962 Kennedy Slide
21. 1907 Panic
22. 1990–1991 Recession
23. Plaza Accord aftermath
24. 1980 Volcker shock

### Tier 4 — Specialized analogues
25. 1992 Black Wednesday (currency event)
26. 1994 Bond Massacre
27. 1989 Japan peak
28. 2014–2016 Oil collapse
29. 2021 Archegos
30. 2022 LDI crisis (UK gilts)

Target: 50–100 well-tagged events covers most analogue matching needs.

## Matching algorithm

When SwanSong evaluates current macro state:

1. **Vector similarity on embeddings** — embed current state into the same vector space as historical pre-event states. Top 10 nearest neighbors.
2. **Filter by tags** — exclude pre-internet events if only modern market structure matters.
3. **Indicator-based filtering** — narrow further using current quantitative state (e.g., current yield curve inverted → look at events where pre_12m had inverted curve).
4. **Rank by `relevance_today`** — prioritize matches with high modern relevance.
5. **Surface 3–5 strongest analogues** with full context: triggers, leading indicators visible at the time, outcomes, lessons.

## Alert format

Target: rare, rich, actionable. Example output structure:

```
SWANSONG ALERT — [date]

Fragility score: X.X/10
Regime classification: [late-cycle | mid-cycle | early-cycle], [hiking | pause | cutting], [risk-on | risk-off | transitional]

Strongest historical analogues:
1. [Event name] (similarity: 0.XX)
   - Match drivers: [top 3-5 reasons this matched]
   - Lesson: [primary_lesson from outcomes]
   - What worked: [what_would_have_protected from outcomes]

2. [Event name] (similarity: 0.XX)
   ...

Recommended Huginn context shift:
- [Concrete sizing/strategy adjustments]
- [What to watch for confirmation/invalidation]
```

## Build sequencing

Within the broader Bowerbird Investment Agent build (~3–4 months):

| Week | Task |
|------|------|
| 1 | Create tables in Supabase, enable pgvector |
| 2–4 | Seed Tier 1 events (10 events). Claude drafts entries from research; James reviews and tags. Aim for 3–5 events per week. |
| 5 | Build indicator data ingestion (FRED API + yfinance + paid feeds). Backfill historical snapshots for seeded events. |
| 6 | Embed events; test similarity search. Validate matches feel right (Q4 2007 inputs → finds GFC events). |
| 7–8 | Build alert layer; integrate with Huginn decision engine context. |
| Ongoing | Add 2–5 events per week to scenario library. Iteratively refine schema as gaps appear. |

## Integration with broader Bowerbird

- **Inputs from Magpie**: Magpie aggregates live macro indicator feeds; SwanSong reads these for current-state scoring.
- **Outputs to Huginn**: Fragility score and regime classification feed Huginn's decision context. High fragility automatically biases position sizing more conservatively.
- **Reads from Lyrebird**: Lyrebird can replay past states through SwanSong to test how the system would have classified pre-crisis periods retroactively.
- **Memory in Muninn**: SwanSong alert outcomes are recorded by Muninn for attribution analysis (did the alert correctly precede a drawdown? was the analogue accurate?).

## Honest framing — keep visible

SwanSong is decision support, not prediction. The naming is evocative but the system's job is risk management discipline, not crystal-ball forecasting. Three things to remember:

1. **Markets are non-stationary.** Last decade's lessons may be next decade's traps. The scenario library is a foundation, not a script.
2. **Prediction is structurally hard.** If you could predict it, it wouldn't be a black swan. SwanSong's value is fragility-flagging, analogue matching, and rapid scenario costing — not prediction.
3. **The win shape is asymmetric.** SwanSong won't manifest as "I dodged the crash perfectly." It will manifest as "my drawdown was 18% when the index fell 32%, and I bought back in 6 weeks earlier." That's the shape of the edge, compounded across many decisions.
