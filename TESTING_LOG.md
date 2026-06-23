# Bellbird Testing Log

Running log of bugs, feature requests, and design decisions captured during testing.
Items below are additions or changes to be slotted against PLAN.md, not a parallel plan.

## Status legend
- ✅ **Approved** — design settled, ready to build, awaiting turn
- 🟡 **Open** — needs a decision before build
- ⏸️ **Deferred** — explicitly out of scope for now, logged for future
- ❌ **Rejected** — decided against

---

## 1. Voice input via Whisper

**Status:** ✅ Approved
**Build size:** Small

**Decided:**
- Voice input in the Develop chat window using OpenAI Whisper
- Use case: dictation while on the treadmill
- **Toggle behaviour** — tap Ctrl+Space to start recording, tap again to stop. Hands-busy friendly.
- Adds OpenAI as a second AI provider (new API key, kept out of chat)

---

## 2. Library: active vs on-hold split

**Status:** ❌ Rejected (deferred to Wedgetail)

**Reasoning:** Making Bellbird aware of executed-vs-suggested positions pulls it back into portfolio-state tracking, which is Wedgetail's job. Bellbird stays as ideation tool. The downstream consequence — heavier weight on cross-narrative alignment for live theses — would have been a Phase 4 prompt change, not just UI; reinforces this is the right call.

---

## 3. View / export thesis-generation discussion

**Status:** ✅ Approved (with placeholder for legacy theses)
**Build size:** Small once the data is there
**Urgency:** ⚠ *Transcript saving has time pressure — every new thesis generated until this ships is a permanently lost discussion.*

**Decided:**
- Save the Phase 1 Opus conversation to the thesis record at thesis-generation time
- Provide a viewer and a markdown export
- Legacy theses (created before the change ships) show placeholder text: *"Transcript not available due to thesis date."*

**Note:** Splittable into two parts — the urgent saving fix can ship ahead of the viewer/export UI.

---

## 4. Multi-select theses in Library — print / share

**Status:** ✅ Approved
**Build size:** Small. No schema change. Checkboxes + bulk export-as-markdown + print-friendly route.

---

## 5. Suggested-positions table — expand notes

**Status:** ✅ Approved
**Build size:** Small. CSS fix (wrap) plus a row-expand state to show the full note on click.

---

## 6. Live data fetching in Develop chat

**Status:** ✅ Approved (design settled)
**Build size:** Medium. Prompt redesign + reference file. No schema change.

**Decided:**
- *Not* pre-flight. Fetches happen **during** the conversation, once the thesis has shape and the relevant tickers/signals have surfaced.
- Behavioural rule, not opt-in: before stating any quantitative claim (price, yield, spread, multiple), Opus fetches via Massive or FRED. When the thesis identifies a ticker or signal, Opus fetches without asking.
- Fetches announced in chat ("checking copper") so the data trail is visible to James and ready for the eventual signals dashboard.
- Ship with a **price-guardrail system instruction**: Opus must not state any current quantitative figure it hasn't verified via a fetch.
- Ship with a **reference mapping file**: canonical FRED series codes for common concepts (FEDFUNDS, DGS10, etc.) so Opus doesn't hallucinate series names.

**Future extension (not this turn):** collated signals dashboard or table per thesis. Pairs with item 7 (triggers) once both exist.

**Naming note:** Polygon.io rebranded to **Massive** on Oct 30 2025. Old endpoints still work; new SDK defaults to `api.massive.com`. Use Massive branding in new code.

---

## 7. Triggers — invalidation conditions as first-class data

**Status:** ✅ Approved (design settled)
**Build size:** Large. Part of consolidated Phase 1 redesign (items 7 + 8 + 9).

**Decided:**
- **Per-thesis only.** Cross-thesis correlation belongs to Wedgetail; if a signal matters for multiple theses, duplicate it across them. Keeps Bellbird as ideation tool.
- **Schema** (designed to be Wedgetail-ready even though Bellbird uses it manually for now):
  - `description` (free text)
  - `type` — *confirming* / *disconfirming* / *kill-on-sight* / *action*
  - `monitoring_signal` (ticker or FRED code, dropdown where possible)
  - `threshold` (numeric + units)
  - `action_if_fired` (free text; Wedgetail can LLM-parse later)
  - `directional_effect` — *raises* / *lowers* / *invalidates*
  - `status` — *armed* / *fired* / *disarmed*
- **Phase 1 Opus prompt must solicit triggers** during thesis development: "what would kill this? what's the leading indicator we'd see first? what action does that trigger?" Without this, the fields will sit empty.

**Why kill-on-sight is its own type, not a severity flag on disconfirming:**
- Type drives downstream behaviour (notification priority, Wedgetail draft-command logic). Four distinct responses → four distinct types.
- Raises the bar to designate one. Preserves the Klarman discipline — if everything can be tagged kill, nothing is.

---

## 8. Conversational re-entry / ingestion into existing thesis

**Status:** ✅ Approved (design settled)
**Build size:** Large. Part of consolidated Phase 1 redesign.

**Decided:**
- Ability to re-open a saved thesis with Opus — full thesis context loaded — to discuss developments (news articles, data prints, earnings, etc.) and re-rank conviction.
- Shares machinery with item 7: same conversational re-entry, different entry point. Triggers solicit "X fired, how does this change things?"; ingestion solicits "here's a development, how does this change things?"
- Voice-friendly entry: "I just read X, walk me through how this changes the Y thesis."
- Each ingestion event is its own discrete artifact on the thesis — own saved discussion, navigable separately. Not one ever-growing thread.

---

## 9. Conviction history

**Status:** ✅ Approved (design settled)
**Build size:** Large. Part of consolidated Phase 1 redesign.

**Decided:**
- Every conviction-changing event (ingestion, trigger fire, manual update) creates a timestamped point in a history.
- Visible trajectory per thesis — the backward read that pairs with directional gamma's forward read.
- Foundation for the calibration layer in item 10 (if/when that ships).
- UI: simple trajectory display per thesis; each point links to the discussion that produced the change (ties back to item 8).

---

## 10. Calibration / question-audit / learning loop

**Status:** ⏸️ Deferred (Bellbird v2 or Wedgetail-adjacent)

**Captured because it's too good to lose:**
- Track meta-accuracy across theses over time: what went right, what went wrong, where the blind spots were.
- **The standout element: question audit.** "What should we have asked at the start that would have revealed where this thesis landed?" Feeds back into the Phase 1 Opus prompt so the system gets better at interrogating James over time. A genuine learning loop, not just logging.
- Compounds. Marginal in year one, potentially the most valuable asset in the project by year five.

**Why deferred:**
- Needs a corpus to learn from. Building the analysis layer before there's data is building on sand.
- Three upstream features (triggers, ingestion, history) are schema-altering. Live with them before layering analysis on top — otherwise the analysis is designed against the wrong schema.
- Substantial enough to be its own project, not a turn within this build.

## 11. Visual redesign — adopt bond-file design language across all modes

**Status:** ✅ Approved (option C of three)
**Build size:** Largest single piece on the log. Two phases: mockup draft (this chat), then Claude Code rebuild.

**Problem:**
- Current stylesheet hard to read in actual use. Whisper-coloured 10–11px uppercase labels and 13px sans body create persistent low-contrast strain across the app.
- Cycles page in particular: CycleGauge is a coloured dot, not a gauge; DistRow uses 2px-tall bars; no axes, units, or historical context anywhere. Failed at its core job (scan-and-judge at a glance).
- Bellbird's job is analytical, not editorial. The cream-paper aesthetic fits a printed quarterly review, not an investing workspace where readability and numerical density matter most.

**Decision: full flip (option C).**
- Adopt the bond files' visual language across all six modes
- Dark `#16140f` background, cream `#ece4d3` text, mono `#d9803f` orange as the "current/now" accent
- Fraunces serif 14.5–32px for body and headings, JetBrains Mono 9–26px for numbers and labels
- Core component patterns: Panel (title + sub + current badge), Gauge (track + current marker + historical extremes + read paragraph), Note (italic serif under each chart), Key (legend)
- Every indicator surface shows: current value, historical extremes, long-run reference, explicit "read" paragraph

