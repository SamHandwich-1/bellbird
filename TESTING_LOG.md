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
- Agreed sequence (from May):
  1. Best-practices brief and test fragments
  2. Phase 2 JSON contract (Sonnet structured output)
  3. Phase 1 variants (Opus development conversation) — fold in items 6 (data fetching + price guardrail), 7 (triggers solicitation), 8 (conversational re-entry / ingestion)
  4. Phase 3 variants (Grok stress-test, Munger inversion)
  5. Phase 4 and challenge prompt (Opus adjudication, Klarman downside-first verdict, + item 9 conviction-change capture)
  6. Harness comparison runs across variants
  7. Finals to Claude Code

**Why now and not earlier:**
- The original argument for parking ("finish the spine first") is satisfied — Turn 5 shipped clean.
- The original argument for parking ("the pipeline works, not broken just not optimised") is still true, so this remains a quality improvement, not a fix.
- The v2 rebuild and the prompt overhaul are *independent* — the rebuild changes UI surfaces; prompts are string content behind those surfaces. Doing prompts after the rebuild means tuning them in the surface they'll actually live in.

**Why after the v2 rebuild specifically:**
- Items 6, 7, 8, 9 have UI dependencies — the prompts solicit behaviour that surfaces in the chat UI, triggers UI, ingestion UI. Cleaner to redesign prompts against a settled UI than against a moving target.
- Prompt work is open-ended in a way the rebuild isn't. Easier to bound risk by doing the rebuild first (predictable scope) and the prompt work second (open-ended but isolated).

**Build slot:** After v2 rebuild Turn C, before any other backlog work. Treated as its own dedicated track — small approve-and-execute mini-steps rather than one big block.

---

These were flagged in May's Turn 5 verification but never fixed. They affect already-built code that will be touched during the v2 rebuild (Turn C especially). Documented here so they're not lost.

**Buffett z gauge/grid contradiction.** The cycles page Buffett gauge cites `buffett_z` from `cycle_readings.contributing_series` (+2.57), while the grid cell shows `z_score_30y` from the latest `macro_indicators` row (-1.74). Two different computations of the same concept producing opposite signs. Reconcile to a single source of truth. *Important to fix before the v2 Cycles · History page ships, since Buffett indicator is a first-class series in the new design.*

**HY Credit Spreads only ~3y of history.** BAMLH0A0HYM2 returned 794 daily rows from FRED on backfill — that's ~3 years, not the intended 30. Z-score is implicitly computed against the 3-year window. Verify FRED history depth for that series; adjust the fetch if needed. *Affects the IG-HY spread series on the v2 percentile chart.*

**Latent pagination bug in `lib/fred/refresh-job.ts`.** The `upsertSeries` existing-rows query has no `.limit()`. Same family as the cycles-queries pagination bug fixed in Turn 5. Add `.limit(10000)` when next touching the file.

**Trade delete quirk in Portfolio.** Current price for a ticker survives when the last trade for that ticker is deleted. Should clear.

**Share count column missing on Portfolio holdings rows.** Display omission.

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

5. **Pipeline prompt overhaul** (item 17, consolidating items 6, 7, 8, 9). Use the existing harness to fine-tune all four phase prompts and bake in the new behaviours: live data fetching with price guardrail, triggers solicitation, conversational re-entry / ingestion, conviction-change capture. Open-ended scope but isolated — runs against the now-settled v2 UI. Sequence: best-practices brief → Phase 2 JSON contract → Phase 1 variants → Phase 3 variants → Phase 4 + challenge → comparison → finals.

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
