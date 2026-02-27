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

const MentalTableRowSchema = z.object({
  date: z.string(),
  aircraft: z.string(),
  dualReceived: z.number().default(0),
  pilotInCommand: z.number().default(0),
  solo: z.number().default(0),
  duration: z.number().default(0),
});

const ExtractFlightLogsOutputSchema = z.object({
  flights: z.array(FlightLogEntrySchema).describe('Extracted flight log entries.'),
  logbookFormat: z.enum(['typeA', 'typeB', 'simple']).describe('Inferred format of the logbook: "typeA" (separate columns for Dual, PIC, Solo), "typeB" (combined PIC includes solo, separate Dual), or "simple" (minimal details).'),
  mentalTable: z.array(MentalTableRowSchema).optional(),
});
export type ExtractFlightLogsOutput = z.infer<typeof ExtractFlightLogsOutputSchema>;

const ai = genkit({ plugins: [vertexAI({ projectId: 'REDACTED_FIREBASE_PROJECT_ID', location: 'us-central1' })] });

export async function extractFlightLogs(input: ExtractFlightLogsInput): Promise<ExtractFlightLogsOutput> {
  const mediaUrl = input.flightLogPdf || input.storagePath;
  if (!mediaUrl) throw new Error("No PDF source provided.");

  const gsUri = mediaUrl.replace('https://storage.googleapis.com/', 'gs://');

  let lastError: unknown;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await ai.generate({
          model: 'vertexai/gemini-2.0-flash',
          prompt: [
            {
              text: `You are an expert aviation data extraction system analyzing a scanned pilot logbook PDF.\n\nCRITICAL — UNDERSTANDING DECIMAL FLIGHT HOURS:\nAll flight times are in DECIMAL hours.\n- Hours and tenths are in two adjacent sub-cells: LEFT = whole hours, RIGHT = tenths\n- Examples: 1|3 = 1.3, 1|8 = 1.8, 1|0 = 1.0, 1|6 = 1.6, 1|5 = 1.5\n- NEVER read sub-cells separately. NEVER add them. Always combine as LEFT.RIGHT.\n- Valid flight hours are always between 0.3 and 8.0\n- Any value above 20 = totals row → skip it\n\nSTEP 1 — PAGE LAYOUT:\nEach PDF page is a two-page logbook spread:\n- LEFT PAGE: DATE, AIRCRAFT TYPE, AIRCRAFT IDENT, FROM, TO, REMARKS. Year printed vertically on left margin (e.g. \"FEBRUARY-2019\").\n- RIGHT PAGE: Flight time columns — DUAL RECEIVED, PILOT IN COMMAND (INCL. SOLO), TOTAL DURATION OF FLIGHT.\n- Rows are positionally aligned across both pages.\n\nSTEP 2 — IGNORE COMPLETELY:\n- Last 3 rows of right page (TOTALS THIS PAGE, AMT. FORWARDED, TOTALS TO DATE)\n- Last 2 columns on far right (cumulative running totals)\n- Rows with no DATE on left page\n- \"AMOUNT BROUGHT FORWARD\" row\n- Instructor certification or endorsement text\n\nSTEP 3 — READ THE YEAR:\nYear is printed vertically on left margin (e.g. \"FEBRUARY-2019\"). DATE column = day and month only (e.g. \"02/04\" = February 4th) → YYYY-MM-DD.\n\nSTEP 4 — DETECT LOGBOOK FORMAT:\nRead column headers on RIGHT page (ignore last 2 columns):\n- typeA: Separate DUAL RECEIVED, PILOT IN COMMAND, and SOLO columns\n- typeB: DUAL RECEIVED + combined PILOT IN COMMAND (INCL. SOLO), no separate SOLO\n- simple: Single total duration column only\n\nSTEP 5 — LOCATE THE DASH (-) PATTERN:\nThis is the most important step. In this logbook, every flight row on the right page follows this pattern:\n- A PIC flight: DUAL RECEIVED column has a dash (-), PIC column has the decimal hours\n- A DUAL flight: DUAL RECEIVED column has the decimal hours, PIC column has a dash (-)\n- The dash (-) is the indicator of an empty column\n\nFor each flight row on the right page:\n1. Look at the DUAL RECEIVED column for this row. Do you see a dash (-) or a decimal number?\n2. Look at the PIC column for this row. Do you see a dash (-) or a decimal number?\n3. Apply this exact logic:\n   - DUAL column = dash, PIC column = number → this is a PIC flight → pilotInCommand = that number, dualReceived = 0\n   - DUAL column = number, PIC column = dash → this is a DUAL flight → dualReceived = that number, pilotInCommand = 0\n   - Both = dash → no hours recorded → skip row\n   - Both appear to have numbers → you are misreading one of them. A dash can look like a short horizontal line or be faint. Look again — one MUST be a dash.\n\nSTEP 6 — BUILD A MENTAL TABLE:\nReading TOP TO BOTTOM only, stop before last 3 rows:\n- Column A: DATE from left page\n- Column B: AIRCRAFT TYPE — normalized only (C-172, C-152, PA-34-200T). No reg numbers, phone numbers, or garbled text. Use last valid aircraft if unrecognizable.\n- Column C: DUAL RECEIVED — is it a dash or a decimal number? (combine sub-cells as LEFT.RIGHT)\n- Column D: PIC — is it a dash or a decimal number? (combine sub-cells as LEFT.RIGHT)\n- Column E: SOLO — is it a dash or a decimal number? (typeA only)\n- Column F: TOTAL DURATION — combine sub-cells as LEFT.RIGHT\n\nSTEP 7 — EXTRACT EACH ROW:\nUsing the dash detection from Step 5 and the mental table from Step 6:\n- date = Column A in YYYY-MM-DD\n- aircraft = Column B normalized\n- dualReceived = Column C if it has a number, else 0\n- pilotInCommand = Column D if it has a number, else 0\n- solo = Column E if it has a number, else 0 (typeA only)\n- duration = Column F\n- NEVER add columns together\n- NEVER guess or redistribute\n\nSTEP 8 — SELF CHECK EVERY ROW:\nBefore writing output for each row ask:\n- \"Did I find exactly ONE dash and ONE number across the DUAL and PIC columns?\"\n- If yes → correct, write the output\n- If no → re-examine the row before writing\n\nSTEP 9 — NORMALIZE AIRCRAFT:\n- Standard names only: C-172, C-152, PA-28, PA-34-200T\n- Remove reg numbers, phone numbers, cert numbers\n- Garbled → use last valid aircraft\n- Unknown → use \"Unknown\"\n\nYou MUST always include logbookFormat. Never omit it.\n\nReturn a mentalTable array from Step 6 showing every row with raw date, aircraft, and exact values from columns C, D, E, F before filtering. Required for debugging.`
            },
            { media: { url: gsUri, contentType: 'application/pdf' } }
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
      if (output.mentalTable) {
        console.log('=== AI MENTAL TABLE ===');
        console.table(output.mentalTable);
        console.log('======================');
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
        mentalTable: parsed.mentalTable,
      };

    } catch (error: unknown) {
      lastError = error;
      const isRateLimit = error instanceof Error && error.message.includes('429');
      if (isRateLimit && attempt < 5) {
        const delay = attempt * 8000; 
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
