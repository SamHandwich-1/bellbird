// Run: npm run test:parse-guard  (tsx, no test framework).
// Relative imports only — this file lives under the root tsconfig include
// ("**/*.ts") so `npm run typecheck` covers it, but it must not depend on the
// Next `@/` alias, which tsx does not resolve.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NoObjectGeneratedError } from 'ai';
import type { LanguageModelV1 } from '@ai-sdk/provider';
import type { z } from 'zod';
import {
  extractJsonCandidate,
  generateObjectGuarded,
  ParseGuardError,
  type GuardGenerate,
} from './parse-guard';
import { adjudicationSchema, type AdjudicationOutput } from './schemas';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(here, '..', '..', 'scripts', 'prompt-harness', 'fixtures', 'format-drift');

type ManifestEntry = { file: string; source: string; class: string; expect: 'null' | 'parses' };

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

// ---------------------------------------------------------------------------
// 1. Extraction over the nine real drift fixtures, driven by manifest.json.
// ---------------------------------------------------------------------------
const manifest = JSON.parse(
  readFileSync(join(fixturesDir, 'manifest.json'), 'utf8'),
) as ManifestEntry[];

async function extractionSuite(): Promise<void> {
  assert.equal(manifest.length, 9, 'manifest should list nine fixtures');
  const counts = { prose: 0, fenced: 0, bare: 0 };
  for (const entry of manifest) {
    counts[entry.class as keyof typeof counts]++;
    const body = readFileSync(join(fixturesDir, entry.file), 'utf8');
    await test(`extract ${entry.file} (${entry.class} → ${entry.expect})`, () => {
      const candidate = extractJsonCandidate(body);
      if (entry.expect === 'null') {
        assert.equal(candidate, null, 'prose should yield no JSON candidate');
        return;
      }
      assert.notEqual(candidate, null, 'should extract a JSON candidate');
      const parsed = adjudicationSchema.safeParse(JSON.parse(candidate as string));
      assert.ok(parsed.success, `extracted JSON should satisfy adjudicationSchema (${entry.file})`);
    });
  }
  await test('fixture class split is 3 prose / 5 fenced / 1 bare (item-19 table)', () => {
    assert.deepEqual(counts, { prose: 3, fenced: 5, bare: 1 });
  });
}

// ---------------------------------------------------------------------------
// 2 & 3. Retry orchestration via an injected fake — no API calls.
// ---------------------------------------------------------------------------
type FailKind = 'fail-parse' | 'fail-validate' | 'fail-tool';
type Step = FailKind | 'succeed' | 'throw-other';

const VALID: AdjudicationOutput = {
  verdict: 'PROCEED',
  reasoning:
    'The thesis rests on a load-bearing mechanism that the contrarian argument narrows without breaking, which is grounds for proceeding.',
};
const FAIL_USAGE = { promptTokens: 100, completionTokens: 0, totalTokens: 100 };
const OK_USAGE = { promptTokens: 120, completionTokens: 80, totalTokens: 200 };
const STUB_RESPONSE = { id: 'test', timestamp: new Date(0), modelId: 'test-model' };

function makeError(kind: FailKind): NoObjectGeneratedError {
  if (kind === 'fail-tool') {
    return new NoObjectGeneratedError({
      message: 'No object generated: the tool was not called.',
      response: STUB_RESPONSE,
      usage: FAIL_USAGE,
      finishReason: 'stop',
    });
  }
  if (kind === 'fail-parse') {
    const cause = Object.assign(new Error('Unexpected end of JSON input'), {
      name: 'AI_JSONParseError',
    });
    return new NoObjectGeneratedError({
      message: 'No object generated: could not parse the response.',
      cause,
      text: '{"verdict":"PROCEED","reasoning":"the thesis rests on',
      response: STUB_RESPONSE,
      usage: FAIL_USAGE,
      finishReason: 'length', // truncation — must surface as finishReason, not drift
    });
  }
  const cause = Object.assign(new Error('type validation failed'), {
    name: 'AI_TypeValidationError',
    cause: { issues: [{ path: ['reasoning'], message: 'String must contain at least 80 character(s)' }] },
  });
  return new NoObjectGeneratedError({
    message: 'No object generated: response did not match schema.',
    cause,
    text: '{"verdict":"PROCEED","reasoning":"x"}',
    response: STUB_RESPONSE,
    usage: FAIL_USAGE,
    finishReason: 'stop',
  });
}

const STUB_MODEL = { modelId: 'test-model' } as unknown as LanguageModelV1;

