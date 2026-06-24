// lib/ai/resolve.ts — request-time model resolution for the pipeline phases.
// Slice 1 of the Level-3 selector: a phase -> { model, dbLabel } lookup over the
// existing built instances. Selection is per-request; the instances themselves
// are still the module-level singletons from ./anthropic + ./xai, so this slice
// is behaviour-preserving by construction — the resolved instance IS today's
// `opus`/`grok`, byte-identical wire behaviour and request-shape.
//
// SYNC by design in slice 1 (no DB read). Slice 2 makes this async: the DB
// becomes the authoritative source, validated against MODEL_REGISTRY plus the
// read-time GATE_PASSES check, degrading to PHASE_MODELS on any failure.
import type { LanguageModelV1 } from '@ai-sdk/provider';
import { opus } from './anthropic';
import { grok } from './xai';
import { MODEL_REGISTRY, PHASE_MODELS, type ModelKey, type Phase } from './model-registry';

// Binds each registry key to today's exact built instance. `opus` is the
// withoutTemperature-wrapped Anthropic instance; `grok` is the raw xai instance.
// Instance identity here is the request-shape guarantee — resolve.test locks
// resolveForPhase(1|2|4).model === opus and (3).model === grok.
const INSTANCES: Record<ModelKey, LanguageModelV1> = {
  'opus-4.8': opus,
  'grok-4': grok,
};

export function resolveForPhase(phase: Phase): {
  model: LanguageModelV1;
  dbLabel: string;
} {
  const key = PHASE_MODELS[phase];
  return { model: INSTANCES[key], dbLabel: MODEL_REGISTRY[key].dbLabel };
}
