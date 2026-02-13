
import { config } from 'dotenv';
config(); // Load .env file at the earliest point

import {genkit, GenkitPlugin} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const geminiApiKey = process.env.GEMINI_API_KEY;

const plugins: GenkitPlugin[] = [];

if (geminiApiKey) {
  plugins.push(
    googleAI({
      apiKey: geminiApiKey,
    })
  );
} else {
  // This will prevent the server from crashing and allows the app to run,
  // but AI features will be disabled. A warning is logged to the console.
  console.warn(
    'WARNING: GEMINI_API_KEY environment variable is not set. AI features will be disabled. Please add the key to your .env file.'
  );
}

export const ai = genkit({
  plugins: plugins,
  model: 'googleai/gemini-1.5-pro-latest',
});
