
import { config } from 'dotenv';
config(); // Load .env file at the earliest point

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  // This will cause the server to fail on startup if the key is missing,
  // providing a very clear error message in the server logs.
  throw new Error(
    'FATAL: GEMINI_API_KEY environment variable is not set. Please add it to your .env file or environment variables.'
  );
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: geminiApiKey,
    }),
  ],
  model: 'googleai/gemini-1.5-flash-latest',
});
