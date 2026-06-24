import type { Model } from './clients';

// Per-million-token USD rates. Update as rates change.
// Kept local (not imported from lib/) so the harness has zero coupling to product code.
//
// `opus` corrected 15/75 -> 5/25 (item-19 footnote: the 15/75 row overstated Opus
// 4.7 spend ~3x). This is the labelled harness-rate fix landed alongside the item-#2
// gate so A.4 cost figures are honest. Production lib/ai/pricing.ts is untouched.
//
// `opus48` (Opus 4.8 candidate) at the confirmed 5/25 standard rate — same as Opus
// 4.7, not fast mode (operator-confirmed at the Phase B gate). This is the rate the
// A.4 gate actually ran under, so the gate's 4.8 cost figures stand as reported.
export const PRICING: Record<Model, { input: number; output: number }> = {
  opus: { input: 5.0, output: 25.0 },
  opus48: { input: 5.0, output: 25.0 }, // confirmed 5/25 standard (= Opus 4.7, not fast mode)
  sonnet: { input: 3.0, output: 15.0 },
  grok: { input: 5.0, output: 15.0 },
  fable: { input: 10.0, output: 50.0 },
};

export function costUsd(
  model: Model,
  inputTokens: number,
  outputTokens: number,
): number {
  const rate = PRICING[model];
  return (inputTokens * rate.input + outputTokens * rate.output) / 1_000_000;
}
