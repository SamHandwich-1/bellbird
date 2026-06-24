// Run: npm run test:resolve  (tsx, no test framework).
// Relative imports only — this file is under the root tsconfig include but must
// not use the Next `@/` alias, which tsx does not resolve.
//
// Slice-1 behaviour-preservation guard for the per-phase model resolver. The
// resolver must hand each phase the SAME wire instance and the SAME dbLabel the
// routes hard-coded before the refactor — selection changed source, never value.
// Three layers:
//   1. Per phase (1..4): resolved .model identity (=== opus/grok), the wire id on
//      .modelId, and the dbLabel string.
//   2. Structural locks: registry wireId === instance .modelId; every descriptor
//      pricingKey exists in MODEL_PRICING; PHASE_MODELS covers {1,2,3,4}.
// Importing the wrappers instantiates the SDK providers at import time; that
// makes no API call and needs no key to read .modelId.
import assert from 'node:assert/strict';
import type { LanguageModelV1 } from '@ai-sdk/provider';
import { resolveForPhase } from './resolve';
import { MODEL_REGISTRY, PHASE_MODELS, type ModelKey, type Phase } from './model-registry';
import { MODEL_PRICING } from './pricing';
import { opus } from './anthropic';
import { grok } from './xai';

// The pre-refactor truth, hard-coded so the test fails loudly on any drift. A
// deliberate phase re-pin (slice 2+) edits these expectations — that edit IS the
// documented record of the swap, exactly as models.test.ts treats wire ids.
const EXPECT: Record<Phase, { instance: LanguageModelV1; modelId: string; dbLabel: string }> = {
  1: { instance: opus, modelId: 'claude-opus-4-8', dbLabel: 'opus-4.8' },
  2: { instance: opus, modelId: 'claude-opus-4-8', dbLabel: 'opus-4.8' },
  3: { instance: grok, modelId: 'grok-4', dbLabel: 'grok-4' },
  4: { instance: opus, modelId: 'claude-opus-4-8', dbLabel: 'opus-4.8' },
};

// Registry key -> the exact built instance it must resolve to.
const INSTANCE_BY_KEY: Record<ModelKey, LanguageModelV1> = {
  'opus-4.8': opus,
  'grok-4': grok,
};

let passed = 0;
const failures: string[] = [];
function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed++;
      console.log(`  ok  ${name}`);
    })
    .catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      failures.push(`${name}: ${msg}`);
      console.log(`FAIL  ${name}\n      ${msg}`);
    });
}

(async () => {
  console.log('resolve tests\n');

  // 1. Per-phase resolution: instance identity, wire id, and dbLabel.
  for (const phase of [1, 2, 3, 4] as const) {
    const exp = EXPECT[phase];
    await test(`phase ${phase} .model === ${exp.modelId === 'grok-4' ? 'grok' : 'opus'} instance`, () => {
      assert.equal(resolveForPhase(phase).model, exp.instance);
    });
    await test(`phase ${phase} .model.modelId === ${exp.modelId}`, () => {
      assert.equal(resolveForPhase(phase).model.modelId, exp.modelId);
    });
    await test(`phase ${phase} dbLabel === ${exp.dbLabel}`, () => {
      assert.equal(resolveForPhase(phase).dbLabel, exp.dbLabel);
    });
  }

  // 2a. Registry <-> instance lock: descriptor wireId is the real wire id.
  for (const key of Object.keys(MODEL_REGISTRY) as ModelKey[]) {
    await test(`registry[${key}].wireId === ${key} instance .modelId`, () => {
      assert.equal(MODEL_REGISTRY[key].wireId, INSTANCE_BY_KEY[key].modelId);
    });
  }

  // 2b. pricingKey lock: every descriptor pricingKey is a real MODEL_PRICING key.
  for (const key of Object.keys(MODEL_REGISTRY) as ModelKey[]) {
    await test(`registry[${key}].pricingKey in MODEL_PRICING`, () => {
      assert.ok(MODEL_REGISTRY[key].pricingKey in MODEL_PRICING);
    });
  }

  // 2c. PHASE_MODELS totality: phases {1,2,3,4} all present and each maps to a
  //     real registry key.
  await test('PHASE_MODELS covers exactly phases {1,2,3,4}', () => {
    const phases = Object.keys(PHASE_MODELS).map(Number).sort((a, b) => a - b);
    assert.deepEqual(phases, [1, 2, 3, 4]);
  });
  await test('every PHASE_MODELS value is a real registry key', () => {
    for (const key of Object.values(PHASE_MODELS)) {
      assert.ok(key in MODEL_REGISTRY, `${key} missing from MODEL_REGISTRY`);
    }
  });

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) process.exit(1);
})();