**Options considered:**
- A. Narrow fix (rebuild only Cycles in existing palette) — rejected, doesn't address broader readability
- B. Hybrid (cream for thesis content, dark for indicators) — rejected, visually disjointed
- C. Full flip — selected

**Implications:**
- `bellbird-mockup.jsx` is superseded. A new `bellbird-mockup-v2.jsx` becomes the design source of truth.
- Mockup work happens in this chat, not Claude Code. Claude Code rebuilds against the v2 mockup once it's settled.
- The redesign should land before items 4, 5, the viewer half of 3, item 6 UI, voice input UI, and the Phase 1 redesign surfaces — otherwise UI gets built twice. Backend-only work (transcript saving, price guardrail, FRED mapping file) can proceed in parallel.

**Preview status:** ✅ Complete across all six modes.
- `bellbird-mockup-v2-preview.jsx` (24 May 2026) — Library + Developed Thesis. Established palette, type tokens, Section, PositionsTable, ConvictionGauge.
- `bellbird-mockup-v2-cycles.jsx` (25 May 2026) — Cycles · Now. Added ConvergenceMap, CycleGauge (slimmed), PhaseTag, AnalogRow.
- `bellbird-mockup-v2-cycles-history.jsx` (25 May 2026, rev 3) — Cycles · History. Added SubTabs, LegendStrip, PresetStrip, percentile chart, EquityPanel with drawdown/price toggle, severity-class reference lines, DrawdownTooltip.
- `bellbird-mockup-v2-stack.jsx` (25 May 2026) — Identity + Develop + Watch + Portfolio. Added PrincipleRow, ServiceStatus, ChatBubble, DataFetchEvent, VoiceButton (toggleable), ContextPane, TriggerPill, GammaArrow, AllocationBar, CorrelationRow.

**Total component patterns established:** ~25, all consistent across palette, typography, spacing, and behaviour. Ready for Claude Code rebuild against this design system.

---

---

## 12. Cycles · History sub-page — multi-signal historical study tool

**Status:** ✅ Approved (design confirmed, mock shipped)
**Build size:** Large. Most complex chart in the app. Non-trivial data layer.

**Decided:**
- Goal is **learning** — pattern recognition across recessions and convergence episodes, not current-state reporting.
- **Lives on Cycles as a sub-tab.** Cycles has "Now" (multi-gauge dashboard) and "History" (this). Sub-tab navigation introduced in the mock.
- **Plots raw signals, not constructed cycle indices.** Shiller P/E, IG–HY spread, real 10Y, 2/10/30Y nominals, AI capex YoY, real wage growth. FRED-published series.
- **Percentile-against-own-history normalisation.** All series on a 0–100 scale. Raw values exposed on hover. 90th-percentile reference line in chime marks the convergence zone.
- **NBER recession bands** as gray fills. Era markers (Volcker, Black Monday, LTCM, dot-com peak, Lehman, COVID, AI capex boom) as dashed verticals with mono labels.
- **Filterable legend** — click any series chip to toggle. Default visible: Shiller P/E, IG-HY, Real 10Y, AI capex YoY.
- **Date-range presets**: Full · 1990–now · 2000–now · 2020–now.
- **Three analog rows** (1968–69, 2000, 2007) each with a `Look` annotation telling you what pattern to find in the chart, plus a `Today` synthesis at the bottom comparing now to the analogs.

**Final scope shipped (rev 3, 25 May 2026):**
- Multi-signal percentile chart with 9 series (Shiller P/E, IG–HY, Real 10Y, AI capex YoY, Buffett indicator, 10Y/2Y/30Y nominals, Real wage YoY)
- NBER recession bands properly visible (fractional dates working via numeric x-axis)
- Era markers at notable convergence/inflection points
- Filterable legend chips, four series visible by default
- Date-range presets: Full · 1990–now · 2000–now · 2020–now
- Stacked S&P 500 secondary panel with **two views**: Drawdown from peak (default) and Price + 200-day MA, toggleable in panel header
- Drawdown view uses intra-year troughs to surface real severity, with horizontal severity-class lines (Correction at -20%, Bear Market at -40%) and tooltip naming the drawdown class
- Three analog rows (1968–69, 2000, 2007) with `Look` annotations that reference both panels
- Today synthesis read comparing current setup to analogs

**Rev history:**
- rev 1 (25 May): initial mock with chart, bands, era markers, analogs, today
- rev 2 (25 May): added Buffett indicator, fixed band colour for dark bg, added S&P + 200dMA stacked panel
- rev 3 (25 May): fixed recession-band rendering bug (XAxis categorical mode dropped fractional dates), added drawdown view with severity-class lines

**Build implications (carried forward to Claude Code turn):**
- Backend data layer is non-trivial. Need quarterly or monthly FRED integration for ~9 series back to 1970, plus client- or server-side percentile transformation against full history.
- NBER recession dates from a maintained source.
- AI capex YoY may need to be a composite (sum of hyperscaler capex from MSFT/GOOGL/META/AMZN/ORCL), not a single FRED series.
- Drawdown values need daily-close S&P data to compute intra-year troughs, not just year-end.
- Charting library: recharts (already in project). XAxis must be `type="number"` for ReferenceArea to render properly with fractional dates.

---

## 13. Attachments in Develop chat — images, PDFs, transcripts

**Status:** ✅ Approved (was already in Turn 5 backlog as highest priority; surfaced via conversation search 25 May)
**Build size:** Medium. UI + storage + API plumbing.

**Decided:**
- Develop chat needs a file picker that supports images (PNG, JPG), PDFs, and pasted-in text (YouTube transcripts, article text).
- UI: attachment button next to voice input button in chat input area.
- Storage: Supabase Storage bucket for thesis-attachment binary content.
- API plumbing: Anthropic API supports image + PDF as base64 in messages; Phase 1 prompts pass attachment references through to Opus.
- Attachments persist with the conversation so they're available on re-entry (item 8) and discussion-log view (item 3).

**Why this matters:**
- Without it, the Develop pipeline can only work from text you type in — a structural limit on the mode's value. Charts, broker reports, earnings transcripts, news article PDFs, screenshots of FRED graphs — none of these can currently enter the pipeline.
- This was flagged in May as a near-blocker on the Develop mode's usefulness. Treated as higher priority than the other Turn 3 backlog items at the time. Never built.

**Build slot:** Rebuild Turn B (Develop mode rebuild), since the UI sits in the chat input area. Backend storage setup can happen in parallel.

---

## 14. Iterate UX — preserve prior state

**Status:** ✅ Approved (Turn 3 backlog from May, surfaced 25 May)
**Build size:** Small to medium.

**Decided:**
- Currently the Iterate function replaces the prior thesis summary, positions table, and stress-test dialogue when triggered — user has to remember all the counterarguments and prior positions from memory.
- Two approaches considered:
  - Anchor prior thesis/positions/stress-test below; new iteration chat opens above
  - Open the iteration as a sub-discussion below everything, preserving the original conversation intact
- Preference (from May discussion): **sub-discussion below** — cleaner separation, original conversation stays as a complete artifact, iteration is clearly its own thing.

**Build slot:** Rebuild Turn B (Develop mode).

---

## 15. Prompt prefill chips

**Status:** ✅ Approved (Turn 3 backlog from May)
**Build size:** Small.

**Decided:**
- After Opus pushback in a Develop conversation, surface pre-selected prompt options as clickable chips: "Explore triggers for X", "Go deeper on Y", "Counter-argue Z". Reduces friction on the follow-up turn.
- Chips generated by Phase 1 Opus as part of its turn, parsed and rendered as tap-to-fill input.

**Build slot:** Rebuild Turn B (Develop mode).

---

## 16. Table rendering in chat

**Status:** ✅ Approved (Turn 3 backlog from May)
**Build size:** Small. Markdown-to-table rendering in chat bubbles.

**Decided:**
- Markdown tables in chat messages currently render as plain text with pipe characters visible.
- Render proper HTML tables in v2 chat surface (use the PositionsTable visual language from the v2 system for consistency).

**Build slot:** Rebuild Turn B (Develop mode).

