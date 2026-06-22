import { generateObject, NoObjectGeneratedError, zodSchema } from 'ai';
import type { LanguageModelV1 } from '@ai-sdk/provider';
import type { z } from 'zod';

// Route-level schema parse-guard (TESTING_LOG item 18). Format drift on thin
// inputs is stochastic model behaviour (item 19) — input hygiene cannot
// eliminate it, so the guard lives at the route. Two-stage: free local repair
// (extract fenced/bare JSON from the failing text) before one paid retry with
// a schema appendix. Retry budget is fixed at 1. On exhaustion the caller gets
// a ParseGuardError and nothing is stored.
//
// Live request shape today is forced tool-call mode (generateObject in ai@4
// picks `tool` for both Anthropic and grok-4), so the model's text arrives as
// tool arguments — JSON, or truncated JSON, never prose with fences. Under that
// shape local repair almost never fires (truncated args extract to null; valid
// JSON of the wrong shape is byte-identical to its own extraction and declines).
// The paid retry is the guard. Local repair earns its keep against the unit
// fixtures and against the migration turn's raw-text request shape, where prose
// and fenced/bare JSON are the live drift modes (the nine Fable gate samples).

type Usage = { promptTokens: number; completionTokens: number; totalTokens: number };

export type GuardMeta = {
  attempts: number;
  repaired: boolean;
  finishReasons: (string | null)[];
};

export class ParseGuardError extends Error {
  readonly code = 'SCHEMA_PARSE_FAILED' as const;
  readonly phase: number;
  readonly attempts: number;
  constructor(phase: number, attempts: number, cause?: unknown) {
    super(
      `Phase ${phase} structured output did not match schema after ${attempts} attempts.`,
    );
    this.name = 'ParseGuardError';
    this.phase = phase;
    this.attempts = attempts;
    this.cause = cause;
  }
}

