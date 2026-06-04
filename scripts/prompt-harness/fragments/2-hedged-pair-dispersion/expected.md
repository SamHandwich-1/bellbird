# Scenario: hedged-pair-dispersion

Reviewer checklist. Not sent to the model.

## Isolates

A pair-trade thesis with an explicit hedge mechanism. Phase 1 should probe the mechanism (procurement mix shift), name the inversions (acquisition risk, budget reversion), and articulate the hedge structure. Phase 2 should write `hedge_note` as the actual hedge — not a sizing afterthought — and produce a basket with both long and short sleeves.

## Phase 1 (phase-1-seed.md)

### Expected behaviors
- Probes the mechanism (DoD budget allocation shift, prime margin compression under fixed-price), not the narrative (geopolitics)
- Surfaces inversions explicitly (acquisition risk, budget reversion to platforms)
- Names the hedge structure when introducing it (short LMT to isolate the budget-allocation shift from defense beta)
- Final turn engages with the proposed weights — does not produce JSON

### Voice checks
- Sentence case throughout
- Naming patterns ("the mechanism that matters", "the inversion", "the hedge structure")

### Disqualifiers tested
- Phase 1 produces structured JSON
- Phase 1 accepts geopolitical narrative as sufficient mechanism

## Phase 2 (phase-2-transcript.md)

### Expected behaviors
- `hedge_note` names the LMT short and what it isolates (budget-allocation shift from defense beta); ≥20 chars
- Conviction inferred ~70–75 (mechanism evidence is strong but the inversion risks were real and conceded)
- Positions: 3 long (MRCY, KTOS, LDOS) + 1 short (LMT); weights as discussed (12 / 10 / 5 long, 12 short); gross ~39
- Side field correctly populated: `long` for the long sleeve, `short` or `hedge` for LMT (whichever the schema treats as the hedge expression)
- Summary names the procurement-mix-shift mechanism and the prime-margin-compression read

### Disqualifiers tested
- `hedge_note` describing sizing instead of the actual hedge
- Positions assigned wrong side
- Invented positions (Northrop, RTX, General Dynamics) not discussed in transcript
- Weights distributed evenly rather than reading James's stated allocation