function makeFake(script: Step[]) {
  const systems: string[] = [];
  let calls = 0;
  const generate = (async <T>(args: {
    model: LanguageModelV1;
    system: string;
    prompt: string;
    schema: z.ZodType<T>;
    experimental_repairText?: (o: { text: string; error: unknown }) => Promise<string | null>;
  }): Promise<{ object: T; usage: typeof OK_USAGE; finishReason: string | null }> => {
    systems.push(args.system);
    const step = script[calls++];
    if (step === 'succeed') {
      return { object: VALID as unknown as T, usage: OK_USAGE, finishReason: 'stop' };
    }
    if (step === 'throw-other') throw new Error('network exploded');
    throw makeError(step);
  }) as GuardGenerate;
  return { generate, systems, callCount: () => calls };
}

async function orchestrationSuite(): Promise<void> {
  for (const kind of ['fail-parse', 'fail-validate', 'fail-tool'] as FailKind[]) {
    await test(`retry: attempt-1 ${kind} → attempt-2 succeeds`, async () => {
      const fake = makeFake([kind, 'succeed']);
      const r = await generateObjectGuarded(
        { model: STUB_MODEL, system: 'BASE', prompt: 'P', schema: adjudicationSchema, phase: 4 },
        { generate: fake.generate },
      );
      assert.equal(fake.callCount(), 2, 'exactly one retry');
      assert.equal(r.guard.attempts, 2);
      assert.deepEqual(r.object, VALID);
      // usage aggregated across the failed attempt and the successful one
      assert.deepEqual(r.usage, { promptTokens: 220, completionTokens: 80, totalTokens: 300 });
      // finishReason captured per attempt (truncation visible, never dropped)
      assert.equal(r.guard.finishReasons.length, 2);
      if (kind === 'fail-parse') assert.ok(r.guard.finishReasons.includes('length'));
      // retried system carries the schema appendix
      assert.equal(fake.systems.length, 2);
      assert.ok(fake.systems[0] === 'BASE', 'first attempt uses the base system prompt verbatim');
      assert.ok(
        fake.systems[1].includes('did not conform to the required output schema'),
        'retry appendix present',
      );
      assert.ok(fake.systems[1].includes('verdict'), 'retry appendix carries the JSON schema');
      if (kind === 'fail-validate') {
        assert.ok(fake.systems[1].includes('reasoning'), 'retry appendix names the failing path');
      }
    });
  }

  await test('exhaustion: both attempts fail → ParseGuardError, nothing returned', async () => {
    const fake = makeFake(['fail-validate', 'fail-validate']);
    await assert.rejects(
      () =>
        generateObjectGuarded(
          { model: STUB_MODEL, system: 'BASE', prompt: 'P', schema: adjudicationSchema, phase: 3 },
          { generate: fake.generate },
        ),
      (e: unknown) => {
        assert.ok(e instanceof ParseGuardError, 'throws ParseGuardError');
        assert.equal(e.code, 'SCHEMA_PARSE_FAILED');
        assert.equal(e.attempts, 2);
        assert.equal(e.phase, 3);
        return true;
      },
    );
    assert.equal(fake.callCount(), 2, 'exactly two attempts, no third');
  });

  await test('non-schema errors propagate unchanged and are NOT retried', async () => {
    const fake = makeFake(['throw-other', 'succeed']);
    await assert.rejects(
      () =>
        generateObjectGuarded(
          { model: STUB_MODEL, system: 'BASE', prompt: 'P', schema: adjudicationSchema, phase: 2 },
          { generate: fake.generate },
        ),
      (e: unknown) => e instanceof Error && !(e instanceof ParseGuardError) && e.message === 'network exploded',
    );
    assert.equal(fake.callCount(), 1, 'no retry on a non-NoObjectGeneratedError');
  });

  await test('happy path: attempt-1 succeeds → attempts === 1, no appendix', async () => {
    const fake = makeFake(['succeed']);
    const r = await generateObjectGuarded(
      { model: STUB_MODEL, system: 'BASE', prompt: 'P', schema: adjudicationSchema, phase: 4 },
      { generate: fake.generate },
    );
    assert.equal(fake.callCount(), 1);
    assert.equal(r.guard.attempts, 1);
    assert.equal(r.guard.repaired, false);
    assert.deepEqual(r.usage, OK_USAGE);
  });
}

// ---------------------------------------------------------------------------
(async () => {
  console.log('parse-guard tests\n');
  await extractionSuite();
  await orchestrationSuite();
  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) process.exit(1);
})();