---

## 17. Pipeline prompt overhaul via harness

**Status:** ✅ Approved (was parked from May; surfaced via conversation search 25 May)
**Build size:** Substantial. Multi-step sequence using the existing harness.

**Decided:**
- The prompt-testing harness already exists at `scripts/prompt-harness/` (committed in the Turn 3.1 chain). Direct SDKs, max-tokens 4096, temperature 0.4. Never used — tuning work was deferred to finish the five-turn spine first.
- Now that the spine is complete, the harness work resumes. **Consolidated with items 6, 7, 8, 9** rather than run separately — those items are themselves prompt-redesign work, and using the harness to test them in isolation from the broader fine-tuning would mean doing the prompts twice.
- Canonical harness sequence (this is the single home for step numbering — `brief.md` references these by name, not number; `PLAN.md` §9 #11 points here too):
  1. **Best-practices brief** — yardstick for variant judgement (shipped, commit `a3d02b2`)
  2. **Test fragments** — 6 scenarios with sidecar checklists under `scripts/prompt-harness/fragments/` (shipped, commit `ce8222f`)
  3. **Retrospective acceptance check** — apply `brief.md` to live `lib/ai/prompts/phase-{1,2,3,4}-*.ts`; log per-phase tuning items into this log for steps 5–8 to address
  4. **Tuning infrastructure** — scratch-prompt seeding into `scripts/prompt-harness/prompts/` (one starting variant per phase, copied from live), runner recursion fix for nested fragment dirs (one-level recurse in `listInputFiles`), library-snapshot bake into the Phase 1 scratch copy used against scenario 4
  5. **Phase 4 variants + challenge prompt** — Klarman downside-first verdict, folding item 9 (conviction-change capture)
  6. **Phase 1 variants** — folding items 6 (data fetching + price guardrail), 7 (triggers solicitation), 8 (conversational re-entry / ingestion)
  7. **Phase 3 variants** — Grok stress-test, inversion discipline
  8. **Phase 2 variants** — JSON contract / structuring; folds in the open questions surfaced during the 2026-06-03 Sonnet→Opus migration (staged-vs-deployed weight convention, conviction inference when no number named)
  9. **Harness comparison runs across variants** — sweep the winning candidates against the full fragment set
  10. **Finals** — promote winning variants back to live `lib/ai/prompts/*.ts` as deliberate commits, one per phase

  Order of phase-tuning steps 5–8 confirmed by step 3's divergence findings (see step-3 output sub-section below). Phase 4 leads because the brief audit surfaced a direct contradiction in its DISCARD definition (D4.1). Phase 2 trails because the audit found its prompt the tightest of the four — its remaining work is the two open questions in the sub-section above, not brief-divergence items.

**Why now and not earlier:**
- The original argument for parking ("finish the spine first") is satisfied — Turn 5 shipped clean.
- The original argument for parking ("the pipeline works, not broken just not optimised") is still true, so this remains a quality improvement, not a fix.
- The v2 rebuild and the prompt overhaul are *independent* — the rebuild changes UI surfaces; prompts are string content behind those surfaces. Doing prompts after the rebuild means tuning them in the surface they'll actually live in.

**Why after the v2 rebuild specifically:**
- Items 6, 7, 8, 9 have UI dependencies — the prompts solicit behaviour that surfaces in the chat UI, triggers UI, ingestion UI. Cleaner to redesign prompts against a settled UI than against a moving target.
- Prompt work is open-ended in a way the rebuild isn't. Easier to bound risk by doing the rebuild first (predictable scope) and the prompt work second (open-ended but isolated).

**Build slot:** After v2 rebuild Turn C, before any other backlog work. Treated as its own dedicated track — small approve-and-execute mini-steps rather than one big block.

### Phase 2 prompt — open questions surfaced during 2026-06-03 Sonnet→Opus migration

Both items fold into step 8 (Phase 2 variants) of the canonical harness sequence above. Not gating the migration commit; logged here so they're not lost.

- **Staged/reserved positions — target weight vs deployed weight.** In the Cyber Dispersion side-by-side, Opus read CRWD as `weight: 40` (target weight when reserved-leg triggers fire) while the prior Sonnet output read it as `weight: 0` (deployed today). Both defensible reads of the conversation. Needs a settled convention, tested through the harness, because it changes how Portfolio allocation reads every staged leg. Resolve before the next thesis with a reserved-leg structure enters the book.
- **Conviction inference when the conversation didn't name a number.** The 2026-06-03 migration test transcript stated 65, so the inference-when-missing case went untested. Verify on the next real thesis where no number is named: does Opus derive a thoughtful conviction from the discussion's tenor, or default to 65? If it defaults, sharpen the inference instruction in the Phase 2 prompt during the harness track.

### Step 3 output — per-phase tuning backlog (2026-06-05)

Retrospective acceptance check applied `brief.md` to live `lib/ai/prompts/phase-{1,2,3,4}-*.ts`. Disqualifier sweep for author names came back clean across all four prompts. The step-3 working file is at `~/.claude/plans/harness-step-3-humming-ullman.md` (read-only artefact, not committed). Findings below.

Per divergence: severity (HIGH / MEDIUM / LOW) + **direct edit** (apply to live prompt as a one-off commit, no harness needed) OR **A/B** (run through the harness in step 4+). Step 4 (tuning infrastructure) only needs scratch copies for A/B items — direct edits can land before or alongside infrastructure, since they re-apply explicit brief decisions and don't need variant comparison.

**Step 5 — Phase 4 (highest divergence)**
- **D4.1 — DISCARD trigger: remove "duplicates existing book exposure" clause.** Book-overlap is Phase 1 information, not a Phase 4 verdict input. Brief explicitly removed it; live prompt (line 11 of `phase-4-adjudication.ts`) still has it. *HIGH. Direct edit.*
- **D4.2 — PROCEED: add asymmetric-standard framing** — "bar to proceed is higher than bar to question." *MEDIUM. A/B.*
- **D4.3 — DISCARD: add high-bar framing** — "DISCARD threshold is high; preserves the 'if anything can be killed, nothing is' discipline." *MEDIUM. A/B.* Pairs thematically with D4.1 ("DISCARD is rare"); measure D4.3 A/B against the post-D4.1 baseline so the variants don't trip over each other.
- **D4.4 — Reasoning: add audit-trail framing** — verdict and reasoning should be auditable months later from the reasoning alone. *LOW. Direct edit.*
- **D4.5 — Skipped in namespace.** Informally referenced in the step-5 judging doc as a schema-conformance concern; reclassified at the time to item 18 (route-level parse-guard). Number deliberately not reused.
- **D4.6 — Verdict-distribution / STRESS_TEST attractor** (surfaced 2026-06-08, resolved 2026-06-09). *HIGH. Direct rewrite.*

  **The finding.** Step-5 A/B (12 calls: A/B/C × 4 theses) returned STRESS_TEST 12/12. Boundary-case rerun (uranium clean-PROCEED candidate + mall-REIT broken-premise candidate) isolated this as a STRESS_TEST attractor in baseline A, not a property of the inputs. Uranium-A: own reasoning conceded "neither point breaks the directional bet" yet returned STRESS_TEST. Mall-REIT-A: own reasoning conceded the contrarian's diagnosis was the consensus repricing already expressed in the 7% cap (broken-premise read) yet returned STRESS_TEST. PROCEED and DISCARD were structurally unreachable from honest inputs under A.

  **The diagnostic that nailed it to PROMPT-level.** `phase-4-D.md` (single-variable change against A: rewritten verdict definitions + verdict-distribution discipline block). Uranium A→STRESS_TEST, D→**PROCEED**, with D's reasoning correctly applying the "does not break the core mechanism → PROCEED, full stop" test — quantified the supply-elasticity counter as non-breaking (8-12M expansions don't close a 30M gap; the contrarian's own concession about manufacturing/regulatory lead-time IS the thesis's pricing window) and concluded "the contrarian shifts the timing band but the load-bearing structure holds." Prompt-level fix demonstrated.

  **The DISCARD-side resolution (adopted reading).** A broken premise with a live adjacent expression is STRESS_TEST (re-express), not DISCARD. DISCARD is reserved for a dead insight (no live expression anywhere) OR a broken mechanism with nothing recoverable. Under this reading, DISCARD is structurally rare by design at the ideation layer. Mall-REIT D→STRESS_TEST is brief-faithful — D's reasoning identified the A-mall-scarcity rescue expression that exists in reality (even though the thesis author excluded it from the test case) and routed to STRESS_TEST/re-express. This is the high-bar discipline working, not the attractor failing. This reading must be encoded in **both** the Phase 4 prompt and `brief.md` at promotion.

  **Path B rejected.** Synthetic dead-insight DISCARD test was considered but rejected: cannot locate the re-express/kill line on realistic theses without engineering the input; DISCARD reachability is confirmed by real-world use over time, not synthetic harness inputs. (Superseded 2026-06-10 — a synthetic dead-insight fragment (13, Veridian) was built and used as the DISCARD gate for the promotion turn; see Step 5 CLOSED.)

  **Implication for D4.2 / D4.3.** Both A/B variants returned 12/12 STRESS_TEST identical to A in step 5 — not because they failed, but because they were never tested against their target conditions (D4.2 needs a PROCEED candidate to potentially downgrade; D4.3 needs a DISCARD candidate to potentially hold). Currently parked. Re-runnable against the post-D4.6 baseline if the target conditions become testable; not promoting B or C now.

  **Fix (promotion queue).** See step-5 closure sub-section below for the queued promotion turn.

