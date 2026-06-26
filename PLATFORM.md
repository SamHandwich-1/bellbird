# PLATFORM.md — the bird stack shared contract

> **This version supersedes all earlier copies.** It records the ratified move to a single monorepo with `core` extracted into a `core-db` package, and promotes several conventions from "documented and hoped for" to **CI-enforced**. Re-sync this file to *every* repo. Where the text says "today" or "until P1", that is the live state during consolidation; where it says "from P1" or "enforced", that is the ratified target the build is moving to.

**Naming.** The platform is **Slipstream** — the medium the flock flies in (the drafting airflow of a V-formation; a *skein* is that V of geese). The components are the **birds**. The conductor that holds this contract and watches the seams is **Skein** — a separate layer, *over* the aviary, that writes nothing to `core` and does not run in the loop. Three layers: Slipstream (the medium), the birds (the components), Skein (the conductor). Single-bird names belong to components; the platform and the conductor are not birds.

**What this is.** The one document every component carries, *identical*, in its project knowledge. Each app — Condor, Sandpiper, Starling, Bellbird, Drongo, Kingfisher, Wedgetail, Bowerbird, Nutcracker — owns its own database schema and its own internals; they coordinate only through a shared Postgres graph called `core`. This file is the contract for that coordination: the topology, the lifecycle, the `core` schema, who writes what, the database hazards, and a one-paragraph card per app. **Deep internals stay in each app's own SPEC / CLAUDE.md; this stays contract-level.**

**Rule zero.** This file is shared. If you change it, it is a *platform* change — re-sync the new version to every repo. Changes to the **`core` contract (Part 2)** go through the core-owner only. As of P1 (now landed), authoritative `core` DDL lives in the **`core-db` package**, and the package + its CODEOWNER *is* the owner. The extraction was a **carve, not a file move**: Kingfisher's `0001` created `core` and `kingfisher` interleaved in one migration, so `core` was re-authored as a fresh, core-only baseline in `core-db` — semantically identical to the source (it introspects identical to Kingfisher's core slice), with only its home and enforcement changed. `core-db`'s `schema.ts` + published snapshot are now the source of truth; Kingfisher's original migrations are historical.

---

## 0 · Topology & consolidation status

