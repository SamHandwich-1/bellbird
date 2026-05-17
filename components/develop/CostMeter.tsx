'use client';

import { tokens } from '@/lib/tokens';
import {
  estimateCostUsd,
  formatUsd,
  totalTokens,
  type ModelKey,
  type TokenUsage,
} from '@/lib/ai/pricing';

export type UsageBreakdown = Record<ModelKey, TokenUsage>;

export function CostMeter({ usage }: { usage: UsageBreakdown }) {
  let tokens_total = 0;
  let cost_total = 0;
  for (const [model, u] of Object.entries(usage) as Array<[ModelKey, TokenUsage]>) {
    tokens_total += totalTokens(u);
    cost_total += estimateCostUsd(model, u);
  }

  return (
    <div
      className="font-sans text-[10px] tracking-[0.16em] uppercase"
      style={{ color: tokens.fade }}
    >
      <span className="font-mono">{tokens_total.toLocaleString()}</span> tokens ·{' '}
      <span className="font-mono">{formatUsd(cost_total)}</span>
    </div>
  );
}
