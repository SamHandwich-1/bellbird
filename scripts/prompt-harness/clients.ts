import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export type Model = 'opus' | 'sonnet' | 'grok' | 'fable';
export const MODELS: readonly Model[] = ['opus', 'sonnet', 'grok', 'fable'] as const;

export const MODEL_IDS: Record<Model, string> = {
  opus: 'claude-opus-4-7',
  sonnet: 'claude-sonnet-4-6',
  grok: 'grok-4',
  fable: 'claude-fable-5',
};

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v || !v.trim()) {
    throw new Error(
      `Missing env var ${key}. Run with --env-file=.env.local or via the "prompt-harness" npm script.`,
    );
  }
  return v;
}

let anthropicSingleton: Anthropic | null = null;
function anthropicClient(): Anthropic {
  if (!anthropicSingleton) {
    anthropicSingleton = new Anthropic({ apiKey: requireEnv('ANTHROPIC_API_KEY') });
  }
  return anthropicSingleton;
}

let xaiSingleton: OpenAI | null = null;
function xaiClient(): OpenAI {
  if (!xaiSingleton) {
    xaiSingleton = new OpenAI({
      apiKey: requireEnv('XAI_API_KEY'),
      baseURL: 'https://api.x.ai/v1',
    });
  }
  return xaiSingleton;
}

export type CallResult = {
  text: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
};

export type CallOpts = {
  temperature: number;
  maxTokens: number;
};

export async function callModel(
  model: Model,
  systemPrompt: string,
  userInput: string,
  opts: CallOpts,
): Promise<CallResult> {
  const t0 = Date.now();

  if (model === 'opus' || model === 'sonnet' || model === 'fable') {
    // Opus 4.7 + Sonnet 4.6 deprecated `temperature`; Anthropic rejects requests
    // that include it. Fable 5 removes it outright, and additionally requires the
    // `thinking` param to be omitted entirely (always-on adaptive thinking — an
    // explicit config 400s). The CLI flag still parses for parity with Grok runs
    // but is intentionally NOT forwarded here. Fable's thinking tokens count
    // toward max_tokens; pass --max-tokens 16000 on fable runs so the verdict
    // isn't truncated by reasoning spend.
    const res = await anthropicClient().messages.create({
      model: MODEL_IDS[model],
      max_tokens: opts.maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userInput }],
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n');
    return {
      text,
      input_tokens: res.usage.input_tokens,
      output_tokens: res.usage.output_tokens,
      latency_ms: Date.now() - t0,
    };
  }

  // grok via OpenAI-compatible endpoint
  const res = await xaiClient().chat.completions.create({
    model: MODEL_IDS.grok,
    max_tokens: opts.maxTokens,
    temperature: opts.temperature,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userInput },
    ],
  });
  const text = res.choices[0]?.message?.content ?? '';
  return {
    text,
    input_tokens: res.usage?.prompt_tokens ?? 0,
    output_tokens: res.usage?.completion_tokens ?? 0,
    latency_ms: Date.now() - t0,
  };
}
