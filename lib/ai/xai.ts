import { createXai } from '@ai-sdk/xai';
import { MODEL_IDS } from './models';

const provider = createXai({
  apiKey: process.env.XAI_API_KEY,
});

export const GROK_MODEL_ID = MODEL_IDS.grok;

export const grok = provider(GROK_MODEL_ID);
