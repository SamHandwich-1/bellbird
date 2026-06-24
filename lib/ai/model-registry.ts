// lib/ai/model-registry.ts — per-model capability descriptors + the phase→model
// selection seed. Pure data, zero imports (importable from app and standalone
// scripts alike, same discipline as ./models).
//
// Level-3 model-selector substrate (slice 1). The descriptor carries what a bare
// wire-id string cannot: the request-shape class (whether `temperature` is
// stripped — Anthropic 4.x models reject it, Grok takes it), the provider, the
// persisted dbLabel, and the pricing key. wireId and dbLabel are SEPARATE fields
// by design — item 21 keeps the two keyspaces untied; this record co-locates
// them, it does not unify their values.
//
// PHASE_MODELS is the seed AND the last-known-good fallback (item 21 deferred
// this map; this is its first runtime consumer). When the DB config source lands
// (slice 2) it OVERRIDES this map per request, validated against MODEL_REGISTRY
// and the read-time gate; on any DB failure the resolver degrades back to it. It
// is not replaced.

export type Provider = 'anthropic' | 'xai';

// The withoutTemperature class. Anthropic 4.x models (opus/sonnet/fable)
// deprecated `temperature` and reject requests carrying it; Grok takes it.
export type RequestShape = 'strip-temperature' | 'pass-temperature';

// Versioned keys (= dbLabel value), because the feature's job is selecting
// between model VERSIONS per phase. sonnet-4.6 is intentionally absent: no phase
// references it (MODEL_IDS still carries it for the built `sonnet` export).
export type ModelKey = 'opus-4.8' | 'grok-4';

export type Phase = 1 | 2 | 3 | 4;

export interface ModelDescriptor {
  provider: Provider;
  wireId: string;
  dbLabel: string;
  pricingKey: string;
  requestShape: RequestShape;
}

export const MODEL_REGISTRY: Record<ModelKey, ModelDescriptor> = {
  'opus-4.8': {
    provider: 'anthropic',
    wireId: 'claude-opus-4-8',
    dbLabel: 'opus-4.8',
    pricingKey: 'opus-4.8',
    requestShape: 'strip-temperature',
  },
  'grok-4': {
    provider: 'xai',
    wireId: 'grok-4',
    dbLabel: 'grok-4',
    pricingKey: 'grok-4',
    requestShape: 'pass-temperature',
  },
};

// Today's exact pinning: phases 1/2/4 on Opus 4.8, phase 3 on Grok.
export const PHASE_MODELS: Record<Phase, ModelKey> = {
  1: 'opus-4.8',
  2: 'opus-4.8',
  3: 'grok-4',
  4: 'opus-4.8',
};