**One repo, many specialists, one database.** The platform is a single **monorepo**: each app is a workspace, internals stay private, and they meet only on `core`. This is a change from the original repo-per-app layout — made because the worst database hazards (mixed migration tools and double-applied tracking tables racing on the shared `core`, an unscoped diff proposing to drop a sibling's tables) existed *only because each repo independently chose its own migration path against one shared schema*. Consolidating lets the `core` migration path be standardised once and the seam-rules be **enforced by CI rather than remembered**.

**Two seams, kept distinct.** The *repo* seam (how code is packaged) and the *database* seam (how schemas coordinate) are independent. The blast-radius risk — a wrong development tangent in one app reverberating into another — lives in the **database**, not the repos. The monorepo kills contract drift; the database guards (Part 4) kill the reverberation. Do not let "we went monorepo" stand in for "we are safe": the second set is the one that contains blast radius.

**The logical architecture is unchanged.** The lifecycle (Part 1), the `core` graph (Part 2), the closed `kind` vocabulary, and the linking rules are exactly as before. Only the *physical packaging* consolidated and the *enforcement* hardened.

**Named constraint — one Supabase project.** The whole platform runs on a **single hosted Supabase project** (one Postgres instance, per-app private schemas, the shared `core` schema). This is now an explicit invariant, not an implicit watch-out: a second project re-forks the graph exactly as separate repos re-forked the contract.

**Consolidation is in flight.** The phased path and build sequence — which app moves when, what gates what, what can run concurrently — live in the **kickoff briefs**, because that sequencing is transient and this contract is not. The durable facts: `core` is extracted into `core-db` at **P1**; **P1 is the one serialization point** (nothing in the new repo parallelises against a `core` that is still moving); shared-root changes serialise across build chats while in-workspace changes run free.

---

## 1 · The lifecycle (what the platform is)

A single-user investing platform. An idea moves through five `core` node types — **thesis → indicator → trigger → position → trade** — and each app owns one transformation on that spine. Apps never read each other's schemas; they meet only on `core`. The operating loop is **ALERT → JUDGE → TRADE**: analysts alert, the human judges, a trade is recorded.

Top to bottom:
- **Regime (Condor)** conditions everything below — how hard to size, which signals to trust.
- **Source & frame** — Sandpiper (validated watchlist), Starling (consensus context), **Bellbird → `core.thesis`**.
- **Signal** — three orthogonal analysts: **Drongo** (price forecast), **Kingfisher** (forced flows + fragility), **Wedgetail** (fundamental value) → `core.indicator` / `core.trigger`.
- **Decide & risk** — **Bowerbird**: Harrier opens, Swansong tends & closes → `core.position`, proposes `core.trade`. This is JUDGE. (Memory is no longer an organ here — it lives at platform level as **Nutcracker**.)
- **Execute** — human, gated, paper-by-default → `core.trade`. No app auto-executes.
- **Memory** — **Nutcracker** scores four subjects (source · signal · judge · exit) and feeds trust back up.
- **Data seam** — **Magpie** (Polygon adapters) feeds the analysts. **Dashboard** is a read-only view of `core` per instrument.

---

## 2 · The `core` contract

`core` is the shared graph. **It depends on nothing.** Six tables:

- **`core.instrument`** — the shared anchor (one row per tradeable thing: ES, SPX, …). Every cross-schema reference points here.
- **`core.thesis`** — a held reason to act. Written by Bellbird (primary).
- **`core.indicator`** — a machine-readable signal, typed by `kind` (below).
- **`core.trigger`** — a price level at which something is forced to act. Written by Kingfisher.
- **`core.position`** — an intended/active position. Written by Bowerbird.
- **`core.trade`** — a proposed/recorded trade. Proposed by Bowerbird; confirmed by the human.

**The `kind` vocabulary for `core.indicator` is CLOSED. Do not invent a new one without a platform change. As of P1 it is enforced at the database level as a CHECK constraint (`indicator_kind_check`) on `core.indicator.kind` — not prose — so a fifth kind fails at write, not at review:**

| `kind` | written by | meaning |
|---|---|---|
| `forecast` | Drongo | directional forecast (side, magnitude, conviction, dispersion, horizon) |
| `fragility` | Kingfisher | structural fragility gauge (0–1) |
| `value` | Wedgetail | fundamental mispricing |
| `regime` | Condor | macro regime (quadrant + confidence + gauges) |

**Linking rules — load-bearing; these keep the platform coherent:**
1. Every cross-component link is a **soft `(source_system, source_id)` pair** — never a hard cross-schema FK.
2. The **only** hard cross-schema FK is a component pointing **into `core.instrument`** (so a trigger on ES and a thesis on ES mean the same ES).
3. **Never** add an FK from `core` back into a component schema.
4. Provenance sits where data is produced, not uniformly: the five *produced* nodes — `thesis`, `indicator`, `trigger`, `position`, `trade` — carry `source_system` + `source_id` (the soft-link pair); `core.instrument` carries neither (it is the seeded/promoted anchor, not a produced row). `as_of` (`timestamptz`, UTC) is on `core.indicator` only. `model_version` is **not** a `core` column anywhere — it lives on each writing app's own tables (e.g. `kingfisher.fragility`).
5. `id` is `uuid` (`gen_random_uuid()`), never serial — cross-component linkage depends on it.

**`core.instrument` insert path — LOCKED (decision 001).** The anchor is the only hard-FK target, so uncontrolled inserts silently fork the graph. The single insert path:
- **the owner seeds** instruments;
- **Sandpiper and Condor stage candidates in their own schemas** (`sandpiper.instrument_candidate`, `condor.instrument_candidate`) — they never insert into `core.instrument` directly;
- **Kingfisher reads those staging tables** and performs the `core.instrument` insert on human-approved promotion (a pg-boss `instrument.promote` job — the human gate is consistent with the platform's JUDGE posture);
- **dedup is enforced at the database level on symbol** (`ON CONFLICT (symbol) DO NOTHING`) — not in application code — so two proposers cannot create two anchors for the same ES;
- Kingfisher writes `status`, `promoted_core_id` and `promoted_at` back to the proposer's staging table as the feedback signal; the proposer reads only its own table.

This read/write-back into a proposer's staging table is **the only ratified cross-schema access between app pairs** — narrow (one table per proposer, promotion only, human-gated), documented in `docs/decisions/001-instrument-candidate-staging.md`, and it does not license further cross-schema coupling.

**`core-db` publishes a language-neutral contract surface.** `core`'s DDL is authored in Drizzle (TypeScript) inside `core-db`. Non-TS apps (Condor, Drongo) must **not** hand-roll their own picture of `core`'s shape — that rebuilds cross-component drift at the TS/Python boundary, invisible until a write fails or, worse, succeeds with subtly wrong data. So `core-db` publishes a **current-state SQL schema snapshot** (which Drizzle's migrations already produce for near-free) as the *single* shape source, and every app — TS or Python — reads `core`'s shape from that one artifact. Decided at P1; first exercised when the Python apps land.

**How a TS consumer references `core` (the in-monorepo path).** A TS app imports the typed `core` table and enum objects directly from `@slipstream/core-db` and references them in its own FK and enum columns. Under `schemaFilter: ['<app>']`, drizzle-kit serialises these as **external references** — the FK resolves to `core.instrument(id)`, enum columns to `core.stance_t` — with no `CREATE SCHEMA/TABLE/TYPE core` in the generated artifact, so `.existing()` stubs are unnecessary (proven in the Kingfisher lift; Wedgetail's config follows it). Importing the objects is the in-tree TS consumption of the **same** single source — `core-db`'s `schema.ts`, from which the SQL snapshot is generated — not a second shape. The SQL snapshot stays the only path for Python and any out-of-tree consumer; and because in-tree TS apps import the objects rather than read the snapshot, **a stale snapshot is invisible to the entire TS lane** — so republishing it on every `core` change (`just core-snapshot`) is load-bearing specifically for the Python lane.

**Ownership of `core` itself:**
- From P1, **`core` lives in the `core-db` package; that package + its CODEOWNER is the owner.** Kingfisher is the CODEOWNER (it authored the DDL and owns the Drizzle/TS migration path). Other apps **read and write `core` *rows*** for the nodes they own, but **never alter `core`'s DDL** — no app migrates, introspects, or drops `core` except through `core-db`. **CI enforces this**: `core` DDL outside `core-db` is rejected.
- Adding a node table, a column, or a new `indicator.kind` is a **core change** → it goes through the CODEOWNER, lands in `core-db`, and is propagated here.
- Until P1, all `core` DDL changes happen in Kingfisher, deliberately. (The original plan deferred this extraction to "when Bowerbird is built"; it has been pulled forward to P1 as the keystone of the containment story.)

---

## 3 · Ownership matrix

The integration contract at a glance. *Writes/reads are `core` nodes; an app's own schema is its private workspace. Status reflects build progress, which is distinct from an app's role — Wedgetail is the house-standard reference scaffold by role even while still being built.*

| App | Schema | Writes to `core` | Reads from `core` | Stack | Status |
|---|---|---|---|---|---|
| **Condor** | `condor` | `indicator(regime)` | `instrument` | TS (gauges + quadrant) + Python (stat model) · Supabase · FRED/Polygon | spec ready · not started |
| **Sandpiper** | `sandpiper` | proposes `instrument` candidates | — | TS · Supabase | building |
| **Starling** | `starling` | — (consensus context) | `thesis`, `instrument` | TS · Supabase | concept |
| **Bellbird** | `bellbird` | `thesis` | `instrument`, `indicator(regime)` | Next.js 15 / TS · Supabase · Opus + Grok · FRED/Polygon | building (~90%) |
| **Drongo** | `drongo` *(Coconut Octopus internal)* | `indicator(forecast)` | `instrument`, `thesis` | Python engine (uv/pytest/ruff) + Next.js `web/` · Supabase · Polygon · IBKR/Nautilus · Qlib · mlfinlab | kit ready · not started |
| **Kingfisher** | `kingfisher` **· CODEOWNER of `core-db`** | `trigger`, `indicator(fragility)` | `instrument`, `thesis` | Next.js 15 / TS · Supabase + Drizzle · pg-boss · Polygon | building |
| **Wedgetail** | `wedgetail` | `indicator(value)` *(may originate `thesis`)* | `instrument` | Next.js 15 / TS · Supabase | building · house-standard reference scaffold |
| **Bowerbird** | `bowerbird` / `harrier` | `position`, proposes `trade` | `thesis`, all `indicator`, `trigger`, `position` | Next.js / TS · Supabase | future |
| **Nutcracker** | `nutcracker` | — (reads outcomes; owns `nutcracker.decision`) | `position`, `trade`, `indicator`, `trigger`, `thesis` | TS / Python · Supabase | future |
| **Swansong** | *(Bowerbird organ)* | proposes exit/adjust `trade` | `position`, `indicator(fragility)` | — | future |
| **Assay** | `assay` | **nothing** (off-spine bench) | — (operates on flagged assets via the prompt-book) | TS · Supabase | R&D bench |
| **Lyrebird** | `lyrebird` | **nothing to `core`** *(forward triggers → own `lyrebird.*` ledger, never Nutcracker)* | `thesis`, `instrument` *(read-only; shape from snapshot)* | Claude Code + filesystem MCP · markdown distillates · Supabase (P3) | building · the live forward engine, first |
| **Whipbird** | `whipbird` | **nothing to `core`** *(offline replay grades → `whipbird.*`)* | — *(frozen fixtures; no live `core` reads)* | shares `lens-kit` · Supabase | reserved slot · offline lens validator |
| **Magpie** | `magpie` | — (data infra) | — | Polygon adapters | "lite", stubbed per-app |
| **Dashboard** | *(view)* | **nothing** | all of `core` | Next.js / TS | per-app |

**`core-db`** — not an app: the package owning `core`'s DDL (Drizzle), the migration runner and its single tracking table, the DB-level `kind` enum and instrument-symbol dedup, and the published SQL schema snapshot. CODEOWNER: Kingfisher. The one place `core` can be migrated.

`pgboss` is infrastructure (Kingfisher's job queue) — leave it alone.

**Cross-schema exception (decision 001):** Kingfisher reads `sandpiper.instrument_candidate` (and, when built, `condor.instrument_candidate`) and writes promotion feedback (`status`, `promoted_core_id`, `promoted_at`) back to it. This is the **only** ratified cross-schema access between app pairs; it does not appear in the matrix columns above because it is not a `core` read.

**House visual style** — the shared dashboard look ("Graphic": warm paper / one electric vermilion / Archivo Expanded / flat colour-blocking) lives in `design/house-style-graphic.md`; visual house-style decisions are recorded in `docs/decisions/` (see 003, which makes Graphic the P4 palette canon, superseding any app's local explainer palette). Distinct from Wedgetail's *code*-scaffold role above.

---

## 4 · Database watch-outs (one Supabase project, many schema-isolated apps)

The hazards specific to this topology. Most platform-breaking bugs will come from here. Several below are **retired or downgraded for `core`** once P1 lands — they survive only for each app's *own* schema, because the consolidation removed the shared-schema race that created them. They are kept on the list, annotated, so the reasoning is not lost.

1. **One writer for `core`'s DDL.** Only `core-db` migrates `core`. Everyone else writes *rows* into their own nodes and never touches `core`'s structure. **From P1 this is structural, not a convention: CI rejects `core` DDL outside `core-db`, and the package is CODEOWNER-gated.** Two apps migrating `core` = collision and drift.
2. **Scope every migration tool to its own schema — and exclude `core`.** An unscoped diff against the shared project will propose **dropping every table it doesn't recognise**. Drizzle, for a non-owner: `schemaFilter: ['<app>']` — its own schema only, never `['core','<app>']` (only `core-db` scopes to `core`; `core` in a non-owner's filter would make its drift propose an `ALTER`/`DROP` on `core`, so a non-owner reads `core`'s shape from the snapshot instead). Supabase CLI / other tools: the equivalent allow-list. **CI rejects an unscoped diff.** For `core` itself this is moot from P1 (only `core-db` touches `core`); it remains fully live for **every app's own schema** — sibling schemas hold real data.
3. **Don't mix migration tools on `core`.** *Retired for `core` from P1*: `core` has a single migration source of truth — Drizzle, inside `core-db`. The principle still holds platform-wide — each app may use its own tool for its *own* schema (Drongo via Supabase CLI from Python, the TS apps via Drizzle), but **never two tools racing on the same tables**, and `core`'s tables now have exactly one.
4. **Namespace your migration-tracking table.** *Retired for `core` from P1*: `core-db` owns one tracking table for `core`. Still live per-app — each app tracks its own migrations in its own table (e.g. `kingfisher_migrations`); don't let a tool's default migrator (e.g. drizzle-kit's `__drizzle_migrations`) run unscoped and double-apply.
5. **`core.instrument` is the shared anchor — control who inserts.** *Now LOCKED — see Part 2 and decision 001.* Owner seeds; **Sandpiper and Condor stage candidates in their own schemas** (`<app>.instrument_candidate`) and never insert into `core.instrument` directly; **Kingfisher reads those staging tables** and performs the insert on human-gated promotion — **dedup by symbol enforced at the database level** (`ON CONFLICT DO NOTHING`) — then writes `status`, `promoted_core_id` and `promoted_at` back. The only ratified cross-schema access between app pairs. Uncontrolled inserts create duplicate anchors that silently fork the graph.
6. **Local for the loop, hosted for promotion — the headline blast-radius control.** The hosted Supabase project holds **every** app's real data. Destructive / invariant test suites run on a **local** Postgres only; vetted migrations promote to hosted deliberately. **This is the single guard that answers "a wrong tangent reverberates": if destructive work never reaches hosted, a tangent in one app cannot reach another's data.** From P1 it is a property of the repo's dev setup that every app inherits, and CI keeps destructive suites off hosted. Never point a destructive suite at hosted. **And no silent fallthrough to hosted:** no drizzle config or migration runner may resolve its connection as `DATABASE_URL_LOCAL ?? <hosted>`. An unset local var must yield a **non-connectable** target — a junk placeholder for offline-only configs (the drift-gate config never connects, e.g. `?? "postgresql://offline"`), or a **hard local pin** for anything that connects (a runner, a `pull` config). Hosted is reached only via an explicitly-named hosted var on a deliberate promotion path, never as the default when the local var is missing. This is sharpest for `drizzle-kit push`, which mutates schema with no migration file: a bare `push` with the local var unset is a silent, direct schema change against whatever the fallback names. `core-db`'s config is the reference form (a non-connectable placeholder by design); every app's config and runner must match it.
7. **Shared column conventions** (so rows join and compare across apps): `uuid` PKs (`gen_random_uuid()`); **`NUMERIC` for money, `timestamptz` (UTC) for time** — never floats for prices/returns. Provenance is **not** a uniform trio (see Part 2, linking rule 4): `source_system`+`source_id` on the five produced nodes, `as_of` on `indicator` only, `model_version` nowhere in `core`. As of P1 the real shape is baked into `core-db`, so no app *can* write a `core` row with a float price or a naive timestamp.
8. **Soft links can dangle — and this is what makes concurrent builds safe.** `(source_system, source_id)` is intentionally *not* FK-enforced — so a reader must tolerate a missing referent (the source row may live in a schema you can't see, or be gone). Because every app is built against `core`'s *shape* and never against another app *running*, apps stop depending on each other's existence once `core` is frozen — which is what lets the build lanes parallelise. The cost of that property is the discipline: **don't assume a soft link resolves.**
9. **Shape drift across the TS/Python seam — the new one.** `core`'s DDL is TypeScript (Drizzle in `core-db`); Condor and Drongo are Python and write `core.indicator` rows. They never migrate `core`, but they need its shape — columns, types, the `kind` enum — to write valid rows. If each Python app invents its own picture of that shape, cross-component drift reappears at the language boundary, invisible until a write fails or silently lands wrong data. **Both TS and Python read `core`'s shape from the one published SQL snapshot (Part 2)** — decided at P1, exercised when the Python apps land.
10. **The `db:generate` no-op proves schema↔snapshot, not migration↔reality.** Every app on the hand-written-`migrations/` + `drizzle-state/` pattern (`core-db`, Kingfisher) runs `db:generate` as an offline drift gate: it diffs `schema.ts` against the committed `drizzle-state` snapshot and must be a no-op. That no-op proves only that `schema.ts` and the snapshot agree — it says **nothing** about whether the hand-written migration SQL matches either. The two can diverge silently (a `DEFAULT` declared one way in the migration and another in `schema.ts`): `schema.ts`↔snapshot still agree, `db:generate` is green, and the live DB default is wrong. The discipline that closes it: keep `schema.ts` **`drizzle-kit pull`-derived** from the DB the migrations built (so it cannot disagree with them by construction — `core-db`'s approach), or, when authoring both by hand, **introspect the live DB** and confirm migration = `schema.ts` = live, all three. Realigning only `schema.ts`↔snapshot moves the blindness rather than removing it. (This is the class that produced Kingfisher's `inputs_used` default divergence — a green `db:generate` over a migration default that didn't match the schema.)

---

## 5 · Interface cards

One paragraph per app: what it does, what it puts on `core`, its stack, its status. Enough to integrate *with* an app without reading its internals.

**Condor** — the macro-regime bird; reads the weather from altitude and sets it for everyone below. Owns the macro engine (five cycle gauges + a growth×inflation quadrant, plus a statistical second opinion it surfaces disagreement against) and **publishes `core.indicator(kind=regime)`**. Read by Bellbird (in-season thesis scoring), Bowerbird (sizing), Nutcracker (regime-weighted trust). Its data layer is its own (FRED + Polygon), not Magpie. TS for the rule-based layers; Python for the statistical model — the Python engine reads `core`'s shape from the published snapshot, never hand-rolled. *Spec ready; born in the monorepo.*

**Bellbird** — thesis genesis; develops and refines investment theses through an Opus → Opus → Grok → Opus pipeline and commits them as **`core.thesis`**. Reads Condor's regime to score which theses are in season — and tolerates its absence, since Condor isn't built yet. Next.js 15 / TS, Supabase, Anthropic Opus + xAI Grok, FRED/Polygon. *Building (~90%); finishes in place, then lifts into the monorepo.*

**Drongo** *(manifold: Coconut Octopus)* — price-forecast engine; six time-series foundation models fused into one directional call, published as **`core.indicator(kind=forecast)`**. Its calibration ledger is the moat. Python engine (uv/pytest/ruff) + Next.js cockpit; Supabase, Polygon, IBKR via Nautilus, Qlib, mlfinlab. Reads `core`'s shape from the published snapshot. *Build kit ready; born in the monorepo.*

**Kingfisher** — forced-flow detector; maps the price levels mechanical participants are forced to act at and how fragile the structure is. Writes **`core.trigger`** and **`core.indicator(kind=fragility)`**, and is **CODEOWNER of `core-db`** (it authored the `core` DDL and owns the Drizzle migration path). Alerts only — never trades; shadow-mode 60–90 days before any trigger informs a real decision. Next.js 15 / TS, Supabase + Drizzle, pg-boss, Polygon. *Building.*

**Wedgetail** — fundamental-value analyst; the third orthogonal signal, writing **`core.indicator(kind=value)`** (and able to originate a `core.thesis`). The **house-standard reference scaffold** the other TS apps match — that role is why it leads the TS lane even though it is the least-finished of the three. Next.js 15 / TS, Supabase. *Building.*

**Sandpiper** — tip-source validation; learns which sources earn trust and proposes specific instruments to watch. Stages candidates in **`sandpiper.instrument_candidate`** (its own schema — it never writes `core`); Kingfisher promotes into `core.instrument` and writes feedback back (decision 001). Top of funnel. *Building.*

**Starling** *(was BeliefMap; renamed this cycle — a murmuration is the crowd moving as one)* — consensus / narrative map; the crowd's current belief, as the context a thesis bets against. Reads `core.thesis` / `instrument`; writes none. *Concept.*

**Bowerbird** — the orchestrator and decision/risk layer; reads the thesis plus every signal and sizes one position under risk constraints. Internally **Harrier** (decide → **`core.position`**, propose **`core.trade`**) and **Swansong** (tend & exit — proposes adjust/close trades) — a strike-and-release pair across a position's life. Memory is **not** an organ here; it is the platform-level Nutcracker. This is JUDGE in ALERT → JUDGE → TRADE; human now, automated later. *Future.* *(The `core` extraction it was once slated to perform has been pulled forward to P1; Bowerbird inherits `core-db`, it does not create it.)*

**Nutcracker** — platform memory / calibration; scores four subjects — source, signal, judge, exit — and feeds trust back up. Owns **`nutcracker.decision`**, the operator decision log (the JUDGE instrumented: the override delta, conviction, pre-committed invalidation, the passes). *(Formerly also a Bowerbird organ named Muninn; that organ is dissolved — there is one memory layer, here, at platform level, because calibration feeds up and across, which a decision-sizer structurally can't own.)* It grades **book-outcomes** off `core` — did the live signal precede the move, did the override add value, did the exit work. It shares **one** prediction-record shape and **one** grade-at-horizon method with Assay, Lyrebird and Whipbird, but a **separate (fourth) ledger**: the Assay grades world-outcomes, Nutcracker grades book-outcomes, and a lens's Assay record does **not** carry over as live trust — going live adds sizing, timing and execution, so it re-proves on book-outcomes (the same logic as Kingfisher's shadow period). *Future.*

**Assay** — the methodology bench, *off the spine*. Human-triggered: flag an asset or theme and it runs the full prompt-book of lenses (adoption-stage, value, reflexivity…), scores each across falsifiability / evidence / base-rate / decomposition / calibration / actionability, logs a calibrated prediction, and grades it at horizon. Its private run-ledger (schema `assay`) is its workspace; it **writes nothing to `core`** and **reads nothing from it** — it sits beside the funnel, not on it. Its only exits are into the human's judgment (per run) and a lens **graduating** to its own component once it clears a promotion gate — a deliberate core change at that point (e.g. a future `indicator(kind=adoption)`). Houses methodology candidates; **Concentric Adoption** is the first, at `CANDIDATE`. Liberal front door, ruthless scoreboard: measurement-grade only, graded at horizon, N≥5 and a Brier beating baseline before anything promotes. Content-meta (about *methods*) — which is why it is not Skein (coordination-meta, about the *contract*). Completes the calibration symmetry across the four consumers of the one scoring contract: **Assay** (methodologies, offline) → **Whipbird** (lens logic, offline replay on frozen fixtures) → **Lyrebird** (lens logic, live forward) → **Nutcracker** (book outcomes, in-loop). *R&D bench.*

**Lyrebird** — the **live forward** structured-disagreement engine, and the first of the calibration group to build. Lens agents — each a procedurally distilled file of one canonical investor (Marks, Klarman, Soros/capital-cycle to start) — analyse a security or a thesis over the five-node ontology and emit a disagreement map ending in dated, falsifiable triggers. **Both modes ship in v1:** *thesis-mode* (stress-testing a committed thesis right after Bellbird) and *instrument-mode* (cold-pointing at a ticker for each lens's independent valuation and risk read, to originate). It **writes nothing to `core`** — it files to its **own `lyrebird.*` forward ledger, graded at horizon, and never into Nutcracker** (surfacing a Lyrebird record into another component's ledger is a core-owner decision, not Lyrebird's). Reads `core.thesis` and `core.instrument` read-only via `@slipstream/core-db` (snapshot shape). Scored under the shared scoring contract (one of four consumers). Shares a `lens-kit` with Whipbird — the distillate library and conflict-mapping logic, extracted to `packages/lens-kit` at the Whipbird second-consumer boundary. **Phase-3 endgame:** Bellbird reads Lyrebird's map back as a separate component — the engine is not embedded as an internal pipeline stage. Stack: Claude Code + filesystem MCP, version-controlled markdown distillates; Supabase persistence at Phase 3. *Building — the live engine, first.*

**Whipbird** — the **offline** lens validator. It replays the same lens distillates against **frozen historical fixture windows** and grades them immediately against known outcomes, writing to `whipbird.*`. It **writes nothing to `core`** and makes **no live `core` reads** (frozen fixtures, not the live graph). It shares Lyrebird's `lens-kit`; building Whipbird is the second-consumer boundary that extracts the distillate library and conflict-mapping logic into `packages/lens-kit`. One of the four scoring-contract consumers. *Reserved slot — until the replay machinery earns its own workspace (the Swansong pattern).*

**Magpie** — the data seam; Polygon adapters with provenance, feeding the analysts. Currently "Magpie-lite" stubbed inside each app, extracted later. **Dashboard** — read-only projection of `core` per instrument; writes nothing.

---

*Last reconciled against: the universe map; Kingfisher's CLAUDE.md (core owner + boundaries); Bellbird's CLAUDE.md; the Drongo / Condor / operator-decision-log specs; the Concentric Adoption candidate spec; and the consolidation + naming decision record of this cycle (platform named **Slipstream**, conductor **Skein**; `core` → `core-db` at P1; Drizzle retained for `core`; instrument insert path locked; `kind` as a DB constraint; one-Supabase-project named invariant; cross-language schema snapshot; **BeliefMap → Starling**, **Muninn → Nutcracker** with the Bowerbird memory-organ dissolved, **Huginn → Harrier**; the **Assay** added as an off-spine R&D/calibration bench; four scoring-contract consumers, each with its own ledger (Assay/world-outcomes, Nutcracker/book-outcomes, Lyrebird & Whipbird/lens-outcomes), sharing one scoring contract; and decision 001 — instrument-candidate staging in proposer schemas with Kingfisher promotion, the one ratified cross-schema exception). When any of those move, reconcile this file and re-sync it to every repo.*