- **D4.7 — Should Phase 4 re-express routing surface author-excluded adjacent expressions?** Source: item 19 fragment-12 route variance, accepted by operator ruling 2026-06-13.

**Step 6 — Phase 1 (high divergence)**
- **D1.1 — Add reference-class / base-rate prompting** — when the user reaches for a story, reach for the reference class: base rate, comparable cohort, has this worked before / when. *HIGH. A/B.* Antidote to narrative framing; core to the second-level-thinking approach. The meaty one — most likely to surface multiple variant directions. D1.3 (mechanism-vs-narrative contrast) folds into this A/B; same variant set, both speak to narrative-resistance.
- **D1.2 — Enumerate "ready" criteria** — mechanism named, contrarian view engaged not dismissed, hedge sketched, basket provisional but discussable. *LOW-MED. Direct edit.*
- **D1.4 — `<suggestions>` block** — not a gap; preserve the feature when Phase 1 is tuned. *Awareness only.*

**Step 7 — Phase 3 (low divergence)**
- **D3.1 — Add "moralizing" to the disqualifier list** alongside strawman and surface details. *LOW. Direct edit.*
- **D3.2 — Name severity as the disagreement matrix's calibration principle** (not just a per-row field — the matrix should be ordered/weighted by it). *LOW. Direct edit.*
- ~~**D3.3 — Schema conformance**~~ — reclassified out of prompt-tuning on 2026-06-08; promoted to item 18 below as a route-level code-hardening fix.

**Step 8 — Phase 2 (lowest divergence — no brief-divergence work)**
- **D2.1 — `.min(20)` prompt-level reminder: skip.** Schema enforces; substance ("never empty") already in prompt.
- **D2.2 — Readiness summary line: skip.** Effectively implicit.
- Phase 2's only tuning items are the two open questions in the sub-section above (staged-vs-deployed weight convention; conviction-inference-when-no-number-named). Independent of the brief audit.

**Step 4 implication.** A/B items: D4.2, D4.3, D1.1 (with D1.3 folded). Tuning infrastructure (scratch prompts under `scripts/prompt-harness/prompts/`, runner recursion fix, library-snapshot bake for scenario 4) only needs scratch copies for **Phase 4 and Phase 1**. Phase 3 and Phase 2 are out of scope for this round of step 4 — Phase 3 ships as direct edits only, Phase 2 has no brief-divergence items.

**Direct-edit batch summary.** Five direct edits across three phases: D4.1 + D4.4 (Phase 4), D1.2 (Phase 1), D3.1 + D3.2 (Phase 3). Can land as a single prompts-only commit ahead of harness infrastructure work, or interleaved per phase with each phase's A/B work — sequencing TBD when steps 5–7 begin.

### Brief reading clarification — Phase 4 DISCARD threshold (2026-06-08)

Surfaced during step-5 boundary-case planning. Two readings of the brief's Phase 4 DISCARD second clause ("the picks-and-shovels insight is already priced") were possible:

1. **Literal reading:** any captured picks-and-shovels insight lands DISCARD regardless of how well-formed the thesis is.
2. **High-bar reading:** "already priced" → DISCARD ONLY when the insight itself is dead and no expression recovers edge. Expensive/captured but the insight has runway → STRESS_TEST. The "if anything can be killed, nothing is" discipline dominates.

**Adopted: reading (2) — the high-bar reading.** Consequence for step 5: a "long Vertiv standalone, captured consensus position" thesis lands STRESS_TEST not DISCARD, because the cooling-buildout insight still has runway through cycle and expression. The clean-DISCARD test pathway is a genuinely *dead* insight or a *broken* (not dented) central premise.

**Resolution (2026-06-09).** The reading held through step-5 completion and was sharpened by the Phase 4 boundary-case D run: a broken premise with a *live adjacent expression* is STRESS_TEST (re-express), not DISCARD. DISCARD is reserved for a dead insight (no live expression anywhere) OR a broken mechanism with nothing recoverable. Mall-REIT D→STRESS_TEST is brief-faithful application of this reading — D's reasoning identified the A-mall-scarcity rescue expression that exists in reality (even though the thesis author excluded it from the test case) and routed to STRESS_TEST/re-express. The `brief.md` edit lands as part of the queued promotion turn (see step-5 closure below), code-before-docs.

### Step 5 closure (2026-06-09)

**Outcome.** The original step-5 A/B (D4.2 asymmetric standard, D4.3 high-bar DISCARD) returned 12/12 STRESS_TEST identical to baseline A — diagnosed via boundary-case rerun as a deeper PROMPT-level attractor in A (logged as D4.6). The boundary-case Phase D diagnostic (`phase-4-D.md`) confirmed the fix is prompt-level and contained. D4.2 and D4.3 were never tested against their target conditions and are parked, not promoted.

**Promotion queue (next turn, after `/clear`).** (executed 2026-06-10 — see Step 5 CLOSED below)

1. **Promote D's verdict architecture to live `lib/ai/prompts/phase-4-adjudication.ts`.** Specifically: D's PROCEED definition ("does not break the core mechanism — full stop; shifts/narrows-but-not-breaking is still PROCEED"), the verdict-distribution discipline block ("STRESS_TEST is not the default; a landed-but-non-breaking contrarian argument is grounds for PROCEED, not for iteration"), and the adopted DISCARD wording (broken premise with no recoverable expression OR dead/already-priced insight with no expression that recovers edge). Single-commit Phase 4 prompt rewrite.
2. **Update `brief.md`** Phase 4 section to match — encode the high-bar DISCARD reading explicitly (broken-with-nothing-recoverable / dead-insight) and the STRESS_TEST-not-as-default discipline. Code-before-docs ordering.
3. **D4.2 and D4.3 parked.** Re-runnable against the post-D4.6 baseline if/when their target conditions (a real PROCEED candidate that B might downgrade; a real DISCARD candidate that C might hold) become testable in real-world use.
4. **Item 18 (route-level schema parse-guard) ships independently** — its own commit, not bundled with the Phase 4 prompt promotion.

**Cost.** Step 5 total spend: ~$1.00 across 22 API calls — Phase 3 input gen (4 Grok), Phase 4 A/B (12 Opus), boundary Phase A (2 Grok + 2 Opus), boundary Phase D (2 Opus). Within the initial $0.40–$2.00 envelope.

**Scratch files retained.** `scripts/prompt-harness/prompts/phase-4-{A,B,C,D}.md` and `fragments/{7,8,9,10,11,12}-phase-4-*/` stay on disk as the audit trail for the step-5 finding. Not cleaned up — the path from "A defaults to STRESS_TEST" to "D demonstrates prompt-level fix" is in those files.

### Step 5 CLOSED (2026-06-10)

