import { config } from 'dotenv';
config(); // Load .env file at the earliest point

import {genkit, GenkitPlugin} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const plugins: GenkitPlugin[] = [
  // Initialize the googleAI plugin.
  // This will automatically use Application Default Credentials (ADC).
  // For local development, you must run `gcloud auth application-default login`.
  // In a deployed Google Cloud environment, it will use the attached service account.
  googleAI()
];

export const ai = genkit({
  plugins: plugins,
  model: 'googleai/gemini-2.0-flash',
});
