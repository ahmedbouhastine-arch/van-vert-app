'use server';

/**
 * @fileOverview Flags documents with upcoming expiry dates for applicant prioritization.
 *
 * - flagExpiringDocuments - A function that flags documents with expiring dates.
 * - FlagExpiringDocumentsInput - The input type for the flagExpiringDocuments function.
 * - FlagExpiringDocumentsOutput - The return type for the flagExpiringDocuments function.
 */

import { flow } from '@genkit-ai/core/lib';
import { z } from 'zod';

const FlagExpiringDocumentsInputSchema = z.object({
  documents: z.array(
    z.object({
      name: z.string().describe('The name of the document.'),
      expiryDate: z.string().optional().describe('The expiry date of the document in ISO format (YYYY-MM-DD).'),
    })
  ).describe('An array of document objects, each containing a name and an optional expiry date.'),
  daysUntilExpiry: z.number().default(90).describe('The number of days until expiry to consider a document as expiring soon.'),
});
export type FlagExpiringDocumentsInput = z.infer<typeof FlagExpiringDocumentsInputSchema>;

const FlagExpiringDocumentsOutputSchema = z.array(
  z.object({
    name: z.string().describe('The name of the document.'),
    isExpiringSoon: z.boolean().describe('Whether the document is expiring soon based on the provided daysUntilExpiry.'),
  })
).describe('An array of document objects, each containing a name and a flag indicating if it is expiring soon.');
export type FlagExpiringDocumentsOutput = z.infer<typeof FlagExpiringDocumentsOutputSchema>;

export async function flagExpiringDocuments(input: FlagExpiringDocumentsInput): Promise<FlagExpiringDocumentsOutput> {
  return flagExpiringDocumentsFlow(input);
}

const flagExpiringDocumentsFlow = flow(
  {
    name: 'flagExpiringDocumentsFlow',
    inputSchema: FlagExpiringDocumentsInputSchema,
    outputSchema: FlagExpiringDocumentsOutputSchema,
  },
  async input => {
    const now = new Date();
    return input.documents.map(document => {
      if (!document.expiryDate) {
        return {
          name: document.name,
          isExpiringSoon: false,
        };
      }

      const expiryDate = new Date(document.expiryDate);
      const timeDiff = expiryDate.getTime() - now.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      return {
        name: document.name,
        isExpiringSoon: daysDiff <= input.daysUntilExpiry,
      };
    });
  }
);
