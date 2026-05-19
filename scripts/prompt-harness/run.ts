import { parseArgs } from 'node:util';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { callModel, MODELS, type Model } from './clients';
import { costUsd } from './pricing';
import { writeOutput, writeErrorOutput, type Format } from './output';

const DEFAULT_OUT_DIR = 'scripts/prompt-harness/outputs';
const DEFAULT_TEMPERATURE = 0.4;
const DEFAULT_MAX_TOKENS = 4096;

function usage(): never {
  console.error(
    [
      'Usage:',
      '',
      '  Single shot:',
      '    npm run prompt-harness -- \\',
      '      --prompt <file> --fragment <file> --model <opus|sonnet|grok>',
      '',
      '  Matrix:',
      '    npm run prompt-harness -- \\',
      '      --prompt-dir <dir> --fragment-dir <dir> --model <opus|sonnet|grok>',
      '',
      '  Flags:',
      `    --out-dir <dir>          default: ${DEFAULT_OUT_DIR}`,
      `    --max-tokens <N>         default: ${DEFAULT_MAX_TOKENS}`,
      `    --temperature <0..1>     default: ${DEFAULT_TEMPERATURE}`,
      '    --json                   emit JSON instead of markdown',
      '    --dry-run                print combinations, do not call the API',
      '    --help                   show this message',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

function listInputFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (!statSync(full).isFile()) continue;
    const ext = extname(name).toLowerCase();
    if (ext === '.md' || ext === '.txt') out.push(full);
  }
  return out.sort();
}

function isModel(s: string): s is Model {
  return (MODELS as readonly string[]).includes(s);
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      prompt: { type: 'string' },
      fragment: { type: 'string' },
      'prompt-dir': { type: 'string' },
      'fragment-dir': { type: 'string' },
      model: { type: 'string' },
      'out-dir': { type: 'string' },
      'max-tokens': { type: 'string' },
      temperature: { type: 'string' },
      json: { type: 'boolean' },
      'dry-run': { type: 'boolean' },
      help: { type: 'boolean' },
    },
    allowPositionals: false,
  });

  if (values.help) usage();

  const modelArg = values.model;
  if (!modelArg || !isModel(modelArg)) {
    console.error(
      `Missing or invalid --model. Must be one of: ${MODELS.join(', ')}.`,
    );
    process.exit(1);
  }
  const model: Model = modelArg;

  const outDir = resolve(values['out-dir'] ?? DEFAULT_OUT_DIR);
  const maxTokens = Number(values['max-tokens'] ?? DEFAULT_MAX_TOKENS);
  const temperature = Number(values.temperature ?? DEFAULT_TEMPERATURE);
  if (!Number.isFinite(maxTokens) || maxTokens <= 0) {
    console.error(`Invalid --max-tokens: ${values['max-tokens']}`);
    process.exit(1);
  }
  if (!Number.isFinite(temperature) || temperature < 0 || temperature > 2) {
    console.error(`Invalid --temperature: ${values.temperature} (expected 0..2)`);
    process.exit(1);
  }
  const format: Format = values.json ? 'json' : 'md';
  const dryRun = Boolean(values['dry-run']);

  let prompts: string[] = [];
  let fragments: string[] = [];

  if (values['prompt-dir'] && values['fragment-dir']) {
    prompts = listInputFiles(resolve(values['prompt-dir']));
    fragments = listInputFiles(resolve(values['fragment-dir']));
    if (prompts.length === 0 || fragments.length === 0) {
      console.error(
        `No .md/.txt files found in --prompt-dir (${values['prompt-dir']}) or --fragment-dir (${values['fragment-dir']}).`,
      );
      process.exit(1);
    }
  } else if (values.prompt && values.fragment) {
    prompts = [resolve(values.prompt)];
    fragments = [resolve(values.fragment)];
  } else {
    console.error(
      'Specify either --prompt + --fragment or --prompt-dir + --fragment-dir.\n',
    );
    usage();
  }

  const combos: Array<{ prompt: string; fragment: string }> = [];
  for (const p of prompts) for (const f of fragments) combos.push({ prompt: p, fragment: f });

  console.log(
    `Planned: ${combos.length} call(s) against "${model}" (temp ${temperature}, max-tokens ${maxTokens}, format ${format}).`,
  );
  for (const c of combos) console.log(`  · ${c.prompt}  ×  ${c.fragment}`);
  if (dryRun) {
    console.log('Dry run — no API calls fired.');
    return;
  }

  let totalCost = 0;
  let totalIn = 0;
  let totalOut = 0;
  let failures = 0;

  for (const c of combos) {
    const promptText = readFileSync(c.prompt, 'utf8');
    const fragmentText = readFileSync(c.fragment, 'utf8');
    process.stdout.write(
      `→ ${model}  ${c.prompt}  ×  ${c.fragment} ... `,
    );
    try {
      const result = await callModel(model, promptText, fragmentText, {
        temperature,
        maxTokens,
      });
      const cost = costUsd(model, result.input_tokens, result.output_tokens);
      const path = writeOutput({
        promptFile: c.prompt,
        fragmentFile: c.fragment,
        model,
        promptText,
        fragmentText,
        result,
        costUsd: cost,
        format,
        outDir,
      });
      totalCost += cost;
      totalIn += result.input_tokens;
      totalOut += result.output_tokens;
      console.log(
        `ok (${result.input_tokens}+${result.output_tokens} tokens, $${cost.toFixed(4)}, ${result.latency_ms}ms) → ${path}`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      failures += 1;
      const path = writeErrorOutput({
        promptFile: c.prompt,
        fragmentFile: c.fragment,
        model,
        promptText,
        fragmentText,
        outDir,
        error: msg,
      });
      console.log(`FAILED — ${msg} → ${path}`);
    }
  }

  console.log('');
  console.log(
    `Done. ${combos.length - failures}/${combos.length} ok. ` +
      `${totalIn}+${totalOut} tokens, ~$${totalCost.toFixed(4)} total.`,
  );
  if (failures > 0) process.exitCode = 2;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
