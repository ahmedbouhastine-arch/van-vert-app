'use server';
/**
 * @fileOverview Extracts flight log data from a PDF document.
 *
 * - extractFlightLogs - A function that handles the flight log extraction process.
 * - ExtractFlightLogsInput - The input type for the extractFlightLogs function.
 * - ExtractFlightLogsOutput - The return type for the extractFlightLogs function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractFlightLogsInputSchema = z.object({
  flightLogPdf: z
    .string()
    .describe(
      "A PDF file of a pilot's flight log, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
});
export type ExtractFlightLogsInput = z.infer<typeof ExtractFlightLogsInputSchema>;


const FlightLogEntrySchema = z.object({
    date: z.string().describe('The date of the flight in strict YYYY-MM-DD format. Do not use words or ordinal suffixes (e.g., "st", "nd", "rd", "th"). Example: "2025-06-09".'),
    aircraft: z.string().describe('The type or registration of the aircraft flown.'),
    duration: z.number().describe('The duration of the flight in hours.'),
    instructorName: z.string().optional().describe('The name of the instructor, if any.'),
    remarks: z.string().optional().describe('Any remarks or notes for the flight.'),
});

const ExtractFlightLogsOutputSchema = z.array(FlightLogEntrySchema);
export type ExtractFlightLogsOutput = z.infer<typeof ExtractFlightLogsOutputSchema>;

export async function extractFlightLogs(input: ExtractFlightLogsInput): Promise<ExtractFlightLogsOutput> {
  return extractFlightLogsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractFlightLogsPrompt',
  input: {schema: ExtractFlightLogsInputSchema},
  output: {schema: ExtractFlightLogsOutputSchema},
  prompt: `You are an expert aviation administrator. Your task is to extract flight log entries from the provided PDF document.

  Analyze the document and identify all individual flight entries. For each entry, extract the following information:
  - The date of the flight.
  - The aircraft type or registration.
  - The flight duration in hours (convert minutes to a decimal of hours if necessary).
  - The name of the instructor, if listed.
  - Any remarks about the flight.

  Return the data as a structured array of flight log objects.
  
  IMPORTANT: Ensure all dates are in the strict YYYY-MM-DD format. For example, "June 9th, 2025" must be returned as "2025-06-09".

  PDF for processing: {{media url=flightLogPdf}}`,
});

const extractFlightLogsFlow = ai.defineFlow(
  {
    name: 'extractFlightLogsFlow',
    inputSchema: ExtractFlightLogsInputSchema,
    outputSchema: ExtractFlightLogsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output || [];
  }
);
