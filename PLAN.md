# Bellbird — Build Plan

This document is the complete project plan. Read it in full before writing code.

---

## 1. Project overview

### What Bellbird is

A personal investment thesis development workspace built around a structured AI pipeline. Sits as the third tool in a three-bird stack:

- **Bellbird (this project)** — Ideation. Develops and refines theses with structured deliberation. Curates the watchlist. Stress-tests against contrarian models. Surfaces cross-thesis patterns.
- **Wedgetail** — Surveillance. Watches markets continuously, surfaces triggers, tracks earnings/economic calendars. Already started by James.
- **Bowerbird** — Decision infrastructure. The long-arc platform with decision engine, memory, fragility monitor. ~21-week build.

Data flows: ideas → Bellbird → Wedgetail (triggers) → Bowerbird (decisions). Wedgetail can feed observations back to Bellbird.

### Design philosophy

- **Editorial restraint** — generous typography, considered spacing, minimal motion. Warm cream palette, not dark mode.
- **The bell metaphor** — rare, well-considered observation. Quieter than song; deliberate clear notes. Motion is itself a meaningful signal (used sparingly).
- **Single user** — no multi-tenancy concerns. Personal financial tooling for James only.
- **Ideas before signals** — this tool is upstream of monitoring. Develops the thinking. Other tools surveil and execute.

---

## 2. Architecture

### Stack

| Layer | Choice | Reasoning |
|---|---|---|
| Framework | Next.js 15 App Router | Server Components, streaming, Vercel-native |
| Language | TypeScript strict | Type safety throughout |
| Styling | Tailwind CSS | Utility-first, design tokens in `lib/tokens.ts` |
| Database | Supabase Postgres | Free tier sufficient, includes auth |
| Auth | Supabase Auth, magic link | Single user, no password management |
| State | TanStack Query | Server state caching |
| Hosting | Vercel | Auto-deploy from main branch |
| Bellbird AI | Anthropic Opus 4.7 | Phase 1 development, Phase 2 structuring, Phase 4 adjudication |
| Adversarial AI | xAI Grok-4 | Phase 3 stress test, contrarian view |

### The four-phase AI pipeline (core architectural decision)

This is the defining architecture of the Develop mode. Every thesis flows through it.

```
┌────────────────────────────────────────────────────┐
│ PHASE 1: Initial development (Opus 4.7)            │
│ Slower turns acceptable (8-20s). This is the IP.   │
└────────────────────────────────────────────────────┘
                       │
                       ▼  (user marks "ready for review")
┌────────────────────────────────────────────────────┐
│ PHASE 2: Structuring (Opus 4.7)                    │
│ Faithful structuring of Phase 1's reasoning.       │
└────────────────────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────┐
│ PHASE 3: Adversarial review (Grok-4)               │
│ Auto-fires. Returns contrarian arg + disagreement. │
└────────────────────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────┐
│ PHASE 4: Adjudication (Opus 4.7)                   │
│ Reads thesis + Grok. Returns verdict + reasoning.  │
│ Verdicts: PROCEED / STRESS_TEST / CLARIFY / DISCARD│
│ User can challenge; Opus re-evaluates.             │
└────────────────────────────────────────────────────┘
```

**Cost shape per thesis added to library: ~$3.60-7.15**

### Folder structure

```
bellbird/
├── app/
│   ├── (app)/                    # Authenticated routes
│   │   ├── library/page.tsx
│   │   ├── develop/page.tsx
│   │   ├── portfolio/page.tsx
│   │   ├── cycles/page.tsx
│   │   └── layout.tsx
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── api/
│   │   ├── chat/route.ts         # Opus streaming for Phase 1
│   │   ├── structure/route.ts    # Opus for Phase 2
│   │   ├── stress-test/route.ts  # Grok for Phase 3
│   │   ├── adjudicate/route.ts   # Opus for Phase 4
│   │   ├── seed/route.ts         # One-time thesis import
│   │   └── macro/refresh/route.ts # Cron for FRED data
│   ├── page.tsx                  # Identity / landing
│   └── layout.tsx
├── components/
│   ├── library/
│   ├── develop/
│   ├── portfolio/
│   ├── cycles/
│   └── shared/
├── lib/
│   ├── supabase/
│   ├── ai/
│   │   ├── anthropic.ts
│   │   ├── xai.ts
│   │   └── prompts/              # System prompts per phase
│   ├── tokens.ts
│   └── types.ts
├── db/
│   └── schema.sql
├── references/                   # Read-only inspiration
│   ├── bellbird-mockup.jsx
│   └── theses-book.jsx
├── public/
└── ... (configs)
```

