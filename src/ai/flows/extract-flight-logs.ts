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
      prompt: [
        {
          text: `You are an expert aviation data extraction system. Your ONLY job is to extract EVERY SINGLE flight entry from this logbook PDF without skipping any.\n\nCRITICAL RULES:\n- Extract ALL flights from ALL pages — do not stop early\n- Do NOT summarize or sample — extract every individual row\n- If a page has 10 rows, extract all 10 rows\n- If the total logbook has 50 flights, return exactly 50 entries\n- Do not skip entries because they look similar to previous ones\n\nFor each flight entry extract:\n- date: exact flight date in YYYY-MM-DD format\n- aircraft: standardized aircraft model name\n- duration: total flight duration in decimal hours\n\nAlso classify the logbook format:\n- 'standard': has separate PIC, Solo, Dual, and Total columns\n- 'combined': single time column used for all flight types  \n- 'simple': minimal details, just date, aircraft, and duration\n\nReturn a JSON object with 'logbookFormat' and a 'flights' array containing every single flight entry found in the document. Missing entries is a critical failure.`
        },
        { media: { url: mediaUrl, contentType: 'application/pdf' } }
      ],
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
