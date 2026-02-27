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
              text: `You are an expert aviation data extraction system analyzing a scanned pilot logbook PDF.

CRITICAL — UNDERSTANDING DECIMAL FLIGHT HOURS:
All flight times are in DECIMAL hours.
- Hours and tenths are in two adjacent sub-cells: LEFT = whole hours, RIGHT = tenths
- Examples: 1|3 = 1.3, 1|8 = 1.8, 1|0 = 1.0, 1|6 = 1.6, 1|5 = 1.5
- NEVER read sub-cells separately. NEVER add them. Always combine as LEFT.RIGHT.
- Valid flight hours are always between 0.3 and 8.0
- Any value above 20 = totals row → skip it

CRITICAL — DO NOT CROSS COLUMN BOUNDARIES:
Each column has exactly 2 sub-cells. After reading 2 sub-cells for a column, STOP.
Never combine more than 2 sub-cells together.
If you find yourself reading 3 or 4 digits, you have crossed into an adjacent column — go back and re-read.

CRITICAL — THE DASH IS THE KEY:
In every flight row, exactly ONE of these is true:
- DUAL RECEIVED column has a dash (-) and PIC column has a decimal number → PIC flight
- DUAL RECEIVED column has a decimal number and PIC column has a dash (-) → DUAL flight
A dash (-) means zero. It is NOT a number.
You MUST find the dash before assigning any hours.

STEP 1 — PAGE LAYOUT:
Each PDF page is a two-page logbook spread:
- LEFT PAGE: DATE, AIRCRAFT TYPE, AIRCRAFT IDENT, FROM, TO, REMARKS. Year printed vertically on left margin (e.g. \"FEBRUARY-2019\").
- RIGHT PAGE: DUAL RECEIVED | PIC (INCL. SOLO) | TOTAL DURATION columns — each split into exactly 2 sub-cells.
- Rows are positionally aligned across both pages.

STEP 2 — IGNORE COMPLETELY:
- Last 3 rows of right page (TOTALS THIS PAGE, AMT. FORWARDED, TOTALS TO DATE)
- Last 2 columns on far right (cumulative running totals)
- Rows with no DATE on left page
- \"AMOUNT BROUGHT FORWARD\" row
- Instructor certification or endorsement text

STEP 3 — READ THE YEAR:
Year printed vertically on left margin (e.g. \"FEBRUARY-2019\"). DATE = day and month only (e.g. \"02/04\" = Feb 4th) → YYYY-MM-DD.

STEP 4 — DETECT LOGBOOK FORMAT:
Read column headers on RIGHT page (ignore last 2 columns):
- typeA: Separate DUAL RECEIVED, PILOT IN COMMAND, SOLO columns
- typeB: DUAL RECEIVED + combined PILOT IN COMMAND (INCL. SOLO), no separate SOLO
- simple: Single total duration column only

STEP 5 — FOR EACH FLIGHT ROW, FOLLOW THIS EXACT SEQUENCE:

5a. Find the DUAL RECEIVED column. Read its 2 sub-cells ONLY. Stop after 2 sub-cells.
    - Dash (-) → dualReceived = 0
    - Number → combine as LEFT.RIGHT → dualReceived = that value

5b. Find the PIC column. Read its 2 sub-cells ONLY. Stop after 2 sub-cells.
    - Dash (-) → pilotInCommand = 0
    - Number → combine as LEFT.RIGHT → pilotInCommand = that value

5c. Find the TOTAL DURATION column. Read its 2 sub-cells ONLY.
    - Combine as LEFT.RIGHT → duration = that value

5d. VERIFY — exactly one of dualReceived or pilotInCommand must be non-zero:
    - DUAL has number AND PIC has dash → correct, DUAL flight
    - DUAL has dash AND PIC has number → correct, PIC flight
    - BOTH non-zero → you crossed a column boundary, re-read 5a and 5b
    - BOTH zero → no hours, skip this row

STEP 6 — BUILD MENTAL TABLE:
Reading TOP TO BOTTOM only, stop before last 3 rows. For each valid row:
- Column A: DATE from left page
- Column B: AIRCRAFT TYPE normalized (C-172, C-152, PA-34-200T). No reg numbers, phone numbers, garbled text. Use last valid aircraft if unrecognizable.
- Column C: dualReceived from step 5a
- Column D: pilotInCommand from step 5b
- Column E: solo (typeA only)
- Column F: duration from step 5c

STEP 7 — EXTRACT OUTPUT:
For each verified row:
- date = Column A in YYYY-MM-DD format
- aircraft = Column B
- dualReceived = Column C
- pilotInCommand = Column D
- solo = Column E
- duration = Column F
- NEVER add columns together
- NEVER guess or redistribute

STEP 8 — NORMALIZE AIRCRAFT:
- Standard names only: C-172, C-152, PA-28, PA-34-200T
- Remove reg numbers, phone numbers, cert numbers
- Garbled → use last valid aircraft
- Unknown → \"Unknown\"

You MUST always include logbookFormat in your response. Never omit it.

Return a mentalTable array showing every row from Step 6 with raw date, aircraft, and values from columns C, D, E, F before filtering. Required for debugging.`
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
