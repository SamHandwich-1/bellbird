// lib/ai/models.ts — single source of truth for wire model-id strings.
// Pure data, zero imports (importable from the app and a standalone script alike).
//
// NOTE: the DB telemetry label (messages.model, e.g. 'opus-4.7') is a SEPARATE
// persisted keyspace owned by pricing.ts / develop-queries.ts — it is
// deliberately NOT here and must never be unified with these wire ids.
//
// The prompt-harness keeps its own independent model map by design
// (scripts/prompt-harness/clients.ts) so a candidate model can diverge from
// production during a migration gate.
export const MODEL_IDS = {
  opus: 'claude-opus-4-8',
  sonnet: 'claude-sonnet-4-6',
  grok: 'grok-4',
} as const;
