# Bowerbird — Platform Brief

## What Bowerbird is

Bowerbird is the Investment Agent platform within James's broader six-domain personal agent infrastructure. It is a multi-component AI-driven decision and risk management system designed for self-directed investing across Australian and global markets, with a deliberate architectural pattern that supports eventual commercial deployment as a SaaS product for self-directed investors.

The platform is named after the Australian Satin Bowerbird, whose males collect only blue objects and arrange them with deliberate aesthetic care. This metaphor captures the system's purpose: filtering vast streams of market noise to keep only what is genuinely valuable, and arranging it for clear thinking.

## What Bowerbird is not

- It is **not** a prediction engine. Markets are non-stationary; reliable prediction is structurally impossible. Bowerbird is decision support and process discipline.
- It is **not** an autonomous trader. Every live-money decision passes through a human approval gate. Default operation is paper trading.
- It is **not** a backtesting tool. It includes a backtester (Lyrebird), but the platform's purpose is forward decision-making informed by structured reasoning over current state.
- It is **not** a charting application. It integrates with TradingView for charting; Bowerbird itself is the reasoning layer that sits behind the charts.

## Core thesis

A disciplined investor operating with:
- Multi-source signal aggregation (technical, fundamental, narrative, macro)
- Structured AI reasoning over those signals with explicit context
- Memory of past decisions and their outcomes feeding future decisions
- Macro fragility awareness with historical analogue matching
- Honest paper-trading and attribution before live capital flows

...operates with information advantage and process discipline that compounds across many decisions over many years. The win shape is not "predicted the crash" but "smaller drawdowns, faster recoveries, better-sized positions, fewer emotional errors."

## Component overview

Bowerbird consists of six named components plus a shared dashboard, each with a distinct role:

| Component | Role | Inspiration |
|-----------|------|-------------|
| **Magpie** | Signal aggregation | Corvid known for collecting shiny items |
| **Huginn** | Decision engine | Norse: Odin's raven of thought |
| **Muninn** | Memory and learning | Norse: Odin's raven of memory |
| **SwanSong** | Macro fragility and regime monitor | The song before the fall |
| **Lovebird** | Pair trading discovery and management | Famously pair-bonding parrot |
| **Lyrebird** | Simulator and backtester | Australian bird, perfect mimic |
| **Bower** | Unified dashboard | The bowerbird's display structure |

The naming carries three intentional cultural threads:
- **Australian and avian collectors** (Bowerbird, Magpie, Lyrebird, Lovebird) — anchors the platform in its market context and reinforces the "gathering and curating" metaphor
- **Norse mythological pairing** (Huginn / Muninn) — describes the architectural relationship between thought and memory directly
- **Literary** (SwanSong, Bower) — gives the system the gravitas appropriate to a tool used for real money decisions

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL DATA SOURCES                                      │
│  Stake · TradingView · YouTube · News feeds · Super funds  │
│  FRED · yfinance · ASIC filings · Notion knowledge base    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
              ┌──────────────────────────────┐
              │         MAGPIE               │◀────┐
              │  Signal aggregation          │     │
              │  Webhook receiver            │     │ pair signals
              │  Normalization & dedup       │     │
              └────┬──────────┬──────────┬───┘     │
                   │          │          │         │
                   ▼          ▼          ▼         │
          ┌────────────┐ ┌────────┐ ┌──────────────┴──┐
          │  SWANSONG  │ │ HUGINN │ │    LOVEBIRD     │
          │  Fragility │▶│Decision│ │  Pair discovery │
          │  & regime  │ │ engine │ │  & monitoring   │
          └────────────┘ └───┬────┘ └────────┬────────┘
                ▲            │               │
                │            ▼               │
                │      ┌──────────┐          │
                │      │  MUNINN  │◀─────────┘
                └──────│ Memory & │  outcomes
                       │ learning │
                       └────┬─────┘
                            │
                            ▼
                      ┌──────────┐
                      │ LYREBIRD │
                      │Simulator │
                      │ & replay │
                      └────┬─────┘
                           │
                           ▼
                      ┌─────────┐
                      │  BOWER  │
                      │Dashboard│
                      └─────────┘
