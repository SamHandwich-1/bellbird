# Scenario: conviction-not-named

Reviewer checklist. Not sent to the model.

## Isolates

A Phase 1 conversation that develops real depth without James ever stating a conviction number. Phase 2 must infer conviction from the tenor of the discussion — not default to 65.

## Phase 1 (phase-1-seed.md)

### Expected behaviors
- Probes mechanism (regulatory shift on capital return + NIM normalisation), not narrative
- Surfaces real political / FX risk (Korean political cycle, KRW vs USD)
- Does NOT solicit a conviction number — the absence of a number is deliberate, to set up the Phase 2 inference test
- Engages with the basket-expression question (KB vs Shinhan, weight split) without forcing a conviction

### Voice checks
- Sentence case; no exclamation marks
- Naming language ("the key read is", "the structural driver", "the inversion")

### Disqualifiers tested
- Phase 1 solicits a conviction number from James (contaminates the Phase 2 inference test)

## Phase 2 (phase-2-transcript.md)

### Expected behaviors
- Conviction inferred from depth of mechanism + named regulatory framework + surviving stress tests — reasonable target ~72–80
- Explicitly NOT 65 (mechanical default)
- Explicitly NOT a low-conviction "feels speculative" read
- `hedge_note` documents why no FX hedge — long-only because FX hedge is a separate bet on USD strength, not protection of the equity thesis
- 2 long positions (KB Financial, Shinhan); no short or hedge legs
- Weights as discussed (KB 12, Shinhan 8) or thereabouts
- Summary names Value-up regulatory framework + NIM regime shift as the load-bearing mechanism

### Disqualifiers tested
- Conviction default 65
- Empty `hedge_note`
- Invented FX hedge sleeve (e.g. KRW short)
- Equal weighting of KB and Shinhan when transcript favoured KB
- Positions inverted (Shinhan heavier than KB)