---

## 3. Data model

Full Postgres schema. Run this in Supabase SQL editor before deploying.

```sql
-- Theses: the core thesis records
CREATE TABLE theses (
  id TEXT PRIMARY KEY,                       -- e.g. 'grid-resilience-2026'
  name TEXT NOT NULL,
  sector TEXT,
  conviction INT NOT NULL CHECK (conviction >= 0 AND conviction <= 100),
  timing TEXT,
  status TEXT NOT NULL DEFAULT 'active',     -- 'active' | 'watching' | 'closed'
  cycle_stage TEXT,                          -- 'secular' | 'long-cycle' | 'mid-cycle' | 'credit-cycle' | 'narrative-cycle'
  summary TEXT,
  hedge_note TEXT,
  in_portfolio BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_theses_cycle_stage ON theses(cycle_stage);
CREATE INDEX idx_theses_status ON theses(status);

-- Positions: target allocations within each thesis (not actual trades)
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thesis_id TEXT REFERENCES theses(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  weight NUMERIC NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('long', 'short', 'hedge')),
  valuation TEXT,
  upside NUMERIC,
  notes TEXT,
  position_order INT,                        -- for ordering within thesis
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_positions_thesis ON positions(thesis_id);

-- Trades: actual executed trades (entry/exit)
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thesis_id TEXT REFERENCES theses(id) ON DELETE SET NULL,
  ticker TEXT NOT NULL,
  side TEXT NOT NULL,                        -- 'buy' | 'sell'
  quantity NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'AUD',
  fees NUMERIC DEFAULT 0,
  executed_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trades_thesis ON trades(thesis_id);
CREATE INDEX idx_trades_ticker ON trades(ticker);

-- Conversations: Develop mode threads
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thesis_id TEXT REFERENCES theses(id) ON DELETE SET NULL,
  title TEXT,                                -- auto-generated summary
  status TEXT DEFAULT 'open',                -- 'open' | 'phase_2' | 'phase_3' | 'phase_4' | 'completed' | 'discarded'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Messages: individual turns in a conversation
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,                        -- 'user' | 'assistant'
  model TEXT,                                -- 'opus-4.7' | 'sonnet-4.6' | 'grok-4' | null for user
  phase INT,                                 -- 1, 2, 3, or 4 (null for user)
  content TEXT NOT NULL,
  metadata JSONB,                            -- tokens, latency, cost estimate
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);

-- Stress tests: Grok phase 3 outputs
CREATE TABLE stress_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  thesis_snapshot JSONB NOT NULL,            -- frozen thesis state at time of test
  contrarian_argument TEXT NOT NULL,
  disagreement_matrix JSONB,                 -- [{claim, claude_view, grok_view, severity}]
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Opus verdicts: phase 4 adjudications
CREATE TABLE opus_verdicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  stress_test_id UUID REFERENCES stress_tests(id),
  verdict TEXT NOT NULL CHECK (verdict IN ('PROCEED', 'STRESS_TEST', 'CLARIFY', 'DISCARD')),
  reasoning TEXT NOT NULL,
  user_challenge TEXT,                       -- null if user accepted, populated if challenged
  user_override BOOLEAN DEFAULT false,
  final_decision TEXT,                       -- after challenge if applicable
  created_at TIMESTAMPTZ DEFAULT now()
);

-- News items: paste-in news with impact analysis (v1.1+)
CREATE TABLE news_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url TEXT,
  source_name TEXT,
  headline TEXT NOT NULL,
  content TEXT,
  impact_summary TEXT,                       -- Sonnet first pass
  affected_thesis_ids TEXT[],                -- array of thesis IDs flagged as affected
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Triggers: for Watch mode (v1.1+)
CREATE TABLE triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thesis_id TEXT REFERENCES theses(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  trigger_date DATE,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',             -- 'pending' | 'fired' | 'dismissed'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Macro indicators: time series cached from FRED for Cycles page
CREATE TABLE macro_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id TEXT NOT NULL,                   -- FRED series ID, e.g. 'CPILFESL'
  display_name TEXT NOT NULL,
  category TEXT,                             -- 'rates' | 'credit' | 'equity' | 'real_economy' | 'sentiment'
  observation_date DATE NOT NULL,
  value NUMERIC,
  yoy_change NUMERIC,
  z_score_30y NUMERIC,                       -- standardized vs 30-year history
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(series_id, observation_date)
);

CREATE INDEX idx_macro_series_date ON macro_indicators(series_id, observation_date DESC);
CREATE INDEX idx_macro_category ON macro_indicators(category);

-- Cycle readings: derived current state for the three cycles
CREATE TABLE cycle_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_name TEXT NOT NULL,                  -- 'credit' | 'equity' | 'juglar'
  reading_date DATE NOT NULL,
  status TEXT NOT NULL,                      -- 'healthy' | 'caution' | 'alert'
  classification TEXT,                       -- 'late expansion' | 'turning' | 'recovery' etc.
  detail TEXT,
  contributing_series JSONB,                 -- which indicators drove this reading
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cycle_name, reading_date)
);

-- Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER theses_updated_at BEFORE UPDATE ON theses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 4. Macro indicators for Cycles page (Turn 5)

12 FRED series to populate the Cycles dashboard:

| Display name | FRED series ID | Category | Why it matters |
|---|---|---|---|
| Real GDP growth | A191RL1Q225SBEA | real_economy | Headline growth |
| Real wage growth | LES1252881600Q | real_economy | Median wages adjusted for CPI |
| Core CPI YoY | CPILFESL | real_economy | Fed's preferred inflation measure |
| Unemployment | UNRATE | real_economy | Cycle position |
| Fed Funds Rate | FEDFUNDS | rates | Policy stance |
| 2s10s Yield Curve | T10Y2Y | rates | Recession leading indicator |
| HY Credit Spreads | BAMLH0A0HYM2 | credit | Credit stress |
| IG Credit Spreads | BAMLC0A0CM | credit | Investment grade health |
| VIX | VIXCLS | sentiment | Equity fear gauge |
| DXY (USD Index) | DTWEXBGS | rates | USD strength |
| ISM Manufacturing | NAPM | real_economy | Manufacturing health (lagged) |
| Capacity Utilization | TCU | real_economy | Slack in economy |

**Sample size:** 30 years of history. Daily series can be downsampled to weekly for storage efficiency. Monthly series stored as-is.

**Refresh frequency:** Daily via Vercel cron. Most series update weekly or monthly; daily refresh ensures we catch updates within 24 hours.

---

## 5. Build sequence — five turns

Each turn ends with something deployable and testable.

### Turn 1: Project skeleton

**Goal:** Live Bellbird at `localhost:3000` showing Identity page with full design system. Deployable to Vercel even though most features aren't built.

**Deliverables:**
- All root configs (package.json, tsconfig, next.config, tailwind.config, postcss.config, .env.example, .gitignore, README.md)
- `db/schema.sql` — full schema from section 3
- `app/layout.tsx` — root layout with font loading
- `app/page.tsx` — Identity page (port from mockup)
- `app/(app)/layout.tsx` — shared header/footer for authenticated routes
- `app/(app)/library/page.tsx` — placeholder "Coming in Turn 2"
- `app/(app)/develop/page.tsx` — placeholder
- `app/(app)/portfolio/page.tsx` — placeholder
- `app/(app)/cycles/page.tsx` — placeholder
- `components/shared/Header.tsx` — mode switcher
- `components/shared/Footer.tsx`
- `components/shared/IdentityScreen.tsx` — the home content
- `lib/tokens.ts` — design tokens
- `lib/types.ts` — initial TypeScript types
- `lib/supabase/client.ts` — Supabase browser client
- `lib/supabase/server.ts` — Supabase server client
- `references/` folder with `bellbird-mockup.jsx` and `theses-book.jsx` saved

**User tasks during Turn 1:**
1. Run `npm install`
2. Create Supabase project (`bellbird`, region nearest user)
3. Run `db/schema.sql` in Supabase SQL editor
4. Copy Supabase URL + anon key + service role key to `.env.local`
5. Add Anthropic and xAI API keys to `.env.local`
6. Verify `npm run dev` works
7. Push to GitHub, connect Vercel, deploy

**Verification:**
- `npm run build` succeeds with zero errors
- Identity page renders identically to mockup
- All four placeholder modes accessible from header
- Database schema deployed in Supabase
- Vercel preview URL works

### Turn 2: Auth + Library mode

**Goal:** Authenticated user can view, create, edit, delete, filter the 19 seeded theses.

**Deliverables:**
- Supabase Auth integration (magic link)
- `app/(auth)/login/page.tsx`
- Middleware for route protection
- `app/api/seed/route.ts` — imports 19 theses from references/theses-book.jsx on first run
- Library mode full UI (port from mockup):
  - Thesis list with cycle stage badges
  - Cycle stage filter
  - View filter (all / in portfolio / watchlist)
  - Sort options
  - Edit modal/page for thesis CRUD
  - Position CRUD inside thesis
- TanStack Query setup for server state
- Toast/notification system for save confirmations

**Verification:**
- Login flow works end-to-end
- 19 theses visible after seed
- Can create, edit, delete theses
- Can edit positions inside theses
- Filters work correctly
- All changes persist across page refreshes
- Sorts/filters update URL params for shareable views

### Turn 3: Develop mode — full pipeline

**Goal:** End-to-end thesis development through the four-phase AI pipeline.

**Deliverables:**
- `app/(app)/develop/page.tsx` — full chat UI per mockup
- `app/api/chat/route.ts` — Opus streaming endpoint (Phase 1)
- `app/api/structure/route.ts` — Opus structuring (Phase 2)
- `app/api/stress-test/route.ts` — Grok stress test (Phase 3)
- `app/api/adjudicate/route.ts` — Opus adjudication (Phase 4)
- `lib/ai/anthropic.ts` — Anthropic client wrapper
- `lib/ai/xai.ts` — xAI client wrapper
- `lib/ai/prompts/` — system prompts per phase
- Phase progression UI (visual indicator of where we are in pipeline)
- Adjudication verdict UI (PROCEED/STRESS_TEST/CLARIFY/DISCARD with reasoning)
- "Challenge Opus" interaction
- Conversation history sidebar
- Cost estimate display (running token/dollar counter per conversation)

**Verification:**
- Can develop a new thesis from scratch through all four phases
- Phase transitions feel deliberate (clear UI signals)
- Grok stress test always fires on phase 2→3 transition
- Opus verdicts include reasoning
- Can challenge an Opus verdict and see re-evaluation
- All conversation data persists to database
- New theses saved through pipeline appear in Library

### Turn 4: Portfolio mode

**Goal:** Manual position entry, basic P&L per position and per thesis.

**Deliverables:**
- Portfolio mode UI per mockup
- Trade entry form (ticker, side, quantity, price, date, fees, linked thesis)
- Position aggregation logic (multiple trades → current position)
- P&L calculation (manually entered current price for v1, Polygon comes v1.2)
- "Open position from watchlist" flow (convert thesis position to actual trade)
- Performance attribution by thesis
- Trade history view
- Export to CSV

**Verification:**
- Can enter trades manually
- Positions aggregate correctly
- P&L computes correctly (entry vs current)
- Thesis-level performance rolls up positions
- All trade data persists
- CSV export works

### Turn 5: Cycles mode + FRED data layer

**Goal:** Working economic cycle dashboard with 30-year history of 12 macro indicators.

**Deliverables:**
- `app/api/macro/refresh/route.ts` — FRED API integration, populates `macro_indicators` table
- Vercel cron config — daily refresh
- `lib/fred/client.ts` — FRED API wrapper
- Cycles mode UI per mockup:
  - Three cycle gauges (credit/equity/Juglar) with traffic light
  - 30-year sparkline per gauge
  - 12 macro indicators grid with sparklines and z-scores
  - Book distribution by cycle stage
  - Stage rotation map
- Cycle classification logic (rules-based for v1; could become ML-driven later)
- Historical analog markers (1968, 2000, 2007 annotated on charts)

**Verification:**
- FRED data populates correctly
- 30-year history rendered for all 12 indicators
- Cycle traffic lights driven by data, not hardcoded
- Daily cron runs and updates table
- Page loads in <2 seconds even with full historical data
- Book distribution reflects actual theses in database

---

## 6. Deferred to post-v1

> **Active backlog lives in `TESTING_LOG.md` from 25 May 2026 onwards.**
> PLAN.md remains the architecture-of-record (data model, build sequence, conventions);
> TESTING_LOG.md is the working surface for bugs, feature requests, and design decisions
> captured during testing. The two must stay synchronised — when a TESTING_LOG item
> changes a build-sequence decision or schema, mirror it here. See `TESTING_LOG.md` →
> "Recommended build sequence" for current priorities (v2 rebuild Turns A/B/C, then
> the prompt overhaul).

These were discussed but explicitly excluded from v1 to keep scope tight:

- **Watch mode** — triggers, calendar, notifications. v1.1 priority.
- **Live prices in Portfolio** — Polygon Massive integration. v1.2.
- **Earnings reviewer integration** — possibly via Anthropic's Skill, possibly our own. v1.2-1.3.
- **News auto-ingestion** — manual paste-in works fine for now. v2.
- **Mobile-optimized layout** — desktop-first for v1. v1.3.
- **Multi-currency support** — AUD-only for v1. Later if needed.
- **Wedgetail/Bowerbird integration** — when those tools mature. v2+.
- **The 5-tab parallel Claude Code workflow** — overkill for greenfield. Useful once codebase exists.

---

## 7. Honest expectations

- **Total v1 build time:** 1-2 weeks of focused work, longer if part-time
- **Total v1 deployment cost:** Vercel free tier + Supabase free tier = $0/month + AI usage (~$50-200/month based on usage intensity)
- **First-deploy time after Turn 1 complete:** ~2 hours of user time (Supabase setup, env vars, Vercel connect, first deploy)
- **Time to first real use:** Turn 2 complete (~3-5 days), at which point you can use Library mode with your real theses
- **Time to feature-complete v1:** All five turns done (~1-2 weeks at full focus)

The biggest risk to this build is *scope creep mid-build*. Resist the urge to add features inside a turn — note them, defer to next iteration.

---

## 8. References

- **`references/bellbird-mockup.jsx`** — Single source of truth for visual design. Every component should look like the mockup.
- **`references/theses-book.jsx`** — Seed data, 19 theses. Schema in `db/schema.sql` extends this structure.
- **`references/BOWERBIRD_BRAND_GUIDE.md`** (if present) — Brand voice and palette inspiration.

When in doubt about design, defer to the mockup. When in doubt about voice, defer to the brand guide. When in doubt about data structure, defer to this document.

---

## 9. Post-v1 backlog

> **`TESTING_LOG.md` is the live working backlog from 25 May 2026 onwards.**
> The items below were the initial post-v1 capture; they have since been re-categorised
> and re-prioritised against the v2 rebuild in `TESTING_LOG.md`. Treat this section as
> historical reference; do not edit items here without mirroring in TESTING_LOG.md.

Logged after v1 shipped (2026-05-22). Items are surfaced and grouped, not prioritised against each other beyond the per-group notes. Live with the dashboard for a stretch before deciding sequencing.

### A. Original Turn 3 backlog (flagged in Turn 3 verification, never built)

1. **Attachments in Develop chat — higher priority than the other Turn 3 items.** Currently the pipeline can only ingest pasted text, which is a structural limit on the Develop mode's usefulness (no images, charts, transcripts, PDFs). Anthropic API supports image + PDF base64 in messages; UI needs a file picker + Supabase Storage upload + reference passthrough to Phase 1 prompts. Closest thing to a workflow blocker in the original Turn 3 backlog.
2. **Iterate UX — preserve prior state.** Currently Iterate replaces the prior thesis/positions/stress-test output rather than preserving it. Redesign to keep prior state visible or open an iteration sub-discussion below the current one.
3. **Prompt prefill chips.** Pre-selected prompt options based on the pushback in the previous turn — surface a few one-tap continuations rather than a blank composer.
4. **Table rendering in chat.** Markdown tables currently render as plain text. Wire markdown table support into the chat turn renderer.
5. **Open committed theses to add new information.** Once a thesis is committed to the Library, there's no path to update via the Develop pipeline without starting a new conversation. Add a "re-open in Develop" flow that loads thesis context as Phase 1 starting state.

### B. Turn 4 polish (logged during Portfolio verification)

6. **Share count column on holdings rows.** Holdings list shows ticker / cost basis / current value / P&L but not the share count. Add column.
7. **Current-price-persists-after-trade-delete quirk.** When the last trade for a ticker is deleted, the manually-entered `current_prices` row for that ticker survives. Should clear automatically when net-quantity goes to zero.

### C. Turn 5 polish (logged during Cycles verification)

8. **Buffett z gauge/grid contradiction.** Gauge cites `buffett_z` from `cycle_readings.contributing_series` (+2.57); grid cell shows `z_score_30y` from latest `macro_indicators` row (-1.74). Same series, opposite signs. Almost certainly a divergence between `buildCycleReadings`' 200-day cutoff window and `getIndicatorSnapshots`' global query. Fix by aligning both surfaces to the same stored z value rather than re-deriving from a subset.
9. **HY Credit Spreads only ~3y of history.** `BAMLH0A0HYM2` returned 794 daily rows from FRED on backfill (vs ~7,300 expected for 30y). Z-score implicitly computed against a 3-year window not 30-year, making the current z misleading. Verify FRED history depth with a direct API call; if the cap is fetch-side, paginate or chunk-by-year.
10. **`upsertSeries` pagination latent bug.** `lib/fred/refresh-job.ts` — the `existing` rows query has no `.limit()`. Same family as the cycles-queries pagination bug fixed in Turn 5. Only affects refresh-mode (90-day window) YoY anchoring on daily series with >1000 historical rows. Add `.limit(10000)` when next touching that file.

### D. Strategic work parked

11. **Phase 1-4 system prompts.** Currently first-draft scaffolding from Claude Code. Real prompts to be developed in dedicated prompt-development chat work — Marks/Mauboussin behavioural specs for Phase 1, fidelity-only Phase 2, Munger inversion for Phase 3, Klarman downside-first for Phase 4. Plus a challenge-loop prompt for contested verdicts. Harness already committed at 31c02db for A/B testing variants. Canonical harness step sequence lives in `TESTING_LOG.md` item 17.

### E. v1.1+ items (mirroring §6 for one-stop reference)

12. **Watch mode** — triggers + calendar + notifications. v1.1.
13. **Polygon live prices** — v1.2. Note: `current_prices` table already exists from Turn 4 — partial groundwork done.
14. **Earnings reviewer integration.** v1.2-1.3.
15. **News auto-ingestion.** Also addresses the gap of no slot for qualitative macro readings on the Cycles page.
16. **Mobile-optimized layout.** v1.3.
17. **Multi-currency support.** AUD-only for v1.
18. **Options trading** — schema and P/L formula are equities-only in v1. Needs its own schema + P/L formula + UI; treat as its own meaningful scope, not a small extension to the trades table.
