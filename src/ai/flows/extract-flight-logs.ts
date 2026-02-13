
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
import { subMonths, formatISO } from 'date-fns';

const ExtractFlightLogsInputSchema = z.object({
  flightLogPdf: z
    .string()
    .describe(
      "A PDF file of a pilot's flight log, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
});
export type ExtractFlightLogsInput = z.infer<typeof ExtractFlightLogsInputSchema>;


const FlightLogEntrySchema = z.object({
    date: z.string().describe('The date of the flight in YYYY-MM-DD format.'),
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

const sixMonthsAgo = formatISO(subMonths(new Date(), 6), { representation: 'date' });

const prompt = ai.definePrompt({
  name: 'extractFlightLogsPrompt',
  model: 'googleai/gemini-2.0-flash',
  input: {schema: ExtractFlightLogsInputSchema},
  output: {schema: ExtractFlightLogsOutputSchema},
  prompt: `You are an expert aviation administrator. Your task is to extract flight log entries from the provided PDF document.

  Analyze the document and identify all individual flight entries. For each entry, extract the following information:
  - The date of the flight.
  - The aircraft type or registration.
  - The flight duration in hours (convert minutes to a decimal of hours if necessary).
  - The name of the instructor, if listed.
  - Any remarks about the flight.

  IMPORTANT: Only include flight entries that occurred on or after ${sixMonthsAgo}. Discard all entries before this date.

  Return the data as a structured array of flight log objects. Ensure all dates are in YYYY-MM-DD format.

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
