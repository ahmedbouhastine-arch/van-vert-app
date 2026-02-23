
import { config } from 'dotenv';
config(); // Load .env file at the earliest point

import { configureGenkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';

// genkit's plugin types vary between versions; keep plugin list untyped to
// avoid a hard dependency on a specific exported type.
const plugins: unknown[] = [
  // Initialize the googleAI plugin.
  // This will automatically use Application Default Credentials (ADC).
  // For local development, you must run `gcloud auth application-default login`.
  // In a deployed Google Cloud environment, it will use the attached service account.
  googleAI()
];

configureGenkit({
  plugins: plugins,
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
