# Scenario: multi-name-basket

Reviewer checklist. Not sent to the model.

## Isolates

A thesis that names 6–8 instruments with implicit emphasis but no explicit weights. Phase 2 must read emphasis from the conversation and infer weights.

## Phase 1 (phase-1-seed.md)

### Expected behaviors
- Engages each major name discussed; does not collapse the discussion into the top 1–2 picks prematurely
- Probes which names actually carry the thesis vs which are diversification
- Asks about HLS (the dismissed name) once and accepts the dismissal — does not relitigate
- Final ASSISTANT turn reads the emphasis back correctly (CSL largest, second tier together, smaller names smaller)

### Voice checks
- Sentence case throughout
- "Read the emphasis right" — naming language

### Disqualifiers tested
- Phase 1 collapses the basket into the top names early and stops developing the lower-tier names
- Phase 1 includes HLS in the basket framing after James dismissed it
- Phase 1 produces JSON

## Phase 2 (phase-2-transcript.md)

### Expected behaviors
- Basket has 7 positions: CSL, COH, RMD, SHL, RHC, ANN, PME; HLS excluded
- Weights cluster on emphasis:
  - CSL the largest single weight (~20–25)
  - COH / RMD / SHL similar mid-weights (~10–12 each)
  - RHC and ANN smaller (~5–7 each)
  - PME small flier (~3–5)
- Notes per position reflect the discussed mechanism (plasma yield for CSL, implantable software for COH / RMD, lab automation for SHL, hospital throughput for RHC, PPE volume for ANN, radiology AI for PME)
- `hedge_note` documents the basket-construction-as-asymmetry-source (cohort diversification within a single re-rating thesis) OR documents that no hedge is used because the basket itself diversifies idiosyncratic name risk; no invented hedge sleeve
- Conviction inferred ~70–75 — basket-trade conviction is rarely as high as a single-name conviction
- Summary names the "tech-driven margin re-rating across the Australian healthcare cohort" framing

### Disqualifiers tested
- HLS appears in the basket
- Weights distributed evenly without reading emphasis
- Positions invented (e.g. ResMed-adjacent names, foreign comparables, foreign-listed peers) not discussed
- Basket padded with names beyond the 7 discussed
- Weights inverted (smaller names heavier than CSL)
- Invented hedge sleeve (e.g. short XHJ.AX or some healthcare-sector ETF) not discussed
