// Per-million-token pricing for cost estimation. Update as model rates change.
// All values in USD. Rates approximate as of 2026-05.

export const MODEL_PRICING = {
  'opus-4.7': { input: 15.0, output: 75.0 },
  'sonnet-4.6': { input: 3.0, output: 15.0 },
  'grok-4': { input: 5.0, output: 15.0 },
} as const;

export type ModelKey = keyof typeof MODEL_PRICING;

export type TokenUsage = {
  input_tokens: number;
  output_tokens: number;
};

export function estimateCostUsd(model: ModelKey, usage: TokenUsage): number {
  const rate = MODEL_PRICING[model];
  return (usage.input_tokens * rate.input + usage.output_tokens * rate.output) / 1_000_000;
}

export function formatUsd(value: number): string {
  if (value < 0.01) return `~$${value.toFixed(4)}`;
  if (value < 1) return `~$${value.toFixed(3)}`;
  return `~$${value.toFixed(2)}`;
}

export function totalTokens(usage: TokenUsage): number {
  return usage.input_tokens + usage.output_tokens;
}