Promotion queue above executed. **Step 5 (Phase 4) is closed — no remaining Phase 4 harness work.**

- **D promoted to live.** D's verdict architecture is now `PHASE_4_SYSTEM_PROMPT` in `lib/ai/prompts/phase-4-adjudication.ts` (commit `763b4e2`). Route confirmed: `app/api/adjudicate/route.ts` imports `PHASE_4_SYSTEM_PROMPT` and passes it as the `system` arg of the `generateObject` call, so production runs the promoted prompt.
- **Verified across three boundary poles.** uranium → PROCEED, mall-REIT → STRESS_TEST, Veridian → DISCARD. All three verdicts reachable and correctly split from honest inputs — the STRESS_TEST attractor (D4.6) is resolved.
- **B and C retired from the A/B queue** (supersedes the "parked / re-runnable" note in the 2026-06-09 closure queue, item 3). D4.2 (B, asymmetric-standard) and D4.3 (C, high-bar DISCARD) earn nothing against live D: **C is subsumed** — it is the weaker form of D's two-leg DISCARD gate (broken-with-nothing-recoverable / dead-insight already carries C's "if anything can be killed, nothing is" discipline, more strongly). **B is counter to D** — its "favour STRESS_TEST when the contrarian lands on load-bearing weight" is inverse-polarity to D's PROCEED carve-in ("a landed-but-non-breaking contrarian argument is grounds for PROCEED, not iteration"), so re-running it would re-open the exact attractor D4.6 killed. Retired, not parked. Scratch files stay on disk as audit trail only.

---

These were flagged in May's Turn 5 verification but never fixed. They affect already-built code that will be touched during the v2 rebuild (Turn C especially). Documented here so they're not lost.

**Buffett z gauge/grid contradiction.** The cycles page Buffett gauge cites `buffett_z` from `cycle_readings.contributing_series` (+2.57), while the grid cell shows `z_score_30y` from the latest `macro_indicators` row (-1.74). Two different computations of the same concept producing opposite signs. Reconcile to a single source of truth. *Important to fix before the v2 Cycles · History page ships, since Buffett indicator is a first-class series in the new design.*

**HY Credit Spreads only ~3y of history.** BAMLH0A0HYM2 returned 794 daily rows from FRED on backfill — that's ~3 years, not the intended 30. Z-score is implicitly computed against the 3-year window. Verify FRED history depth for that series; adjust the fetch if needed. *Affects the IG-HY spread series on the v2 percentile chart.*

**Latent pagination bug in `lib/fred/refresh-job.ts`.** The `upsertSeries` existing-rows query has no `.limit()`. Same family as the cycles-queries pagination bug fixed in Turn 5. Add `.limit(10000)` when next touching the file.

**Trade delete quirk in Portfolio.** Current price for a ticker survives when the last trade for that ticker is deleted. Should clear.

**Share count column missing on Portfolio holdings rows.** Display omission.

---

## 18. Phase 3 / Phase 4 route schema parse-guards

**Status:** ✅ Approved (code-hardening, not prompt-tuning)
**Build size:** Small. ~30 lines across two routes.

Surfaced during step-5 harness run (2026-06-08). Two related schema-conformance failures observed in model outputs against the live Zod schemas:

- **Phase 3 (Grok).** The gaming-dispersion `disagreement_matrix` came back as a YAML/markdown list rather than the JSON array the Zod schema expects. Three of four theses returned JSON; only the thinnest input drifted. In the live `app/api/stress-test/route.ts` route this would fail Zod parse.
- **Phase 4 (Opus).** The gaming-B adjudication came back as plain prose ("Verdict: STRESS_TEST\n\nThe thesis rests on…") rather than the `{ verdict, reasoning }` JSON. Same input thinness, same drift mode. Would fail Zod parse in `app/api/adjudicate/route.ts`. **Third and fourth occurrences (2026-06-08/09):** the boundary-case uranium-A and uranium-D adjudications both returned plain prose ("verdict: STRESS_TEST\n\nreasoning: …" and "verdict: PROCEED\n\nreasoning: …"). Drift pattern is **input-driven, not prompt-driven** — repeats on the structurally shortest inputs across both A and D variants on the same scenario. Four occurrences across two phases on three different inputs (gaming Phase 3, gaming-B Phase 4, uranium A, uranium D) confirms the pattern is not noise and not prompt-fixable. Route-level parse-guard is the right fix.

**Fix is at the route, not the prompt.** Format drift on thin inputs is a model behavior that won't be fully eliminated by prompt tightening — the right pattern is route-level reliability:

1. On first response, attempt `schema.safeParse(...)`. If it fails, retry once with a system-message appendix naming the schema shape and that the prior response did not conform.
2. On second failure, surface the error to the caller — don't silently fall back.
3. Apply symmetrically in both `app/api/stress-test/route.ts` and `app/api/adjudicate/route.ts`. Retry budget capped at 1 to bound cost and latency.

Originally captured as D3.3 in the step-7 Phase 3 prompt-tuning backlog (now reclassified above) and surfaced informally as a Phase 4 schema concern in the step-5 judging doc. Both fold here. Independent of any prompt variant choice.

**Build slot:** small standalone code-hardening commit. Ship before the next live production thesis run where input thinness might be plausible.

---

## Turn B follow-up backlog

Logged at end of Turn B (27 May 2026). Each is a deferred slice of something that landed in Turn B as chrome only — the schema or data layer wasn't ready, so the UI shipped with empty-state copy and the wiring is queued as its own follow-up.

**Whisper end-to-end wiring.** VoiceButton ships in Turn B as UI chrome with a "coming soon" toast. The full wiring needs OpenAI as a second AI provider (env var), a `/api/transcribe` route, MediaRecorder client wiring, and toggle behaviour on Ctrl+Space. Own small follow-up turn.

**ContextPane live wiring.** All three cards (Thesis emerging, Tickers · live, Recent fetches) ship as chrome with empty-state copy. Wiring depends on item 6 (live data fetching). When item 6 lands, populate Tickers + Recent fetches from the data trail and Thesis emerging from Phase 2 structured output.

**Watch full wiring.** Watch ships in Turn B as functional skeleton, real data only. Trigger pills, conviction-delta, and directional gamma render as em-dashes until items 7 (triggers schema) and 9 (conviction history) land. When both land, light up the trigger pills, gamma arrows, and conviction-delta. Backing trigger filter tabs ("Triggers armed", "Triggers fired", "Kill-armed only") also wait on this.

**Correlation clusters on Portfolio.** Mockup shows a Correlation clusters section at the bottom of Portfolio; no backing data exists. Section omitted from Portfolio in Turn B. `components/shared/CorrelationRow.tsx` ships for the follow-up to use. Wiring requires deciding how clusters are computed (manual tagging? sector-based heuristic? cross-thesis correlation matrix?). Pairs naturally with item 7 (triggers — what fires across multiple theses).

**Library multi-select export (item 4).** Approved but not folded into Turn B's explicit in-scope list. Small turn — checkboxes on Library list + bulk export-as-markdown + print-friendly route.

**Library discussion log viewer + markdown export (item 3 viewer half).** Saving half of item 3 already shipped in the backend-only turn. The Library detail page renders a PLANNED placeholder for Discussion log. Viewer UI + markdown export ship in this follow-up.

**Phase 2 Sonnet→Opus migration.** Currently runs Sonnet 4.6 in app/api/structure/route.ts. Decision made (pipeline quality > $3/thesis cost savings on $100k decisions) but code change never scheduled. Own future turn: change structure route to use Opus, update phase-2-structuring.ts self-identification, update phase-3 and phase-4 prompt references to upstream model, validate structured-output schema doesn't depend on Sonnet quirks, then scrub PLAN.md + CLAUDE.md. Don't bundle this with other work — testing burden of pipeline phase change needs its own verification.

**Develop input affordances — visible send + abort/cancel.** Current state: Enter-only submit, no way to cancel if Opus errors mid-stream. Add a visible send button next to the input area, and an abort/cancel button that surfaces while a request is in flight. Small UI turn, no schema.

