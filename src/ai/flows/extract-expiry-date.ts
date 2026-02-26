'use server';
import 'server-only';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';

const ExtractExpiryDateInputSchema = z.object({
  documentDataUri: z.string().describe(
    "An image or PDF of a document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type ExtractExpiryDateInput = z.infer<typeof ExtractExpiryDateInputSchema>;

const ExtractExpiryDateOutputSchema = z.object({
  expiryDate: z.string().nullable().describe('The expiry date found in the document in YYYY-MM-DD format, or null if no date is found.'),
});
export type ExtractExpiryDateOutput = z.infer<typeof ExtractExpiryDateOutputSchema>;

const ai = genkit({ plugins: [googleAI()] });

export async function extractExpiryDate(input: ExtractExpiryDateInput): Promise<ExtractExpiryDateOutput> {

  const result = await ai.generate({
    model: 'googleai/gemini-2.0-flash',
    prompt: [
      { text: `You are an expert at processing official documents. Find and extract the expiry date from the provided document. Look for labels like "Expiry Date", "Expires", "Valid Until", or similar. Return ONLY in YYYY-MM-DD format, or null if not found.` },
      { media: { url: input.documentDataUri } }
    ],
    output: { schema: ExtractExpiryDateOutputSchema },
    config: {
      temperature: 0.1, // Lower temperature for more deterministic output
    },
  });

  return result.output ?? { expiryDate: null };
}
