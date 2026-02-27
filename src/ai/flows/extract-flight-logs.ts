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
    flightType: z.enum(['PIC', 'Solo', 'Dual', 'Unknown']).describe('Type of flight. Infer from the logbook: PIC if pilot in command column is filled, Solo if solo column is filled, Dual if dual received column is filled, otherwise Unknown.'),
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

  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await ai.generate({
          model: 'googleai/gemini-2.0-flash',
          prompt: [
            {
              text: `You are an expert aviation data extraction system analyzing a scanned FAA pilot logbook.\n\nCRITICAL INSTRUCTIONS FOR READING THIS LOGBOOK FORMAT:\n1. Each page has TWO tables side by side — LEFT and RIGHT\n2. Extract flights ONLY from the LEFT table (it has columns: DATE, AIRCRAFT TYPE, AIRCRAFT IDENT, FROM, TO, REMARKS, NR T/O, NR LDG, DURATION OF FLIGHT, PILOT IN COMMAND, SOLO, DUAL RECEIVED)\n3. IGNORE the RIGHT table completely — it contains instructor certification records, not individual flights\n4. The YEAR is printed vertically along the left margin of the page (e.g., "FEBRUARY-2019", "JANUARY-2020") — use this year for ALL entries on that page\n5. The DATE column contains only day and month (e.g., "02/04" = February 4th) — combine with the page year to form YYYY-MM-DD\n6. The DURATION OF FLIGHT is in the last column of the LEFT table — read it as decimal hours (e.g., "1.3" = 1.3 hours)\n7. Extract EVERY row that has a date, aircraft, and duration — do not skip any\n\nFor each flight entry, also determine the flightType:\n- 'PIC': if the 'PILOT IN COMMAND' column has a value\n- 'Solo': if the 'SOLO' column has a value\n- 'Dual': if the 'DUAL RECEIVED' column has a value\n- 'Unknown': if none of the above are clearly indicated\n\nIMPORTANT:\n- Do NOT extract from totals rows (TOTALS THIS PAGE, AMT. FORWARDED, TOTALS TO DATE)\n- Do NOT extract from the right-side certification table\n- Construct full dates using page year + row day/month\n- Return logbookFormat as 'standard' for this logbook type\n\nReturn a JSON object with 'logbookFormat' and a 'flights' array with every individual flight entry.`
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
        const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(log.date) && !isNaN(new Date(log.date).getTime());
        return dateValid && !!log.aircraft && typeof log.duration === 'number' && log.duration > 0;
      });

      return {
        flights: filteredFlights,
        logbookFormat: parsed.logbookFormat,
      };

    } catch (error: unknown) {
      lastError = error;
      const isRateLimit = error instanceof Error && error.message.includes('429');
      if (isRateLimit && attempt < 3) {
        const delay = attempt * 5000; // 5s, 10s
        console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt}/3)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}