**ContextPane empty-state visual weight.** Three substantial-looking panels feel oppressive when empty and compete with the active conversation. Fix: drop the panel background on empty-state cards, keep just hairline + label + italic copy. Full panel treatment activates when the card has real data. Fold into the same follow-up turn that wires ContextPane live (Tickers + Recent fetches with item 6).

**Cost tracking in Develop — running token/dollar counter per conversation.** Was in original Turn 3 plan; missing from v2 rebuild. Either regression from v1 Develop tree (now deleted in Phase 9 cleanup) or never built. Either way: needs to ship before Develop is considered complete. Folds naturally into the Develop polish turn.

**Attachment rendering in conversation history.** The attachments table persists rows correctly and links them to messages, but DevelopChat doesn't render any indicator on saved messages showing what was attached. On page reload, attached files disappear from the UI even though they shaped the conversation. Fix: render attachment chips under saved messages, showing filename + click-to-preview (or click-to-download) affordance. Same Develop polish turn.

---

## Recommended build sequence

Slotted against PLAN.md, in this priority order:

1. **Backend-only fixes first** (no UI). Ship the *saving* half of item 3 (transcript persistence) plus the price-guardrail instruction from item 6. Both prevent ongoing damage. Short turn. Can run in parallel with the rebuild below.

2. **v2 rebuild — Turn A: design system foundation + Identity.** Build `tokens.js` with the full palette, type scale, font loader, and FONT_STYLES. Build shared components (Section, Panel, Gauge variants, PositionsTable, hairline-row pattern, recession-band rendering with the `type="number"` axis fix baked in). Rebuild Identity mode end-to-end as proof the foundation works. Verify side-by-side against `bellbird-mockup-v2-stack.jsx`. Identity is small enough that any token or component issues surface before five other modes inherit them.

3. **v2 rebuild — Turn B: Library, Develop, Watch, Portfolio.** Once foundation is settled, the four compositional modes go in one turn. Mostly assembled from already-built pieces. Adds: ChatBubble, DataFetchEvent, VoiceButton (toggleable Whisper input from item 1), ContextPane, GammaArrow, TriggerPill, AllocationBar, CorrelationRow. **Also folds in items 13 (attachments), 14 (iterate UX), 15 (prompt prefill chips), 16 (table rendering) — all Develop-mode surface changes that should land with the Develop rebuild rather than as separate later turns.** Fix the trade-delete and share-count bugs while in Portfolio. Verify each mode against its mockup before approval.

4. **v2 rebuild — Turn C: Cycles in full.** Both sub-pages with SubTabs navigation, multi-gauge Now dashboard, percentile chart, equity panel with drawdown/price toggle. Most complex turn — adds the recharts layer (syncId, percentile normalisation, NBER bands, era markers, AreaChart for drawdown) and real data integration (S&P daily closes, Buffett indicator series, NBER dates). **Resolve the three Cycles-related bugs while in this turn: Buffett z reconciliation, HY spreads history depth, upsertSeries pagination.** Cycles ships last because it depends on settled tokens *and* real data plumbing.

5. **Pipeline prompt overhaul** (item 17, consolidating items 6, 7, 8, 9). Use the existing harness to fine-tune all four phase prompts and bake in the new behaviours: live data fetching with price guardrail, triggers solicitation, conversational re-entry / ingestion, conviction-change capture. Open-ended scope but isolated — runs against the now-settled v2 UI. See item 17 for the canonical step list.

6. **Deferred:** item 10 (calibration loop) and item 2 (active/on-hold → Wedgetail).

Sequence may need to flex around whatever turn of PLAN.md is currently live. Note that the three-turn rebuild (steps 2–4) replaces what would have been step 3 in the previous sequence — staged for recoverability rather than shipped in one turn. Items 13–16 fold into Turn B; the technical bugs fold into Turn B (Portfolio bugs) and Turn C (Cycles bugs). Items 6, 7, 8, 9 consolidate into step 5 (the harness prompt overhaul track) rather than running as separate prompt-redesign turns.

---

## Open decisions

*None outstanding.*

---

## v2 rebuild complete (Turns A/B/C)

**Dates:** Turn A 2026-05-26 · Turn B 2026-05-27 · Turn C 2026-05-29.

### What shipped

- **Foundation (A):** v2 design tokens + FONT_STYLES in `lib/tokens.ts` (dark-paper palette, chime accent, phase/conviction palette). Identity mode rebuilt end-to-end against v2 mockup. All other modes stubbed via `StubScreen` pending their turn.
- **Compositional modes (B):** Library / Develop / Watch / Portfolio all rebuilt against v2. Shared component library landed in `components/shared/` (Section, PlannedSection, AllocationBar, ChatBubble, ContextPane, ConvictionGauge, HoldingRow, NewTradeButton, PositionsTable, TradeEntryModal, TradeRowActions, TriggerPill, VoiceButton, etc.). Old `/components/library`, `/components/develop`, `/components/portfolio` trees fully deleted.
- **Cycles (C):** Now sub-tab — 5 stacked gauges (3 live from `cycle_overrides` for market/credit/juglar; rate + sentiment em-dashed pending schema extension), PlannedSections for Synthesis / Convergence map / Historical parallels. History sub-tab — single PlannedSection (no recharts, no chart shell). New `CycleGaugeBare` + `CycleOverrideForm` in `components/shared/`. `/components/cycles/*` (10 files) deleted. `lib/supabase/cycles-queries.ts` stripped to v2 surface. `@deprecated v1 token aliases` block removed from `lib/tokens.ts` — final v1 vestige retired.

### What's still queued

- **Phase 2 Sonnet→Opus migration** — own future turn, do not bundle. See entry above.
- **Develop polish (Turn 3.x)** — 7-item backlog from real pipeline use: iterate UX re-anchoring, prompt prefill chips, attachments, table rendering, reopen-library-thesis, signals/triggers, conversation rename+delete (last item a Turn 3.1 candidate).
- **Structured-content legibility (Turn 3.x)** — positions table + disagreement matrix re-delineation.
- **Portfolio polish (Turn 4.x)** — share-count column on holdings; current-price-persists-after-trade-delete quirk.
- **Cycles data layer (FRED + History)** — extend `cycle_overrides` (or new table) for numeric readings + key-metric fields covering all 5 v2 cycles; wire History sub-tab to real percentile data (charting library choice deferred until data is in hand). Pre-existing Turn 5 chart bugs (Buffett z reconciliation, HY history depth, upsertSeries pagination) carry into this turn.
- **Pipeline prompt overhaul** — separate track per existing build sequence (step 5 above).

### Process lessons

- **Silent-skip pattern (caught after Turn B).** Turn B skipped a SETUP.md update without surfacing; user discovered post-ship. Mitigation since: plans now mark verification steps as "do not defer" explicitly, and manual-approval mode used on Turn C surfaces in-flight gaps before they reach commit.
- **Decision-vs-implementation gap (caught DURING Turn C).** User stated "Phase 2 is Opus" as if implemented; production code still runs Sonnet. Repo-wide grep mid-execution surfaced the gap before the doc edit reached commit; full in-flight rollback executed. Project memory captured. Pattern lesson: a verbal architectural decision isn't real until the code change ships — verify code, not memory of the conversation.
- **Manual approval mode value demonstrated.** Invoked on Turn C explicitly because of Turn B's silent skip. Friction cost on a turn this size was bounded; in return it enabled the Sonnet catch above. Worth keeping for high-stakes turns where doc edits cross with live code paths.

---

## Turn D — triggers (2026-06-01)

### What shipped

- **Triggers schema (item 7).** v1 `triggers` table dropped and recreated in the Wedgetail-ready shape: `type` (confirming / disconfirming / kill-on-sight), `description`, `monitoring_signal`, `threshold` (both nullable for qualitative entries), `status` (armed / fired / disarmed). Migration `0006_triggers.sql` self-contained — DROP cascades the v1 policy from `db/policies.sql` and the migration recreates RLS. `db/schema.sql` triggers block also updated to the v2 shape for from-scratch installs.
- **Watch fully wired.** All five filter tabs working (`all` / `portfolio` / `armed` / `fired` / `kill`), real counts per row, derived kill-armed count (type='kill-on-sight' AND status='armed'), real top-of-page fired tally, row expansion via `<WatchRow>` showing per-thesis `TriggerDetailRow` list. Thesis-name link stops propagation so it navigates without collapsing.
- **Library detail triggers editor.** `PlannedSection` placeholder replaced with a real `Section`: list of `TriggerDetailRow`s with edit/delete affordances, "Add trigger" button opening `TriggerEntryModal` (modal pattern matches `TradeEntryModal`).

