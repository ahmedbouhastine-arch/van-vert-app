'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractFlightLogsInputSchema = z.object({
  flightLogPdf: z.string().optional().describe("Data URI of the PDF (deprecated for large files)"),
  storagePath: z.string().optional().describe("The path to the PDF in Firebase Storage"),
});
export type ExtractFlightLogsInput = z.infer<typeof ExtractFlightLogsInputSchema>;

const FlightLogEntrySchema = z.object({
    date: z.string().describe('YYYY-MM-DD format.'),
    aircraft: z.string().describe('Standardized aircraft model.'),
    duration: z.number().describe('Hours.'),
    isPIC: z.boolean().optional(),
    isSolo: z.boolean().optional(),
    remarks: z.string().optional(),
});

const ExtractFlightLogsOutputSchema = z.array(FlightLogEntrySchema);
export type ExtractFlightLogsOutput = z.infer<typeof ExtractFlightLogsOutputSchema>;

export async function extractFlightLogs(input: ExtractFlightLogsInput): Promise<ExtractFlightLogsOutput> {
  return extractFlightLogsFlow(input);
}

const extractFlightLogsFlow = ai.defineFlow(
  {
    name: 'extractFlightLogsFlow',
    inputSchema: ExtractFlightLogsInputSchema,
    outputSchema: ExtractFlightLogsOutputSchema,
  },
  async (input) => {
    // If we have a storage path, we use the media block with a direct URL (Gemini can handle this)
    // For this implementation, we'll assume the action provides the public URL.
    const mediaUrl = input.flightLogPdf || input.storagePath;

    if (!mediaUrl) throw new Error("No PDF source provided.");

    const { output } = await ai.generate({
        model: 'googleai/gemini-2.0-flash',
        prompt: `You are an expert aviation administrator. Extract flight log entries from this PDF.
        Return a structured array of flight log objects.
        Fields: date (YYYY-MM-DD), aircraft (model), duration (hours), isPIC (bool), isSolo (bool), remarks.
        Standardize aircraft names (e.g., "PA28" -> "PA-28-161").`,
        output: { schema: ExtractFlightLogsOutputSchema },
        messages: [
            {
                role: 'user',
                content: [{ media: { url: mediaUrl, contentType: 'application/pdf' } }]
            }
        ]
    });

    return output?.filter(log => log.date && log.aircraft) || [];
  }
);
