import { createXai } from '@ai-sdk/xai';

const provider = createXai({
  apiKey: process.env.XAI_API_KEY,
});

export const GROK_MODEL_ID = 'grok-4';

export const grok = provider(GROK_MODEL_ID);