### File-count delta

- Plan said 7 new files; shipped **8**. `AddTriggerButton.tsx` was added mid-build to match the `NewTradeButton.tsx` precedent (button-that-opens-modal as its own thin client wrapper). Flagged before writing; no scope drift.
- One incidental cleanup: removed dead `TriggerType` + `triggerTypeColor` exports from `lib/tokens.ts` (Turn A speculation, never consumed). Necessary to avoid a name collision with the new domain `TriggerType` in `lib/types.ts`.

### What's still em-dashed on Watch

- **Conviction delta** and **directional gamma** remain em-dashed. Both depend on item 9 (conviction history) which is its own future turn — explicitly out of Turn D scope.

### Out of scope, untouched

- Live trigger firing / cron evaluation. Manual entry only.
- `'action'` trigger type from the mockup — Wedgetail-side concern.
- Phase 2 Sonnet→Opus migration. Develop polish. A/B/C surfaces beyond the direct trigger wiring.

---

## 19. Fable 5 gate — Phase 4 prompt re-verification (2026-06-12)

**Status:** ✅ Ruled PASS (2026-06-13) — 9/9 ratified. Fragment 12 route variance
accepted by operator ruling (see per-run notes).
**Scope:** Harness verification only. No live-file edits, no promotion, no tuning.

Model swaps void prompt verification the same way prompt edits do. Before any
claude-fable-5 migration ($10/$50 per MTok), the promoted Phase 4 prompt was
re-run on Fable against the three boundary poles.

**Tested pair.** `prompts/eval-fable-phase-4.md` × `claude-fable-5`. Scratch =
live `PHASE_4_SYSTEM_PROMPT` minus the "— Opus 4.8" self-label (single edit,
diff-verified; named outside the `phase-*` matrix allow-list deliberately).
The label-free text must not land in lib/ ahead of the Fable migration, or
production becomes an unverified (text, opus-4.7) pair.

**Gate design.** N=3 per fragment; pass requires 3/3 verdict consistency per
fragment, any flip = miss. Verdict content is the criterion — prose-vs-JSON
format drift logged but not a miss (item-18 precedent). stop_reason
max_tokens/length or API 400 = infra-fail → rerun, not a miss. On any verdict
miss: same scratch on opus N=3 against the missed fragment(s) to de-confound
the label edit from the model swap (did not fire). Operator rules; harness
reports verbatim.

**Per-run results** (all stop_reason=end_turn; total $0.589):

| Fragment | Expected | Runs | Output files (outputs/, gitignored) |
|---|---|---|---|
| 11 uranium | PROCEED | PROCEED ×3 | 20260612133552 / 133611 / 133626 -fable-eval-fable-phase-4-phase-4-input.md |
| 12 mall-REITs | STRESS_TEST | STRESS_TEST ×3 | 20260612133706 / 133733 / 133759 -… |
| 13 Veridian | DISCARD | DISCARD ×3 | 20260612133822 / 133831 / 133841 -… |

No D4.6 attractor signature on 11 (all three runs invoked the shifts/narrows
carve-in). 12 held both halves of the ruled reading (broken premise →
re-express) in all three runs; recovery was routed via evidence-marshalling /
NOI restructuring rather than the sidecar's A-mall-scarcity expression —
**route variance accepted by operator ruling** (2026-06-13). The thesis
excluded the scarcity angle and run 1 correctly surfaced that exclusion;
whether adjudication should surface author-excluded adjacent expressions is a
prompt-encoding question for the tuning backlog (logged as D4.7), not this
gate. 13 named both DISCARD legs in all three runs.

**Format drift is stochastic, not input-deterministic.** Identical inputs
produced both prose and JSON across runs (uranium: prose, prose, JSON;
Veridian: JSON, prose, JSON) — 3 prose / 5 fenced JSON / 1 bare JSON overall.
Input hygiene therefore cannot eliminate drift, and the item-18 route-level
parse-guards remain a hard prerequisite for any Fable migration.

**Snapshot check.** GET /v1/models serves exactly one Fable ID:
`claude-fable-5` (created 2026-06-07). No dated snapshot exists — nothing to
pin; a model revision would arrive under the same alias.

**A pass does NOT cover (migration-turn obligations):**
1. generateObject/Zod request shape in app/api/adjudicate/route.ts, incl.
   withoutTemperature-wrapper behavior for a Fable model object; item-18
   parse-guards must ship first.
2. Regression fragments 7–10 on Fable.
3. The challenge path (buildChallengeContext) — never harness-tested on any model.
4. **Unpinned-alias policy.** /v1/models serves no dated Fable snapshot, so a
   model revision would arrive under the same string and silently re-void this
   verification. The migration turn must define detection/handling — e.g. a
   boundary-trio canary rerun, triggered by a created-timestamp change on the
   alias or run before any consequential pipeline change.

**Footnote — stale harness pricing.** `pricing.ts` carries opus at 15/75 vs
Opus 4.7's actual 5/25; step-5 cost figures overstated Opus spend ~3×. Fable
row added at the correct 10/50. Opus row left as-is this turn.

**Code commit:** 174cccd (model arm + stop_reason capture + harness tsconfig +
scratch prompt).

---

## 20. Item-18 parse-guards — shipped (2026-06-22)

**Status:** ✅ Shipped. Code commit 151017b. Verified in production (see below).
**Scope:** Route-level reliability only. No prompt edits, no model swaps, no
migration work, harness untouched.

Implements item 18. `lib/ai/parse-guard.ts` wraps `generateObject` with a free
local JSON-extraction repair followed by one paid retry carrying a schema
appendix; on exhaustion the caller gets a `ParseGuardError` and nothing is
stored (route returns 502, Bellbird-voice body). One shared helper, three thin
call sites.

**Verified in production.** The 2026-06-21 live UI run (conversation
1707bde0…, thesis neutron-re-rate-2026, now in the Library) exercised the guard
on the first real pipeline:

| Phase | guard |
|---|---|
| 2 structure (opus) | `{attempts:2, repaired:false, finishReasons:["tool-calls","tool-calls"]}` |
| 3 stress-test (grok) | `{attempts:1, repaired:false, finishReasons:["tool-calls"]}` |
| 4 adjudicate (opus) | `{attempts:1, repaired:false, finishReasons:["tool-calls"]}` |

Phase 2 returned `attempts:2`: the first structuring call produced tool
arguments that failed the Zod schema, and the **paid retry recovered it** — the
thesis still landed. `finishReasons:["tool-calls","tool-calls"]` (not `length`)
confirms this was genuine schema drift, not truncation. `repaired:false`
confirms local extraction repair declined, exactly as predicted under forced
tool-call mode. This is the design thesis "the paid retry is the guard" holding
in production rather than asserted, and item 18's drift mode caught on the first
live run.

**Three-route coverage — recorded delta from item 18's wording.** Item 18 names
two routes (stress-test, adjudicate) — the routes where drift had been
*observed*. Item 19 established drift is stochastic per-call, making exposure a
property of the `generateObject` mechanism rather than observed history, so
coverage is symmetric across all three structured-output routes including
Phase 2. `app/api/structure/route.ts` pins `opus` = `claude-opus-4-7`
(route.ts:2,39 via lib/ai/anthropic.ts OPUS_MODEL_ID). Item 18 not amended.
(The Turn-B follow-up line "Phase 2 currently runs Sonnet" is **stale** —
structure has pinned opus since Turn D; superseded here, not edited.)

