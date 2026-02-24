'use server';
/**
 * @fileOverview Extracts the expiry date from a document image or PDF.
 *
 * - extractExpiryDate - A function that handles the expiry date extraction process.
 * - ExtractExpiryDateInput - The input type for the extractExpiryDate function.
 * - ExtractExpiryDateOutput - The return type for the extractExpiryDate function.
 */

import { definePrompt, flow } from '@genkit-ai/core';
import { z } from 'zod';

const ExtractExpiryDateInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "An image or PDF of a document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractExpiryDateInput = z.infer<typeof ExtractExpiryDateInputSchema>;

const ExtractExpiryDateOutputSchema = z.object({
    expiryDate: z.string().nullable().describe('The expiry date found in the document in YYYY-MM-DD format, or null if no date is found.'),
});
export type ExtractExpiryDateOutput = z.infer<typeof ExtractExpiryDateOutputSchema>;

export async function extractExpiryDate(input: ExtractExpiryDateInput): Promise<ExtractExpiryDateOutput> {
  return extractExpiryDateFlow(input);
}

const prompt = definePrompt({
  name: 'extractExpiryDatePrompt',
  input: {schema: ExtractExpiryDateInputSchema},
  output: {schema: ExtractExpiryDateOutputSchema},
  prompt: `You are an expert at processing official documents. Your task is to find and extract the expiry date from the provided document image or PDF.

  Look for labels like "Expiry Date", "Date of Expiry", "Expires", "Valid Until", or similar phrases.

  The date can be in various formats (e.g., DD/MM/YYYY, MM-DD-YY, Month DD, YYYY).
  
  IMPORTANT:
  - Return the date ONLY in YYYY-MM-DD format.
  - If no expiry date is found, return null.

  Document for processing: {{media url=documentDataUri}}`,
});

const extractExpiryDateFlow = flow(
  {
    name: 'extractExpiryDateFlow',
    inputSchema: ExtractExpiryDateInputSchema,
    outputSchema: ExtractExpiryDateOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output || { expiryDate: null };
  }
);
