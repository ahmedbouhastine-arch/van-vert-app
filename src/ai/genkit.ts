
import { config } from 'dotenv';
config(); // Load .env file at the earliest point

import {genkit, GenkitPlugin} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const geminiApiKey = process.env.GEMINI_API_KEY;

const plugins: GenkitPlugin[] = [];

// Initialize the googleAI plugin.
// If a GEMINI_API_KEY is provided, it will be used.
// Otherwise, the plugin will automatically use Application Default Credentials.
if (geminiApiKey) {
  plugins.push(googleAI({ apiKey: geminiApiKey }));
} else {
  plugins.push(googleAI());
}

export const ai = genkit({
  plugins: plugins,
  model: 'googleai/gemini-2.0-flash',
});
