# Scratch prompts

Tuning artifacts for harness A/B runs. **Derived, never authoritative.** The source of truth for live behaviour is `lib/ai/prompts/*.ts`.

## Operational rule

- A winning variant is promoted back to the live file as its own deliberate commit — by re-applying the delta, not by copying the scratch file blindly.
- This directory does not auto-sync from `lib/`. Drift is fine; it's tuning lab inputs vs production code.
- Files named `phase-{N}-{A,B,...}.md` are A/B variants for phase `N`. Letter `A` is the baseline at seeding time.

## What is seeded right now

Step 4 of the harness sequence (tuning infrastructure) seeds **Phase 4 and Phase 1 only**. Phase 3 ships as direct-edit-only this round; Phase 2 has no brief-divergence items. See `TESTING_LOG.md` for the per-phase divergence map.

- `phase-4-A.md` — literal copy of `PHASE_4_SYSTEM_PROMPT` from `lib/ai/prompts/phase-4-adjudication.ts` **after the D4.1 fix landed** (book-overlap clause removed from the DISCARD bullet). A/B compares D4.2 / D4.3 framings against this baseline; both variants land in step 5+.
- `phase-1-A.md` — materialized output of `buildPhase1SystemPrompt(librarySnapshot)` from `lib/ai/prompts/phase-1-development.ts`, with a 4-thesis library snapshot baked in (Grid Resilience + three cleanly-unrelated padding theses: Japan Megabank, Brand Korea, Retirement Villages). The snapshot is what makes the book-overlap scenario testable — without it, there is nothing for Phase 1 to flag against.

## Phase 1 library snapshot — refresh discipline

The Phase 1 scratch prompt embeds an inline library snapshot frozen against `lib/seed/theses.ts` as of **2026-06-07**. The padding picks were chosen to maximize distance from the AI-grid space, so Grid Resilience is the only legitimate overlap target inside scenario 4. If you change the seed list and want the harness to reflect it, **regenerate `phase-1-A.md` manually** — it is not computed at runtime. The HTML comment at the top of the file marks the freeze date for reviewers.

## What's not here

- `phase-2-*.md` / `phase-3-*.md` — not seeded this round. Add when their A/B work begins.
- Any output artifacts — those live under `outputs/` and are gitignored.
