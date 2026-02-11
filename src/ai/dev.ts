
import { config } from 'dotenv';
config();

import '@/ai/flows/flag-expiring-documents.ts';
import '@/ai/flows/check-recency.ts';
import '@/ai/flows/extract-flight-logs.ts';
import '@/ai/flows/extract-expiry-date.ts';
