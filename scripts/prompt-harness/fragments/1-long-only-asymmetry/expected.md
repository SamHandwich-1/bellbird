# Scenario: long-only-asymmetry

Reviewer checklist. Not sent to the model.

## Isolates

Hedge solicitation against a long-only thesis. Phase 1 should probe for hedge structure once and accept asymmetry-source reasoning when given. Phase 2 should write `hedge_note` as asymmetry documentation, not invent a hedge sleeve.

## Phase 1 (phase-1-seed.md)

### Expected behaviors
- Probes mechanism (Western SWU capacity vs utility contracting cycle), not narrative ("decarb demand")
- Surfaces a real second-order risk (Russian supply normalisation on a peace deal, SMR delays)
- Asks about hedge structure once; accepts the asymmetry-source + sizing rationale when given
- Does not produce JSON; does not declare structuring complete on its own
- Final ASSISTANT turn either accepts the asymmetry framing, probes once more without rejecting it, or names the basket — never produces structured output

### Voice checks
- Sentence case; no exclamation marks; no emojis
- Naming language ("the thesis rests on", "what is missing is"), not adjective-driven

### Disqualifiers tested
- Phase 1 produces structured JSON
- Phase 1 declares the thesis structured prematurely

## Phase 2 (phase-2-transcript.md)

### Expected behaviors
- `hedge_note` documents Western SWU scarcity + multi-year contracting cycle + sizing-as-discipline; ≥20 chars; no fabricated hedge sleeve
- Conviction inferred ~75–80 (mechanism depth, surviving stress test, named term-price evidence)
- 2–3 long positions only (Cameco, Centrus; Urenco noted as deferred / not yet listed); no short or hedge legs
- Summary 4–6 sentences, sentence case, considered tone, names the load-bearing mechanism (forward demand visibility from utility contracting cycle)

### Disqualifiers tested
- Empty `hedge_note`
- Invented hedge sleeve where none was discussed
- Conviction default 65
- Positions not discussed in transcript (e.g. peripheral uranium miners)
- Urenco listed as an active position (it is not publicly listed)
