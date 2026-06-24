// Run: npm run test:models  (tsx, no test framework).
// Relative imports only — this file lives under the root tsconfig include
// ("**/*.ts") so `npm run typecheck` covers it, but it must not depend on the
// Next `@/` alias, which tsx does not resolve.
//
// Behaviour-preservation guard for the model-config centralisation (item #1).
// Two layers:
//   1. MODEL_IDS holds the wire strings byte-equal to the historical literals.
//   2. The built opus/sonnet/grok wrapper instances still carry those exact ids
//      on .modelId — i.e. routing the registry through withoutTemperature() and
//      the providers did not change the model that resolves on the wire.
// Importing the wrappers instantiates the SDK providers at import time; that
// makes no API call and needs no key to read .modelId.
import assert from 'node:assert/strict';
import { MODEL_IDS } from './models';
import { opus, sonnet, OPUS_MODEL_ID, SONNET_MODEL_ID } from './anthropic';
import { grok, GROK_MODEL_ID } from './xai';

// The historical wire literals, hard-coded here so the test fails loudly if the
// registry drifts. A model swap (e.g. the #2 Opus 4.8 bump) intentionally edits
// these expectations — that edit IS the documented record of the swap.
const HISTORICAL = {
  opus: 'claude-opus-4-8',
  sonnet: 'claude-sonnet-4-6',
  grok: 'grok-4',
} as const;

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
  console.log('models tests\n');

  // 1. Registry constants are byte-equal to the historical wire literals.
  await test('MODEL_IDS.opus === claude-opus-4-8', () => {
    assert.equal(MODEL_IDS.opus, HISTORICAL.opus);
  });
  await test('MODEL_IDS.sonnet === claude-sonnet-4-6', () => {
    assert.equal(MODEL_IDS.sonnet, HISTORICAL.sonnet);
  });
  await test('MODEL_IDS.grok === grok-4', () => {
    assert.equal(MODEL_IDS.grok, HISTORICAL.grok);
  });

  // 2. Re-exported id constants still resolve from the registry.
  await test('OPUS_MODEL_ID tracks MODEL_IDS.opus', () => {
    assert.equal(OPUS_MODEL_ID, HISTORICAL.opus);
  });
  await test('SONNET_MODEL_ID tracks MODEL_IDS.sonnet', () => {
    assert.equal(SONNET_MODEL_ID, HISTORICAL.sonnet);
  });
  await test('GROK_MODEL_ID tracks MODEL_IDS.grok', () => {
    assert.equal(GROK_MODEL_ID, HISTORICAL.grok);
  });

  // 3. The built wrapper instances carry the unchanged id on .modelId — proves
  //    the model that resolves on the wire is byte-identical post-refactor.
  await test('opus instance .modelId === claude-opus-4-8', () => {
    assert.equal(opus.modelId, HISTORICAL.opus);
  });
  await test('sonnet instance .modelId === claude-sonnet-4-6', () => {
    assert.equal(sonnet.modelId, HISTORICAL.sonnet);
  });
  await test('grok instance .modelId === grok-4', () => {
    assert.equal(grok.modelId, HISTORICAL.grok);
  });

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) process.exit(1);
})();
