import { z } from 'zod';

export const cycleStageEnum = z.enum([
  'secular',
  'long-cycle',
  'mid-cycle',
  'credit-cycle',
  'narrative-cycle',
]);

export const positionSideEnum = z.enum(['long', 'short', 'hedge']);

// Phase 2 — Opus structures the developed thesis into a library-shaped record.
export const structuredThesisSchema = z.object({
  name: z.string().min(1).describe('Short editorial name, e.g. "Grid Resilience"'),
  sector: z.string().min(1).describe('Sector or cross-sector tag, e.g. "Industrials × Utilities"'),
  conviction: z.number().int().min(0).max(100).describe('0-100, sage if ≥70, amber 40-69, terracotta <40'),
  timing: z.string().min(1).describe('Horizon, e.g. "18-24 months" or "3-5 years"'),
  cycle_stage: cycleStageEnum,
  summary: z.string().min(40).describe('Editorial summary, 3-6 sentences. Considered, quietly confident, sentence case.'),
  hedge_note: z.string().min(20).describe('Hedge note for hedged theses; for long-only theses, document the source of the asymmetry (natural asymmetry, structural protection, sizing rationale). Never empty.'),
  positions: z
    .array(
      z.object({
        ticker: z.string().min(1),
        name: z.string().min(1),
        weight: z.number().min(0).max(200).describe('Percent weight within thesis; gross may exceed 100 if hedged'),
        side: positionSideEnum,
        valuation: z.string().nullable(),
        upside: z.number().nullable().describe('Percent upside or downside vs current; null if not estimated'),
        notes: z.string().describe('One-line rationale'),
      }),
    )
    .min(1)
    .describe('Position basket. Total long weight typically ≈100% with hedge sleeve on top.'),
});

export type StructuredThesis = z.infer<typeof structuredThesisSchema>;

// Phase 3 — Grok contrarian review.
export const stressTestSchema = z.object({
  contrarian_argument: z
    .string()
    .min(80)
    .describe('Strongest single contrarian thesis. 3-5 sentences. Targets the load-bearing mechanism, not surface details.'),
  disagreement_matrix: z
    .array(
      z.object({
        claim: z.string().describe('Specific claim from the developed thesis'),
        claude_view: z.string().describe('How the thesis treats the claim — Strong / Moderate / Weak / etc.'),
        grok_view: z.string().describe('Adversarial assessment — Strong / Weakening / Mixed / Weak / etc.'),
        severity: z.enum(['low', 'medium', 'high']).optional(),
      }),
    )
    .min(3)
    .max(8),
});

export type StressTestOutput = z.infer<typeof stressTestSchema>;

// Phase 4 — Opus adjudicates.
export const verdictEnum = z.enum(['PROCEED', 'STRESS_TEST', 'CLARIFY', 'DISCARD']);

export const adjudicationSchema = z.object({
  verdict: verdictEnum,
  reasoning: z
    .string()
    .min(80)
    .describe('Explicit reasoning. 3-6 sentences. Names the specific evidence that drove the verdict.'),
});

export type AdjudicationOutput = z.infer<typeof adjudicationSchema>;