```

### Data flow narrative

**1. Inbound** — Magpie receives webhooks from the IA indicator suite, TradingView alerts, YouTube transcript completion events, news feeds, and scheduled fetches from APIs (FRED, yfinance, Stake, super fund portals). Signals are normalized, time-aligned, and deduplicated before storage.

**2. Macro context** — SwanSong continuously evaluates aggregated indicator state. It maintains a fragility score, regime classification, and matched historical analogues. Most of the time SwanSong is quiet. Occasionally it fires alerts when fragility crosses thresholds or strong analogues to pre-event historical states emerge.

**3. Decision** — When a signal warrants action (or on scheduled review intervals), Huginn fetches: recent relevant signals from Magpie, current regime context from SwanSong, similar past decisions from Muninn, current portfolio state, and active strategy parameters. It reasons through a structured protocol and produces a decision proposal with conviction, sizing, and exit conditions.

**4. Approval and execution** — Decision proposals route to James via Telegram/Slack for approval. Approved decisions execute as paper trades by default (recording intended action without real money flow). Live execution against Stake requires explicit live-mode opt-in per decision.

**5. Memory** — Muninn records every decision with a complete context snapshot. At T+1, T+7, and T+30 it records outcomes. Periodically it analyzes signal reliability, updates strategy memory, and refines the context that feeds future decisions.

**6. Simulation** — Lyrebird replays past states through current Huginn logic to test strategy variants. It feeds backtest results back to Bower for visualization and to Muninn for comparison against actual outcomes.

**7. Visualization** — Bower presents live portfolio state, recent decisions, active alerts, simulation results, and attribution analysis in a unified web UI hosted on the agent box and accessed via Tailscale.

## Components in detail

### Magpie — signal aggregation

**Purpose**: Single point of ingestion for everything the rest of the system reasons over. Magpie's job is to make signals consistent, time-aligned, and queryable regardless of source heterogeneity.

**Responsibilities**:
- Webhook receivers for IA indicator suite, TradingView alerts
- Scheduled fetchers for FRED macro data, yfinance prices, Stake portfolio state, super fund monitoring
- YouTube transcript ingestion (Whisper for audio if no transcript), summarization, signal extraction
- News feed monitoring with sentiment classification
- Normalization to a common signal schema regardless of source
- Deduplication and time-alignment
- Rate-limiting and backoff for external APIs
- Persistence to Supabase

**Key schemas**:
- `magpie_signals` — normalized signal records (source, type, asset, strength, confidence, raw_payload, ingested_at)
- `magpie_sources` — registry of signal sources with metadata (reliability scores, rate limits, auth)
- `magpie_runs` — log of fetch operations for debugging and observability

**Build complexity**: medium. Heavy on integration plumbing, light on novel logic.

**External dependencies**: TradingView Premium (for webhook alerts), FRED API key, Stake API access (or scraper), YouTube Data API, Whisper, Notion API.

---

### Huginn — decision engine

**Purpose**: The structured reasoning layer. Takes signals plus context and produces decisions with full attribution.

**Responsibilities**:
- Fetch current state: signals, regime, portfolio, similar past decisions, active strategies
- Construct structured prompt with explicit reasoning protocol
- Call Claude with reasoning steps that must be followed
- Parse structured output: decision, sizing, conviction, primary drivers, counter-arguments considered, exit conditions
- Route decision to approval queue (default: Telegram)
- Execute as paper trade on approval, or live on explicit opt-in
- Record every decision and its full context to Muninn

**Reasoning protocol** (Claude must follow):
1. Restate the signals received in own words
2. Identify confirmation versus contradiction across signals
3. Reference 2–3 similar historical setups from Muninn's retrieval
4. State the macro environment's effect on this trade type (from SwanSong context)
5. Identify the strongest argument against the trade
6. Make decision: open / close / hold / size
7. State conviction (1–5) and what would change this view
8. Define exit conditions: take-profit, stop-loss, time-stop, thesis-invalidation

**Output schema** (illustrative):
```json
{
  "decision": "open_long",
  "asset": "ASX:CSL",
  "size_pct_portfolio": 3.5,
  "conviction": 3,
  "reasoning": "...",
  "primary_drivers": ["earnings_beat", "yt_sentiment_shift"],
  "counter_arguments_considered": "...",
  "regime_context": "late_cycle, hiking_pause",
  "exit_conditions": {
    "take_profit": 0.12,
    "stop_loss": 0.05,
    "time_stop_days": 45,
    "thesis_invalidation": "..."
  }
}
```

**Key schemas**:
- `huginn_decisions` — every decision with full context snapshot, structured fields, embedding for similarity retrieval
- `huginn_strategies` — active strategy definitions and parameters
- `huginn_approvals` — pending decisions awaiting human approval

**Build complexity**: high. Prompt design will go through many iterations. Structured output parsing needs to be robust to model variation.

**External dependencies**: Claude API (Sonnet for routine decisions, Opus for high-conviction reviews).

---

### Muninn — memory and learning

**Purpose**: The system's institutional memory. Records what was decided, what happened, and feeds the lessons back into future decisions.

**Three flavors of learning**:

**1. Outcome attribution** — mechanical, easy. For every decision, record outcomes at T+1, T+7, T+30. Run periodic analysis: which signals correlate with positive outcomes, which combinations work, which are noise. Output: signal reliability scorecards that feed back into Huginn's context.

**2. Memory-based retrieval** — when Huginn evaluates a new decision, retrieve the 5–10 most similar past decisions (vector similarity on signal+context embeddings) along with their outcomes. Inject as context: "Here are similar setups you've seen before and what happened." This is RAG over decision history.

**3. Strategy memory updates** — periodically (weekly, monthly), a separate Claude call reviews recent decisions and outcomes and updates a "strategy notes" document. "When momentum signals fire alongside negative macro, the win rate dropped to 38% over the last 90 days. Down-weight this combination." This document feeds Huginn's prompt as additional context.

**Responsibilities**:
- Persist every Huginn decision with full context snapshot
- Track outcomes at T+1, T+7, T+30 (price changes, P&L, thesis validation)
- Maintain pgvector embeddings of decision contexts
- Provide similarity retrieval API for Huginn
- Run scheduled attribution analyses
- Maintain self-updating strategy memory document
- Surface attribution and reliability data to Bower dashboard

**Key schemas**:
- `muninn_decisions` — extends `huginn_decisions` with outcome fields and embeddings
- `muninn_outcomes` — time-series of decision outcomes (T+1, T+7, T+30, T+90, T+365)
- `muninn_signal_reliability` — running statistics on signal predictive value
- `muninn_strategy_notes` — versioned strategy memory document

**Build complexity**: medium-high. The retrieval and attribution logic is straightforward; the strategy memory meta-layer requires careful prompt design.

**External dependencies**: Claude API, pgvector (Supabase extension).

---

### SwanSong — macro fragility and regime monitor

**Purpose**: Continuously evaluate macro state, classify regime, match against historical analogue library, fire rare and rich alerts when fragility is elevated.

**See SWANSONG_BRIEF.md for full schema and seed event list.** Summary here for completeness:

**Responsibilities**:
- Maintain scenario library of historical 10%+ drawdowns with rich pre-event indicator snapshots, leading signals, outcomes, lessons
- Continuously ingest macro indicators via Magpie
- Compute fragility score (composite of yield curve, credit spreads, concentration, positioning, liquidity stress)
- Classify regime (cycle position, monetary stance, risk-on/off, inflation regime)
- Run similarity matching: current state versus historical pre-event states
- Fire alerts on threshold breaches or strong analogue matches
- Feed regime context and fragility score to Huginn's decision context

**Alert cadence**: target 4–8 per year. Rare, rich, actionable. Crying wolf is the failure mode to avoid.

**Key schemas**:
- `swan_events` — historical drawdown events
- `swan_triggers` — proximate causes per event
- `swan_indicator_snapshots` — quantitative state at multiple pre-event phases
- `swan_leading_indicators` — qualitative warning signals visible at the time
- `swan_outcomes` — sector behavior, recovery patterns, lessons
- `swan_event_tags` — cross-cutting tags for filtering
- `swan_regime_state` — current rolling assessment

**Build complexity**: high. Schema is large, scenario library curation is genuinely tedious work, similarity matching requires careful tuning.

**External dependencies**: FRED API, yfinance, paid feeds for some indicators (sovereign CDS, retail positioning), Claude API for analogue interpretation.

---

### Lovebird — pair trading discovery and management

**Purpose**: Identify candidate pairs, monitor active pair positions, track fundamental and statistical relationships between paired assets, and produce pair-specific signals that flow back through Magpie to Huginn.

**See LOVEBIRD_BRIEF.md for full schema and pair-type-specific logic.** Summary here for completeness:

**Responsibilities**:
- Pair discovery across defined universes (sector pairs, cross-listings, holdco/sub, merger arb, spin-offs, ETF/basket, fundamental long-short)
- Cointegration and stationarity testing, half-life computation, regime stability scoring
- Daily monitoring of active pair statistics: spread, z-score, half-life, beta drift, correlation regime
- Fundamental diff tracking: P/E, FCF yield, growth, ROIC differences across pair legs
- Event watch: earnings, M&A, index changes, regulatory events affecting either leg
- Sizing computations: dollar-neutral, beta-neutral, hedge-ratio
- Outcome tracking with pair-specific attribution

**Key schemas**:
- `love_pairs` — pair registry (candidate, watchlist, active, closed, broken)
- `love_pair_snapshots` — daily statistical state
- `love_fundamental_diffs` — quarterly fundamental relationships
- `love_pair_events` — events affecting pair legs
- `love_pair_signals` — entry/exit/breakdown signals fired back to Magpie
- `love_pair_positions` — active and historical positions

**Pair types supported**: sector, cross-listing, holdco/subsidiary, merger arbitrage, spin-off, ETF/basket, fundamental long-short. Each has its own discovery and monitoring logic.

**Build complexity**: medium-high. Statistical pipeline is well-trodden territory; the pair-type variation and the SwanSong integration for regime-aware confidence add complexity.

**External dependencies**: pandas, numpy, statsmodels (for cointegration tests), yfinance for historical prices, fundamental data feeds.

**Critical SwanSong integration**: pair trading is uniquely vulnerable to regime change. August 2007 quant quake hit pair traders before the broader market cracked. SwanSong's regime context modulates Lovebird's confidence in mean reversion — high fragility automatically reduces position sizing and tightens stops on active pairs.

---

### Lyrebird — simulator and backtester

**Purpose**: Replay historical states through current Huginn logic to test strategies, run parameter sweeps, and validate the decision engine's would-have performance.

**Responsibilities**:
- vectorbt-based backtesting engine
- Read decision logs from Muninn and price history from Magpie
- Replay engine: "what would Huginn have decided on each historical day"
- Strategy comparison: run multiple strategy variants in parallel
- Parameter sweeps: identify sensitivity to thresholds and weights
- Compare engine decisions versus actual market outcomes
- Surface results to Bower dashboard
- Support what-if scenarios: "simulate this strategy assuming property settlement releases $X in 6 months"

**Key schemas**:
- `lyrebird_runs` — backtest run metadata (strategy, parameters, date range)
- `lyrebird_results` — per-run performance metrics (returns, drawdowns, Sharpe, hit rate)
- `lyrebird_trades` — simulated trades from each run

**Build complexity**: medium. vectorbt does the heavy lifting; integration glue and comparison logic is the work.

**External dependencies**: vectorbt (or vectorbt Pro), pandas, numpy, yfinance for historical price data.

---

### Bower — unified dashboard

**Purpose**: Single-screen view of platform state, accessible from any device on James's Tailscale network.

**Sections**:
- **Live state** — current portfolio, recent decisions (last 7 days), open positions
- **Magpie activity** — signal stream, source health, recent ingestions
- **Huginn queue** — pending approvals, recent decisions with conviction levels
- **SwanSong status** — current fragility score, regime classification, active alerts, top historical analogues
- **Muninn attribution** — signal reliability scorecards, strategy performance, recent learnings
- **Lyrebird results** — last backtest summaries, strategy comparison views

**Tech**: React or Vue SPA, served from agent box via Caddy/Traefik with TLS, accessed over Tailscale. Data layer reads directly from Supabase. No public exposure.

**Build complexity**: medium. Standard CRUD/dashboard work, but visualization quality matters for usability.

**External dependencies**: React/Vue, Recharts or D3 for visualization, Supabase JS client.

## Cross-component integration points

| From → To | What flows |
|-----------|-----------|
| Magpie → SwanSong | Macro indicator updates trigger fragility recomputation |
| Magpie → Huginn | New trade-relevant signals trigger decision evaluation |
| Magpie → Lovebird | Live and historical prices, fundamentals, events for pair legs |
| SwanSong → Huginn | Regime context and fragility score injected into decision prompt |
| SwanSong → Lovebird | Regime classification modulates pair confidence and sizing |
| Lovebird → Magpie | Synthesized pair-level signals (entry, exit, breakdown warnings) |
| Lovebird → Huginn | Pair-specific context when Huginn evaluates pair signals |
| Muninn → Huginn | Similar past decisions retrieved and injected as context |
| Muninn → Huginn | Strategy memory document injected as context |
| Huginn → Muninn | Every decision recorded with full context snapshot |
| Lovebird → Muninn | Closed pair outcomes with pair-specific attribution |
| Huginn → Telegram/Slack | Approval requests sent to user |
| Magpie → Lyrebird | Historical price data for backtests |
| Muninn → Lyrebird | Decision logs for replay analysis |
| Lyrebird → Muninn | Backtest results compared against actual outcomes |
| Lyrebird → Lovebird | Backtested pair strategy performance, parameter sensitivity |
| All → Bower | Dashboard reads from all component schemas |

## Shared infrastructure

**Database**: Supabase Cloud, single project, schema-per-component naming convention (`magpie_*`, `huginn_*`, `muninn_*`, `swan_*`, `lyrebird_*`). pgvector extension enabled for embeddings. Row-level security configured per component.

**Orchestrator**: Existing Python orchestrator with `@tool` decorator pattern. Each component exposes its operations as tools registered with the orchestrator. The orchestrator routes work between components via the existing domain router.

**Compute**: Minisforum AI X1 Pro-370 running Ubuntu Server 24.04 LTS, headless. All components run as Docker containers via Docker Compose. Tailscale provides remote access. Caddy reverse proxy with automatic TLS for Bower.

**Local LLM (future)**: Ollama with Qwen 2.5 7B or 14B for embedding generation, signal classification, and other high-volume low-stakes inference. Cloud Claude (Sonnet/Opus) for all reasoning-heavy work.

**Interfaces**: Telegram bot for mobile interaction (approvals, queries, alerts). Slack bot for desktop. Bower web UI for full visibility.

**Memory and knowledge**: Notion as universal knowledge base, including SwanSong scenario library research notes. NotebookLM for deep research per asset/sector. Cross-references stored in Supabase.

**Observability**: Portainer for container management, Dozzle for live logs, Uptime Kuma for service health, Cockpit for OS-level admin. Homepage as unified GUI dashboard for infrastructure (separate from Bower, which is the Bowerbird application dashboard).

## Build sequencing

Bowerbird builds in phases over approximately 3–4 months, sequenced so each component is testable before the next is built on top of it. Sequence assumes the agent box is operational and the existing orchestrator is migrated.

| Phase | Duration | Components | Outcome |
|-------|----------|------------|---------|
| **0. Foundation** | Week 1 | Schema setup, Docker Compose, agent box deployment | Empty platform, Supabase ready, orchestrator connected |
| **1. Magpie** | Weeks 2–3 | Magpie signal aggregation | Live signals flowing into Supabase from at least 3 sources |
| **2. Huginn v0** | Weeks 4–5 | Decision engine without memory or regime context | Decisions proposed and routed to Telegram for approval, paper-traded only |
| **3. Muninn** | Weeks 6–7 | Decision logging, outcome tracking, retrieval | Decisions recorded; T+1 outcomes tracked; similarity retrieval working |
| **4. Huginn v1** | Week 8 | Integrate Muninn retrieval into Huginn context | Decisions now informed by similar past decisions |
| **5. SwanSong** | Weeks 9–11 | Schema, scenario library seed (Tier 1, 10 events), fragility scoring | SwanSong publishes regime classification and fragility score |
| **6. Huginn v2** | Week 12 | Integrate SwanSong context into Huginn | Regime-aware decision sizing |
| **7. Lovebird** | Weeks 13–17 | Pair schema, cointegration pipeline, daily snapshots, discovery scanner, signal emission to Magpie, cross-listing watchlist | Lovebird actively discovering and monitoring pairs; pair signals flowing into Huginn |
| **8. Lyrebird** | Weeks 18–19 | Backtester and replay engine | Can replay any strategy variant against historical data, including pair strategies |
| **9. Bower** | Weeks 20–21 | Unified dashboard | Single-screen view of all platform state |
| **Ongoing** | — | Scenario library expansion (Tier 2, 3, 4); pair type expansion | 50–100 events tagged over 6–12 months; pair types added incrementally |

This sequence intentionally puts Huginn into paper-trading mode in week 5 so the system is generating real decision data while the rest of the components are built. Muninn's value compounds with decision count, so starting the log early is high-leverage.

## Design principles

**1. Decision support, not oracle.** Huginn proposes, James decides. Every live-money decision passes through human approval. The system's value is structured thinking, not delegation of judgment.

**2. Process discipline as primary value capture.** Even if the AI reasoning adds zero alpha, the discipline of articulating decisions before making them, recording them, and reviewing outcomes systematically is itself a meaningful edge over the average retail investor.

**3. Paper trade extensively before live capital flows.** Default mode is paper trading. Live execution requires explicit opt-in per decision. The first six months should be paper-only regardless of how good the system seems.

**4. Rare alerts with rich context.** SwanSong fires sparingly. Magpie surfaces signals only when they pass relevance thresholds. Notification fatigue is the failure mode to design against.

**5. Vector similarity and structured retrieval over fine-tuning.** Use Claude's in-context learning rather than training custom models. Curated memory beats fine-tuned weights for systems where lessons evolve.

**6. Each component testable in isolation.** Magpie must produce signals without knowing about Huginn. Muninn must store decisions without knowing about SwanSong. Loose coupling via shared schemas, not tight coupling via shared code.

**7. Architecture mirrors Option 4 → 5 multi-agent pattern.** Specialist agents handing off work, with shared memory and feedback. Bowerbird is the proving ground for the multi-agent pattern that later applies to Apparition's pipeline and beyond.

**8. Honest framing in language and naming.** SwanSong identifies fragility, doesn't predict. Huginn proposes, doesn't command. The naming and copy throughout reflects what the system actually does, not what would sound impressive in marketing.

**9. Australian and Norse cultural threads in naming.** Bowerbird, Magpie, Lyrebird anchor the platform in its market context. Huginn / Muninn describe the architectural relationship between thought and memory directly. SwanSong gives weight to the macro layer.

**10. Built for the long arc.** Edge in markets compounds over decades, not quarters. The platform is designed to still be useful in 2035.

## Integration with broader stack

Bowerbird is one of six domains in James's personal agent infrastructure. It integrates with the others as follows:

- **Legal agent**: Bowerbird's portfolio state and Investment domain financial data feed into the Legal agent's asset register, particularly relevant during active property settlement proceedings.
- **Life Admin**: Tax-relevant transactions surfaced from Bowerbird flow to Life Admin for record-keeping. Capital gains events trigger Life Admin reminders.
- **Health Protocol**: No direct integration.
- **SaaS Business** (Apparition, paused): The architectural patterns proven in Bowerbird (multi-agent specialists, shared memory, structured reasoning) transfer directly to Apparition's image generation pipeline when it resumes.
- **Supplement Brand**: Cross-references possible if the brand becomes a meaningful financial position, but no real integration planned.

The orchestrator routes cross-domain queries naturally: "What's my net position including pending settlement payout, and how does Bowerbird's risk model recommend allocating it?" routes to both Legal and Bowerbird, with Huginn's reasoning incorporating the cross-domain context.

## Honest framing — keep visible

Three things to internalize and revisit when the system gets too clever for its own good:

**1. Markets are non-stationary.** Last decade's lessons may be next decade's traps. The scenario library is foundation, not script. Strategy memory is rolling, not permanent.

**2. AI reasoning over markets has not been demonstrated to generate alpha.** Sophisticated quant funds with PhDs and microsecond execution barely beat the index after fees. Don't expect Bowerbird to outperform on raw returns alone. Expect it to make better decisions, more consistently, with better risk management — that's the realistic edge.

**3. The win shape is asymmetric.** Bowerbird won't manifest as "I dodged the crash perfectly." It will manifest as "my drawdown was 18% when the index fell 32%, and I bought back in 6 weeks earlier." That is the shape of the edge, compounded across many decisions over many years.

If at any point the system or its operator starts to believe Bowerbird predicts markets, that's the moment to step back and re-read this section.

## Document set

- **BOWERBIRD_PLATFORM.md** — this document
- **BOWERBIRD_BRAND_GUIDE.md** — visual identity and voice
- **SWANSONG_BRIEF.md** — full SwanSong schema and seed events
- **LOVEBIRD_BRIEF.md** — full Lovebird schema and pair-type logic
- (future) **MAGPIE_BRIEF.md**
- (future) **HUGINN_BRIEF.md**
- (future) **MUNINN_BRIEF.md**
- (future) **LYREBIRD_BRIEF.md**
- (future) **BOWER_BRIEF.md** — dashboard spec
