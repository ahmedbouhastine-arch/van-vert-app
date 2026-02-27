'use server';
import 'server-only';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';

const ExtractFlightLogsInputSchema = z.object({
  flightLogPdf: z.string().optional().describe("Data URI of the PDF (deprecated for large files)"),
  storagePath: z.string().optional().describe("The path to the PDF in Firebase Storage"),
});
export type ExtractFlightLogsInput = z.infer<typeof ExtractFlightLogsInputSchema>;

const FlightLogEntrySchema = z.object({
    date: z.string().describe('The date of the flight in strict YYYY-MM-DD format.'),
    aircraft: z.string().describe('The standardized model name of the aircraft flown.'),
    duration: z.number().describe('The duration of the flight in hours (decimal format).'),
});

const ExtractFlightLogsOutputSchema = z.object({
  flights: z.array(FlightLogEntrySchema).describe('Extracted flight log entries.'),
  logbookFormat: z.enum(['standard', 'combined', 'simple']).describe('Inferred format of the logbook: "standard" (separate columns for PIC/Solo/Dual), "combined" (PIC/Solo inferred from total time or remarks), or "simple" (minimal details).'),
});
export type ExtractFlightLogsOutput = z.infer<typeof ExtractFlightLogsOutputSchema>;

const ai = genkit({ plugins: [googleAI()] });

export async function extractFlightLogs(input: ExtractFlightLogsInput): Promise<ExtractFlightLogsOutput> {
  const mediaUrl = input.flightLogPdf || input.storagePath;
  if (!mediaUrl) throw new Error("No PDF source provided.");

  const res = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: `You are an expert aviation administrator. Your task is to analyze the provided PDF logbook and perform two steps:\n\n      **Step 1: Classify the Logbook Format**\n      Based on the layout and columns, determine the logbook\'s format:\n      - **\'standard\'**: The logbook has distinct, separate columns for flight times like "PIC" (Pilot In Command), "Solo", "Dual", and "Total Duration".\n      - **\'combined\'**: The logbook lacks separate columns for different flight times. PIC or Solo time is often the same as the total flight duration, potentially indicated by a checkmark or a single column for all flight time.\n      - **\'simple\'**: The logbook is very basic, primarily listing just the date, aircraft, and a single duration for each flight without further breakdown.\n\n      **Step 2: Extract Flight Entries**\n      Extract all individual flight entries. For each entry, provide ONLY the following:\n      - **date**: The flight date (format: YYYY-MM-DD).\n      - **aircraft**: The standardized aircraft model.\n      - **duration**: The total duration of the flight in hours (as a decimal).\n
      Do NOT extract remarks, PIC status, or Solo status. Focus only on the three fields above.\n\n      Return a single JSON object containing the detected \'logbookFormat\' and an array of all extracted \'flights\'.`,
      
      output: { schema: ExtractFlightLogsOutputSchema },
      config: {
        temperature: 0.1,
      }
  });

  const output = res.output;
  if (!output) {
    return { flights: [], logbookFormat: 'simple' };
  }

  const parsed = ExtractFlightLogsOutputSchema.parse(output as unknown);

  const filteredFlights = parsed.flights.filter((log) => {
    return !!log.date && !!log.aircraft && typeof log.duration === 'number';
  });

  return {
    flights: filteredFlights,
    logbookFormat: parsed.logbookFormat,
  };
}
