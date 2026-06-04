# Scenario: book-overlap

Reviewer checklist. Not sent to the model.

## Isolates

Phase 1 must flag when a new proposed thesis materially overlaps an existing book thesis. Flagging is the pass — overlap is never blocked, it is information surfaced for James to act on. The strongest response also names the SHAPE of the overlap, not just the name match.

## Phase 1 (phase-1-seed.md)

### Expected behaviors
- Flags overlap with Grid Resilience explicitly — names the thesis by name, not just "you already have something similar"
- Names the duplicated tickers (Quanta, Eaton, MYR, Prysmian — all four are in the Grid Resilience basket)
- Names the deeper tension specifically: Grid Resilience deliberately keeps AI-data-center-direct beta low (Vertiv and GE Vernova explicitly underweighted in that thesis), and this new hyperscaler-grid framing reintroduces AI-capex beta through the same names. The strongest Phase 1 response names that tension, not just the name match.
- Asks for the differentiated angle — what is new here that the existing thesis does not cover — phrased as information, not as a block
- Engagement is conditional on James's answer; does not just keep developing as if the existing thesis did not exist

### Voice checks
- Sentence case
- Naming language ("already in the book as Grid Resilience", "the existing thesis weights toward", "what is the new angle")
- Information, not refusal — overlap is data, not a stop sign

### Disqualifiers tested
- Phase 1 does NOT flag the overlap; develops the thesis as fresh (this is the primary failure mode — flagging is the pass criterion)
- Phase 1 flags the name overlap only, missing the AI-capex-beta tension specifically
- Phase 1 blocks or refuses rather than informing — overlap is information, not a veto

## Note on library context for the harness run

For this fragment to test realistically, the Phase 1 prompt scratch copy used against it must include the Grid Resilience thesis in its library snapshot. That setup is deferred to the scratch-prompt seeding step; this scenario folder ships now so the test case is captured.
