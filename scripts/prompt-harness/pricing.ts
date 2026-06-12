import type { Model } from './clients';

// Per-million-token USD rates. Update as rates change.
// Kept local (not imported from lib/) so the harness has zero coupling to product code.
export const PRICING: Record<Model, { input: number; output: number }> = {
  opus: { input: 15.0, output: 75.0 },
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