// Pure: pull the first plausible JSON value out of a text blob. Fenced block
// first (```json … ``` or bare ``` … ```), then the first balanced {…}/[…]
// substring. No prose-pattern rescue — that is fragile, and the paid retry is
// the answer for the no-JSON case. Truncated JSON has no balanced span and
// returns null on purpose.
export function extractJsonCandidate(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const fence = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)```/i);
  if (fence && fence[1].trim()) return fence[1].trim();

  return firstBalanced(trimmed);
}

function firstBalanced(s: string): string | null {
  const start = s.search(/[{[]/);
  if (start === -1) return null;
  const open = s[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inStr = false;
  let escaped = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null; // unbalanced (e.g. truncated) — no candidate
}

type RepairTextFn = (options: { text: string; error: unknown }) => Promise<string | null>;

// The injectable seam. Defaults to the real `generateObject`; tests pass a fake
// to exercise retry orchestration without API calls. Kept to the surface the
// guard actually consumes.
export type GuardGenerate = <T>(args: {
  model: LanguageModelV1;
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  experimental_repairText?: RepairTextFn;
}) => Promise<{ object: T; usage: Usage; finishReason: string | null }>;

const defaultGenerate: GuardGenerate = (args) => generateObject(args);

export type GuardedParams<T> = {
  model: LanguageModelV1;
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  phase: number;
  /** Telemetry label; defaults to model.modelId. */
  modelLabel?: string;
};

export async function generateObjectGuarded<T>(
  params: GuardedParams<T>,
  opts: { generate?: GuardGenerate } = {},
): Promise<{ object: T; usage: Usage; guard: GuardMeta }> {
  const generate = opts.generate ?? defaultGenerate;
  const model = params.modelLabel ?? params.model.modelId;
  const { phase } = params;

  const usage: Usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  const finishReasons: (string | null)[] = [];
  let repaired = false;
  let repairUsed = false;
  let firstIssues: string[] = [];

  const repair: RepairTextFn = async ({ text }) => {
    const candidate = extractJsonCandidate(text);
    if (candidate === null || candidate === text.trim()) return null;
    repairUsed = true;
    return candidate;
  };

  // Attempt 1.
  try {
    const r = await generate({
      model: params.model,
      system: params.system,
      prompt: params.prompt,
      schema: params.schema,
      experimental_repairText: repair,
    });
    addUsage(usage, r.usage);
    finishReasons.push(r.finishReason);
    repaired = repaired || repairUsed;
    if (repaired) {
      log({ phase, model, event: 'repaired', finishReason: r.finishReason });
    }
    return { object: r.object, usage, guard: { attempts: 1, repaired, finishReasons } };
  } catch (err) {
    if (!NoObjectGeneratedError.isInstance(err)) throw err;
    addUsage(usage, err.usage as Usage | undefined);
    finishReasons.push(toFinish(err.finishReason));
    repaired = repaired || repairUsed;
    log({
      phase,
      model,
      event: 'parse_failed',
      finishReason: toFinish(err.finishReason),
      causeKind: causeKind(err),
      issues: extractIssues(err),
    });
    firstIssues = extractIssues(err);
  }

  // Attempt 2 — one paid retry with a schema appendix. finishReason is logged
  // on every event so a truncation (max_tokens/length) is never miscounted as
  // drift (item 19 taxonomy).
  log({ phase, model, event: 'retry' });
  const retrySystem = params.system + buildAppendix(params.schema, firstIssues);
  try {
    const r = await generate({
      model: params.model,
      system: retrySystem,
      prompt: params.prompt,
      schema: params.schema,
      experimental_repairText: repair,
    });
    addUsage(usage, r.usage);
    finishReasons.push(r.finishReason);
    repaired = repaired || repairUsed;
    log({ phase, model, event: 'retry_succeeded', finishReason: r.finishReason });
    return { object: r.object, usage, guard: { attempts: 2, repaired, finishReasons } };
  } catch (err) {
    if (!NoObjectGeneratedError.isInstance(err)) throw err;
    addUsage(usage, err.usage as Usage | undefined);
    finishReasons.push(toFinish(err.finishReason));
    log({
      phase,
      model,
      event: 'exhausted',
      finishReason: toFinish(err.finishReason),
      causeKind: causeKind(err),
      issues: extractIssues(err),
    });
    throw new ParseGuardError(phase, 2, err);
  }
}

function buildAppendix<T>(schema: z.ZodType<T>, issues: string[]): string {
  const json = JSON.stringify(zodSchema(schema).jsonSchema);
  const lines = [
    '',
    '',
    '---',
    'Your previous response did not conform to the required output schema and could not be used.',
    `Respond again with a single JSON object that exactly matches this JSON Schema:`,
    json,
  ];
  if (issues.length) {
    lines.push(`The previous response failed validation at: ${issues.join(', ')}.`);
  }
  lines.push('Return only the JSON object — no prose, no commentary, no code fences.');
  return lines.join('\n');
}

function addUsage(acc: Usage, u: Usage | undefined): void {
  if (!u) return;
  acc.promptTokens += u.promptTokens ?? 0;
  acc.completionTokens += u.completionTokens ?? 0;
  acc.totalTokens += u.totalTokens ?? 0;
}

function toFinish(reason: unknown): string | null {
  return typeof reason === 'string' ? reason : null;
}

// 'JSONParseError' (truncation/bad JSON), 'TypeValidationError' (wrong shape),
// 'tool-not-called' (no tool block at all), or 'unknown'.
function causeKind(err: NoObjectGeneratedError): string {
  const cause = err.cause as { name?: string } | undefined;
  if (cause?.name) return cause.name;
  if (err.text === undefined) return 'tool-not-called';
  return 'unknown';
}

// Best-effort dig for zod issue paths to name in the retry appendix. Tolerant
// of shape changes across SDK/zod versions — returns [] when it can't find them.
function extractIssues(err: NoObjectGeneratedError): string[] {
  try {
    const seen = new Set<unknown>();
    let node: unknown = err.cause;
    for (let i = 0; i < 5 && node && !seen.has(node); i++) {
      seen.add(node);
      const issues = (node as { issues?: unknown }).issues;
      if (Array.isArray(issues)) {
        return issues
          .map((iss) => {
            const path = (iss as { path?: unknown[] }).path;
            return Array.isArray(path) && path.length ? path.join('.') : '(root)';
          })
          .slice(0, 8);
      }
      node = (node as { cause?: unknown }).cause;
    }
  } catch {
    // fall through
  }
  return [];
}

type GuardEvent = 'parse_failed' | 'repaired' | 'retry' | 'retry_succeeded' | 'exhausted';

function log(rec: {
  phase: number;
  model: string;
  event: GuardEvent;
  finishReason?: string | null;
  causeKind?: string;
  issues?: string[];
}): void {
  console.log(`[parse-guard] ${JSON.stringify(rec)}`);
}
