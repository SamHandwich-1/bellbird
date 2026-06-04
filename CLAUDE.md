# CLAUDE.md

This file is automatically loaded by Claude Code at the start of every session in this repository. It provides essential context, conventions, and pointers to detailed planning documents.

## Project: Bellbird

**Tagline:** A clear note in the noise. Ideas before signals.

**What it is:** A personal investment thesis development workspace. The third tool in James's three-bird stack — sits upstream of Wedgetail (monitoring) and Bowerbird (decision infrastructure). Bellbird is where investment theses are *born and refined* before they enter monitoring or decision systems.

**Who it's for:** Single user (James). Personal financial tooling. AU-based investor, AUD base currency, trades via IBKR, crypto via CoinSpot.

**What it does in v1:** Develops investment theses through a structured AI pipeline (Opus development → Opus structuring → Grok stress test → Opus adjudication), maintains a library of 19+ theses with cycle-stage classification, tracks portfolio positions linked to theses, monitors economic cycles via a macro indicator dashboard.

## Read these before doing anything

1. **`PLAN.md`** — the complete project plan, architecture, build sequence, data model. Read this in full before writing code.
2. **`SETUP.md`** — environment setup, dependencies, deployment procedure for first-time setup.
3. **`references/bellbird-mockup.jsx`** — the visual design reference. The aesthetic and component patterns here are the source of truth for UI work.
4. **`references/theses-book.jsx`** — the 19 existing theses that will be seeded into the database on first run. The data model in the library extends this structure.

## Stack

- **Framework:** Next.js 15 (App Router) + TypeScript (strict mode)
- **Styling:** Tailwind CSS with custom design tokens (see `lib/tokens.ts`)
- **Database:** Supabase (Postgres + Auth + Storage)
- **Hosting:** Vercel
- **AI models:**
  - **Anthropic Claude Opus 4.7** — all Bellbird-side phases (Phase 1 development, Phase 2 structuring, Phase 4 adjudication)
  - **xAI Grok-4** — adversarial stress testing (always-on in pipeline)
- **Data sources (deferred to later turns):**
  - **FRED API** — macro indicators for Cycles page
  - **Polygon Massive plan** — market data (real-time, advanced)

## Conventions

### Code style
- TypeScript strict mode throughout. No `any` types except where unavoidable.
- React Server Components by default; Client Components only when needed (form state, animations, real-time data).
- Components in `components/` organized by mode (`library/`, `develop/`, `portfolio/`, `cycles/`, `shared/`).
- Database access exclusively through `lib/supabase/` helpers — never directly in components.
- AI calls through `lib/ai/` clients — separate files for Anthropic and xAI.

### Naming
- Files: kebab-case (`thesis-card.tsx`)
- Components: PascalCase (`ThesisCard`)
- Functions/variables: camelCase
- Database tables: snake_case, plural (`theses`, `stress_tests`)
- Database columns: snake_case
- Type names: PascalCase (`Thesis`, `Position`)

### Design tokens
The design system extends from `references/bellbird-mockup.jsx`. Tokens lifted into `lib/tokens.ts`:

```typescript
// Surfaces
paper: '#F2EDE3'
mist: '#ECE5D5'
surface: '#E8E0CE'
hairline: '#C9BFAB'

// Text
ink: '#1a1a1a'
ash: '#6B6B66'
whisper: '#9A9485'
fade: '#C9BFAB'

// Conviction & cycle palette
terracotta: '#A0432B'  // low conviction / credit-cycle / alert
amber: '#B5853A'       // medium conviction / mid-cycle
sage: '#5C7A4D'        // high conviction / secular / positive
steel: '#2F4A52'       // long-cycle
slate: '#6B5C56'       // narrative-cycle

// Bellbird's accent — reserved for "this matters"
chime: '#3D5A6C'       // muted steel-blue
```

### Typography
- **Fraunces** (serif, display) — headings, hero text, editorial body, conversation turns
- **Manrope** (sans, body) — UI text, labels, metadata
- **JetBrains Mono** — numbers, tickers, percentages

Load via Google Fonts in root layout. Use `font-family` declarations consistent with mockup.

### Voice & tone (for UI copy, error messages, AI prompts)
- Considered, quietly confident, uncluttered
- Sentence case throughout — never title case, never all-caps except for spaced metadata labels
- No emojis in product copy
- No exclamation marks
- "Stress test fired" not "Stress test predicts"
- "Elevated risk" not "Crash incoming"
- Match the Bowerbird brand voice (`references/BOWERBIRD_BRAND_GUIDE.md` if present)

## Build sequence

The project is built in five sequential turns. Each turn ends with something deployable.

1. **Turn 1 (current/starting):** Project skeleton — Next.js + Tailwind + Supabase setup, design tokens, root layout, Identity page (the home), Postgres schema, stub pages for other modes
2. **Turn 2:** Supabase auth + Library mode (full CRUD on theses, filters, seed 19 theses from references)
3. **Turn 3:** Develop mode — the Opus development → Opus structuring → Grok stress test → Opus adjudication pipeline with adjudication UI
4. **Turn 4:** Portfolio mode — manual position entry, basic P&L
5. **Turn 5:** Cycles mode + FRED data layer + daily refresh cron + traffic-light dashboard