**Forced-tool-mode finding.** All three routes call `generateObject` (ai@4.3.19)
in forced tool-call mode for both providers (anthropic
`defaultObjectGenerationMode='tool'`; grok-4 absent from the xai
`supportsStructuredOutputs` allow-list). The harness (clients.ts) hits the raw
messages API with no tool forcing, so harness drift presents as prose; live
drift presents as schema-nonconforming or truncated tool *arguments*. The
harness drift shape is therefore not the live drift shape — confirmed by the
production run, where the drift was a failed tool-args parse, not prose.

**Local repair role — expected live hit-rate ≈ 0.** Under tool mode: truncated
args have no balanced JSON span → extraction returns null → repair declines;
valid-JSON-of-wrong-shape is byte-identical to its own extraction → declines by
design; tool-not-called never reaches the hook. The production `repaired:false`
on the drift event is consistent. Local repair's real consumers are the unit
fixtures and the migration turn's raw-text request shape. The paid retry is the
guard.

**finishReason taxonomy carried over from item 19.** Every `[parse-guard]` log
event and the persisted `guard.finishReasons` carry finishReason, so a
truncation (`length`) is never miscounted as drift (`tool-calls`). The
production rows show `tool-calls`, correctly classified as drift.

**Latency.** maxDuration raised 60→120 on the three routes — **120 accepted on
Pro (cap 800s fluid, well above 120); no fallback needed.** Envelope: measured
single-call worsts grok-4 12.8s, opus 11.0s,
fable 26.9s (×2 ≈ 54s before SDK-internal API-error retries and Supabase
writes); Phase 2 never timed independently (largest schema). The SDK's own
`maxRetries` (default 2) multiplies worst-case HTTP calls per parse attempt —
the ≤2× bound is per parse-retry, not per HTTP call.

**Residual untested surfaces (carried forward).**
1. **OPEN — repair hook fires on the live tool path.** Established by
   dist-reading only (ai/dist/index.js:3046→3067→3103), never executed. The
   2026-06-21 run confirmed the *retry* path, not hook invocation:
   `repaired:false` does not distinguish fired-and-declined from never-fired.
   Still open.
2. Appendix efficacy on a real provider retry — unknown; the production retry
   recovered but with N=1 and no A/B against a plain re-roll.
3. SDK-internal `maxRetries` API-error retry multiplying worst-case HTTP calls.
4. grok-4 honoring forced function choice on the retry path.

**Fixtures.** Nine real Fable Phase-4 gate outputs (item 19 per-run table)
committed under scripts/prompt-harness/fixtures/format-drift/ — 3 prose / 5
fenced / 1 bare — bodies byte-faithful (no in-band headers), provenance in
sidecar manifest.json (file → source timestamp, class, expected). Unit test
lib/ai/parse-guard.test.ts (16 cases, node:assert via tsx) drives extraction
off the manifest plus retry-orchestration and exhaustion via an injected fake.

**Code commit:** 151017b (helper + test + three routes + fixtures + npm script).

---

## 21. Model-config centralisation — wire model ids (2026-06-23)

**Status:** ✅ Shipped. Code commit 239ae35. Behaviour-preserving refactor —
no model swap, no gate triggered.
**Scope:** Wire model-id strings only. No route changes, no prompt edits, no
DB-label changes, harness untouched.

Collapses the three production wire model-id strings into one registry,
`lib/ai/models.ts` (`MODEL_IDS = { opus: 'claude-opus-4-7', sonnet:
'claude-sonnet-4-6', grok: 'grok-4' }`, pure data, zero imports).
`lib/ai/anthropic.ts` and `lib/ai/xai.ts` now source `OPUS_MODEL_ID` /
`SONNET_MODEL_ID` / `GROK_MODEL_ID` from it; the literals previously lived
inline in those two files. Five files touched: the two new files
(`models.ts`, `models.test.ts`), `anthropic.ts`, `xai.ts`, `package.json`
(`test:models` script). Zero route or prompt bytes changed.

**Behaviour-preservation — provable by construction, not asserted.** Only the
*source* of three literals moved (inline literal → `MODEL_IDS.x`). No route or
prompt byte changed, so every emitted `messages.model` value and every prompt
sent on the wire is byte-identical to before. `lib/ai/models.test.ts`
(9 cases, node:assert via tsx, mirrors the parse-guard test idiom) closes the
that-the-id-still-resolves question at both layers: the `MODEL_IDS` constants
are byte-equal to the historical literals `claude-opus-4-7` /
`claude-sonnet-4-6` / `grok-4`, and the **built `opus`/`sonnet`/`grok` wrapper
instances carry those exact ids on `.modelId`** — i.e. routing the registry
through `withoutTemperature()` and the providers did not change the model that
resolves on the wire. The instance assertions are load-bearing; the
constant-only check is near-tautological.

**Verification.**

| Check | Result |
|---|---|
| `npm run test:models` | 9/9 pass (incl. 3 instance-resolution assertions) |
| `npm run typecheck` (`tsc --noEmit`) | clean |
| `npm run build` | succeeded, all 15 routes / 4 API routes |
| `npm run dev` | Ready in 2.2s, no errors (:3007; :3002 was occupied, untouched) |
| `git status` | routes / prompts / harness absent → untouched |

**Catalogue — every model-id reader, with disposition.**
- *Wire-id literals (changed source, same value):* `anthropic.ts:9-10`,
  `xai.ts:7` → now `MODEL_IDS`.
- *DB-label writers (untouched):* `chat/route.ts:156`, `structure:53`,
  `stress-test:77`, `adjudicate:100` — emit `'opus-4.7'` / `'grok-4'` verbatim.
- *DB-label consumers (untouched):* `pricing.ts:5-7` (`MODEL_PRICING` keys,
  `ModelKey = keyof …`), `develop-queries.ts:84-91` (init keys + the
  `row.model … model in totals` read-back join).
- *Third reader — `parse-guard.ts:115`:* `params.model.modelId` feeds the
  `[parse-guard]` console telemetry label (none of the three routes pass
  `modelLabel`, so the wire id is logged). Console-only, **not persisted**,
  derives from the unchanged `.modelId` → behaviour-neutral. Catalogued here
  for completeness; no action.

**Two namespaces kept physically separate.** The DB telemetry label
(`'opus-4.7'`, persisted in `messages.model`) is a different keyspace from the
wire id (`'claude-opus-4-7'`), owned by `pricing.ts` / `develop-queries.ts`.
It was deliberately left out of `models.ts`: it is not part of the wire 4.7/4.8
drift, so centralising it would reduce no drift while arming a footgun — a
future lockstep dbLabel bump without adding the matching pricing/queries key
would silently break cost attribution (`estimateCostUsd` indexing `undefined`;
the `model in totals` join dropping the row). Provider-ids-only also keeps
behaviour-preservation true by construction (routes untouched) and removes any
route-emit mis-index risk.

**`PHASE_MODELS` deliberately deferred.** A phase→model map has no runtime
consumer while the routes are untouched; by the same "no present consumer ⇒
don't pre-build" rule that excluded a `provider` field, the phase→model
indirection (and its `PhaseModel` interface / `satisfies Record` typing) defers
to the Level-3 UI-selector turn, where a settings page reads model-by-phase.

**Harness map left independent — by design, not drift.**
`scripts/prompt-harness/clients.ts` keeps its own `MODEL_IDS` (incl. `sonnet`,
`fable`). No route imports from `scripts/`; `tsconfig.json:22` excludes
`scripts/**` from typecheck/build entirely. The independence is required for
the next-turn boundary gate: a candidate model must run on the harness while
production still runs the incumbent, so the two maps must be able to diverge.

**Phase-4 "Opus 4.8" prose left untouched — path-independent reason.** Leaving
the `phase-4-adjudication.ts:5` self-label is a **zero-byte change to the
Phase-4 system prompt**, so Phase-4 output is identical to the already-live
behaviour — behaviour-neutral by definition. This is the sole load-bearing
reason. It is explicitly *not* justified by "a future Opus 4.8 bump makes the
label true": item 19 (561-565) documents that the Fable-migration path's
verified scratch was label-*free*, so the two forward paths disagree on the
label's eventual fate. Editing the prose in either direction would be a
Phase-4 prompt change that voids verification — out of scope this turn.

**Code commit:** 239ae35 (registry + test + anthropic/xai repoint + npm script).
