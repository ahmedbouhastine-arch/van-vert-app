'use server';
import 'server-only';

import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';
import { z } from 'zod';

const ExtractFlightLogsInputSchema = z.object({
  flightLogPdf: z.string().optional().describe("Data URI of the PDF (deprecated for large files)"),
  storagePath: z.string().optional().describe("The path to the PDF in Firebase Storage"),
});
export type ExtractFlightLogsInput = z.infer<typeof ExtractFlightLogsInputSchema>;

const FlightLogEntrySchema = z.object({
    date: z.string().describe('The date of the flight in strict YYYY-MM-DD format.'),
    aircraft: z.string().describe('The standardized model name of the aircraft flown.'),
    duration: z.number().describe('The total duration of the flight in hours (decimal format).'),
    dualReceived: z.number().optional().default(0).describe('Dual Received flight time in hours (decimal format).'),
    pilotInCommand: z.number().optional().default(0).describe('Pilot In Command flight time in hours (decimal format).'),
    solo: z.number().optional().default(0).describe('Solo flight time in hours (decimal format).'),
});

const ExtractFlightLogsOutputSchema = z.object({
  flights: z.array(FlightLogEntrySchema).describe('Extracted flight log entries.'),
  logbookFormat: z.enum(['typeA', 'typeB', 'simple']).describe('Inferred format of the logbook: "typeA" (separate columns for Dual, PIC, Solo), "typeB" (combined PIC includes solo, separate Dual), or "simple" (minimal details).'),
});
export type ExtractFlightLogsOutput = z.infer<typeof ExtractFlightLogsOutputSchema>;

const ai = genkit({ plugins: [vertexAI({ projectId: 'REDACTED_FIREBASE_PROJECT_ID', location: 'us-central1' })] });

export async function extractFlightLogs(input: ExtractFlightLogsInput): Promise<ExtractFlightLogsOutput> {
  const mediaUrl = input.flightLogPdf || input.storagePath;
  if (!mediaUrl) throw new Error("No PDF source provided.");

  let lastError: unknown;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await ai.generate({
          model: 'vertexai/gemini-2.0-flash',
          prompt: [
            {
              text: `You are an expert aviation data extraction system analyzing a scanned FAA pilot logbook.\n\nCRITICAL INSTRUCTIONS FOR READING THIS LOGBOOK FORMAT:\n1. Each page has TWO tables side by side — LEFT and RIGHT\n2. Extract flights ONLY from the LEFT table. The left table typically has columns like DATE, AIRCRAFT TYPE, AIRCRAFT IDENT, FROM, TO, REMARKS, NR T/O, NR LDG, DURATION OF FLIGHT, DUAL RECEIVED, PILOT IN COMMAND, SOLO.\n3. IGNORE the RIGHT table completely — it contains instructor certification records, not individual flights.\n4. The YEAR is printed vertically along the left margin of the page (e.g., "FEBRUARY-2019", "JANUARY-2020") — use this year for ALL entries on that page.\n5. The DATE column contains only day and month (e.g., "02/04" = February 4th) — combine with the page year to form YYYY-MM-DD.\n6. The DURATION OF FLIGHT is the total flight time in decimal hours (e.g., "1.3" = 1.3 hours).\n7. Extract EVERY row that has a date, aircraft, and total duration — do not skip any.\n\nLOGBOOK FORMAT DETECTION:\nFirst, detect the logbook format:\n- **'typeA'**: The logbook has distinct, separate columns for 'DUAL RECEIVED', 'PILOT IN COMMAND', and 'SOLO' flight times.\n- **'typeB'**: The logbook has 'DUAL RECEIVED' and a combined 'PILOT IN COMMAND' column that *already includes* solo hours. There is NO separate 'SOLO' column.\n- **'simple'**: The logbook is very basic, primarily listing just the date, aircraft, and a single total duration for each flight without further breakdown of flight types (PIC, Solo, Dual).\n\nFLIGHT TIME EXTRACTION RULES:\nFor each flight row, you must look at EACH column independently and only fill in the field that corresponds to the column where the hours appear:\n- If the hours appear in the 'Dual Received' column → set dualReceived to those hours and set pilotInCommand and solo to 0\n- If the hours appear in the 'Pilot in Command' column (with or without 'Incl. Solo') → set pilotInCommand to those hours and set dualReceived and solo to 0\n- If the hours appear in the 'Solo' column → set solo to those hours and set dualReceived and pilotInCommand to 0\n\nCRITICAL: A single flight row will NEVER have hours in more than one of these columns simultaneously. Do NOT default everything to pilotInCommand. Read the actual column header above the value to determine which field to populate. If a cell is empty, a dash (-), or zero, that field is 0.\n\n- If a specific column (e.g., 'SOLO') is not present in the detected logbook format, its corresponding value should be 0 for that flight entry. Do NOT guess or redistribute hours between columns.\n- Ensure the extracted 'duration' is the total flight time.\n\nYou MUST always include the logbookFormat field in your response. It is required. Choose one of: typeB if the logbook has a combined PIC (including solo) column, typeA if PIC and Solo are separate columns, or simple if the logbook has minimal column detail. Never omit this field.\n\nReturn a JSON object with 'logbookFormat' and a 'flights' array containing every individual flight entry found in the document. Missing entries is a critical failure. Each flight entry must include 'date', 'aircraft', 'duration', and the relevant flight time breakdowns ('dualReceived', 'pilotInCommand', 'solo') based on the detected logbook format.`
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
      if (!output?.logbookFormat) {
        output.logbookFormat = 'simple';
      }

      const parsed = ExtractFlightLogsOutputSchema.parse(output as unknown);

      const currentYear = new Date().getFullYear();
      const filteredFlights = parsed.flights.filter((log) => {
        const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(log.date) && 
          !isNaN(new Date(log.date).getTime()) &&
          new Date(log.date).getFullYear() >= 1990 &&
          new Date(log.date).getFullYear() <= currentYear;
        return dateValid && !!log.aircraft && typeof log.duration === 'number' && log.duration > 0;
      });

      return {
        flights: filteredFlights,
        logbookFormat: parsed.logbookFormat,
      };

    } catch (error: unknown) {
      lastError = error;
      const isRateLimit = error instanceof Error && error.message.includes('429');
      if (isRateLimit && attempt < 5) {
        const delay = attempt * 8000; // 8s, 16s, 24s, 32s
        console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt}/5)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error(`Failed to extract flight logs after multiple attempts due to: ${getErrorMessage(lastError)}`);
}

function getErrorMessage(err: unknown): string {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  const e = err as { message?: unknown };
  if (typeof e.message === 'string') return e.message;
  return 'An unexpected error occurred';
}