See `PLAN.md` for detailed turn breakdowns including deliverables, file lists, and verification criteria.

## Critical architecture decision: the four-phase AI pipeline

This is unusual and worth explaining upfront because it shapes the entire Develop mode:

**Phase 1 — Initial development (Opus 4.7):** User describes a thesis fragment. Opus engages in substantive back-and-forth. Pushes back, challenges, develops mechanism. Iterates until user marks "ready for review." Slower turns (8-20s) are acceptable here — this is the IP-generating phase.

**Phase 2 — Structuring (Opus 4.7):** Takes the developed thesis from Phase 1. Produces the structured library record — name, sector, conviction, timing, cycle stage, summary, hedge note, positions. The judgment that matters here is in *expression*, not substance: faithful structuring of Phase 1's reasoning, with thought applied to hedge-note phrasing (for long-only theses, document the source of the asymmetry rather than invent a hedge), conviction inference when no number was named, and the cleanest expression of a multi-ticker basket. Not a re-litigation of the thesis.

**Phase 3 — Adversarial review (Grok-4):** Auto-fires on every new thesis. Returns strongest contrarian argument + structured "where models disagree" matrix. Never optional.

**Phase 4 — Adjudication (Opus 4.7):** Reads structured thesis + Grok's pushback. Returns verdict: `PROCEED` / `STRESS_TEST` / `CLARIFY` / `DISCARD`. Always with explicit reasoning. User can challenge; Opus re-evaluates with counter-argument; both logged.

**Why this architecture:** Bellbird is investment-thesis infrastructure for $100k-scale decisions; the per-thesis model cost is bounded against the size of the decision the thesis informs. Opus end-to-end on the Bellbird side because the structuring step is non-trivial (a "fast and mechanical" Phase 2 produces empty hedge notes and default-65 convictions, both of which are decisions in their own right). Grok is the always-on adversarial pressure, distinct enough in voice and training that its contrarian arguments don't collapse into Opus's own reasoning. Phase 4 adjudication sits at the gate with explicit reasoning so verdicts are auditable.

Implementation lives in `app/api/chat/route.ts` (streaming Opus), `app/api/structure/route.ts` (Opus), `app/api/stress-test/route.ts` (Grok), `app/api/adjudicate/route.ts` (Opus).

## Environment variables

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
XAI_API_KEY=
FRED_API_KEY=               # Turn 5+
POLYGON_API_KEY=            # Turn 4+ for live prices
```

For Vercel production, all of these need to be set in project settings → Environment Variables before first deploy.

## Verification expectations

Before declaring any turn "complete":

1. **`npm run dev` runs without errors**
2. **`npm run build` succeeds** (catches type errors and SSR issues that dev mode hides)
3. **All TypeScript errors resolved** — no red squigglies, no `@ts-ignore` shortcuts
4. **The deployed Vercel preview works** — actually visit the URL, click through the new functionality
5. **Database migrations run cleanly** — schema changes work on a fresh Supabase project
6. **Commit with clear message** following Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)

## What NOT to do

- **Don't add dependencies without checking the plan.** The stack is intentionally small. If you think we need a new library, flag it and ask.
- **Don't generate placeholder thesis data.** The 19 real theses in `references/theses-book.jsx` are the seed data. Use those.
- **Don't build features outside the current turn.** Stub future features with placeholders, don't pre-build them.
- **Don't use `dangerouslySetInnerHTML`** anywhere.
- **Don't use localStorage or sessionStorage** in components — Supabase is the persistence layer.
- **Don't change the design tokens** without flagging to user. The aesthetic is locked.
- **Don't put API keys in client-side code.** All AI/data API calls go through `/app/api/` routes.

## Open questions for the user

If anything is genuinely ambiguous and you can't resolve it from PLAN.md, ask the user. Don't guess on:

- Database schema additions beyond what's specified
- New modes or major UI patterns not in the mockup
- Authentication flow changes
- AI model routing (which model handles what)
- Anything involving cost or external API usage limits

## Project memory

This is a single-user personal app for James (Melbourne, AUD base). The 19 existing theses cover AI capex, commodities, financials, healthcare, gaming. The book has been built in a specific editorial aesthetic that matters — the visual restraint is itself a discipline. Speed of iteration is less important than getting the design and architecture right.


## CRITICAL: references/ folder contains quarantined content

The `references/` folder includes documentation for **Bowerbird** — a separate future project. Those files (`BOWERBIRD_*.md`, `SWANSONG_BRIEF.md`, `LOVEBIRD_BRIEF.md`) describe features that **MUST NOT** be implemented in Bellbird.

Before starting work, read `references/README.md` for the full scope quarantine rules. The short version:

- `bellbird-mockup.jsx` and `theses-book.jsx` — ACTIVE references, use these
- All `BOWERBIRD_*` files and `SWANSONG_BRIEF.md`, `LOVEBIRD_BRIEF.md` — INSPIRATION ONLY, do not implement

If you find yourself wanting to add a feature inspired by something in references/, **STOP** and ask the user first. Default answer is no.