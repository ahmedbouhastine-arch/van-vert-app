import { config } from 'dotenv';
config();

import '@/ai/flows/flag-expiring-documents.ts';
import '@/ai/flows/check-recency.ts';
