import { writeFileSync, mkdirSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import type { Model, CallResult } from './clients';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function timestamp(): string {
  const d = new Date();
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`
  );
}

function safeBase(path: string): string {
  return basename(path, extname(path)).replace(/[^a-zA-Z0-9-]/g, '_');
}

export type Format = 'md' | 'json';

export type OutputRecord = {
  promptFile: string;
  fragmentFile: string;
  model: Model;
  promptText: string;
  fragmentText: string;
  result: CallResult;
  costUsd: number;
  format: Format;
  outDir: string;
};

export function writeOutput(rec: OutputRecord): string {
  mkdirSync(rec.outDir, { recursive: true });
  const ts = timestamp();
  const name = `${ts}-${rec.model}-${safeBase(rec.promptFile)}-${safeBase(rec.fragmentFile)}.${rec.format}`;
  const path = join(rec.outDir, name);
  const iso = new Date().toISOString();

  if (rec.format === 'json') {
    const payload = {
      timestamp: iso,
      model: rec.model,
      prompt_file: rec.promptFile,
      fragment_file: rec.fragmentFile,
      input_tokens: rec.result.input_tokens,
      output_tokens: rec.result.output_tokens,
      cost_usd: Number(rec.costUsd.toFixed(6)),
      latency_ms: rec.result.latency_ms,
      stop_reason: rec.result.stop_reason,
      system_prompt: rec.promptText,
      user_input: rec.fragmentText,
      model_response: rec.result.text,
    };
    writeFileSync(path, JSON.stringify(payload, null, 2));
  } else {
    const md = [
      '---',
      `timestamp: ${iso}`,
      `model: ${rec.model}`,
      `prompt_file: ${rec.promptFile}`,
      `fragment_file: ${rec.fragmentFile}`,
      `input_tokens: ${rec.result.input_tokens}`,
      `output_tokens: ${rec.result.output_tokens}`,
      `cost_usd: ${rec.costUsd.toFixed(6)}`,
      `latency_ms: ${rec.result.latency_ms}`,
      `stop_reason: ${rec.result.stop_reason ?? 'null'}`,
      '---',
      '',
      '## System prompt',
      '',
      rec.promptText.trim(),
      '',
      '## User input',
      '',
      rec.fragmentText.trim(),
      '',
      '## Model response',
      '',
      rec.result.text.trim(),
      '',
    ].join('\n');
    writeFileSync(path, md);
  }
  return path;
}

export type ErrorOutputRecord = {
  promptFile: string;
  fragmentFile: string;
  model: Model;
  promptText: string;
  fragmentText: string;
  outDir: string;
  error: string;
};

export function writeErrorOutput(rec: ErrorOutputRecord): string {
  mkdirSync(rec.outDir, { recursive: true });
  const ts = timestamp();
  const name = `${ts}-${rec.model}-${safeBase(rec.promptFile)}-${safeBase(rec.fragmentFile)}-ERROR.md`;
  const path = join(rec.outDir, name);
  const iso = new Date().toISOString();
  const md = [
    '---',
    `timestamp: ${iso}`,
    `model: ${rec.model}`,
    `prompt_file: ${rec.promptFile}`,
    `fragment_file: ${rec.fragmentFile}`,
    'status: error',
    '---',
    '',
    '## Error',
    '',
    rec.error,
    '',
    '## System prompt',
    '',
    rec.promptText.trim(),
    '',
    '## User input',
    '',
    rec.fragmentText.trim(),
    '',
  ].join('\n');
  writeFileSync(path, md);
  return path;
}
