# Bellbird

A clear note in the noise. Ideas before signals.

Personal investment thesis development workspace — the third tool in the three-bird stack, sitting upstream of Wedgetail (monitoring) and Bowerbird (decision infrastructure). Bellbird is where investment theses are born and refined before they enter monitoring or decision systems.

## Quickstart

1. Copy `.env.example` to `.env.local` and fill in your Supabase, Anthropic, and xAI keys.
2. Run `db/schema.sql` against your Supabase project (SQL editor).
3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

4. Open http://localhost:3000.

## Documents

- **`PLAN.md`** — full project plan, architecture, build sequence, data model. Read in full before contributing.
- **`SETUP.md`** — environment setup and deployment procedure for first-time setup.
- **`CLAUDE.md`** — conventions, design tokens, voice rules. Loaded automatically by Claude Code.
- **`references/`** — design mockup and seed theses. `BOWERBIRD_*` files are quarantined inspiration only.

## Build status

Turn 1 (skeleton) shipped. Library, Develop, Portfolio, and Cycles are themed stubs awaiting Turns 2–5.
