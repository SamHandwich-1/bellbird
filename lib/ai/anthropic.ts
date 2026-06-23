import { createAnthropic } from '@ai-sdk/anthropic';
import type { LanguageModelV1 } from '@ai-sdk/provider';
import { MODEL_IDS } from './models';

const provider = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Wire model identifiers — sourced from the single registry in ./models.
export const OPUS_MODEL_ID = MODEL_IDS.opus;
export const SONNET_MODEL_ID = MODEL_IDS.sonnet;

// Opus 4.7 and Sonnet 4.6 deprecated the `temperature` parameter — Anthropic
// rejects requests that include it. AI SDK v4 internally substitutes
// `temperature: 0` when a caller doesn't supply one (see
// node_modules/ai/dist/index.mjs:1618-1619, "TODO v5 remove default 0"). This
// wrapper strips `temperature` from the call options before it reaches the
// provider, so the eventual HTTP body omits the field entirely.
//
// Explicit field-by-field forwarding (rather than object spread) — guarantees
// every LanguageModelV1 surface AI SDK might touch is preserved with correct
// `this` binding on methods. Diagnostic console.log fires on every doStream /
// doGenerate; remove once verified in production.
function withoutTemperature(model: LanguageModelV1): LanguageModelV1 {
  const supportsUrl =
    typeof model.supportsUrl === 'function' ? model.supportsUrl.bind(model) : undefined;

  return {
    specificationVersion: model.specificationVersion,
    provider: model.provider,
    modelId: model.modelId,
    defaultObjectGenerationMode: model.defaultObjectGenerationMode,
    supportsImageUrls: model.supportsImageUrls,
    supportsStructuredOutputs: model.supportsStructuredOutputs,
    ...(supportsUrl ? { supportsUrl } : {}),
    doStream: async (options) => {
      const { temperature, ...rest } = options;
      console.log(
        `[withoutTemperature/${model.modelId}] doStream: stripping temperature=${String(temperature)} (rest has temperature? ${'temperature' in rest})`,
      );
      return model.doStream(rest);
    },
    doGenerate: async (options) => {
      const { temperature, ...rest } = options;
      console.log(
        `[withoutTemperature/${model.modelId}] doGenerate: stripping temperature=${String(temperature)} (rest has temperature? ${'temperature' in rest})`,
      );
      return model.doGenerate(rest);
    },
  };
}

export const opus = withoutTemperature(provider(OPUS_MODEL_ID));
export const sonnet = withoutTemperature(provider(SONNET_MODEL_ID));
