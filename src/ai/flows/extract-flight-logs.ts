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
              text: `You are an expert aviation data extraction system analyzing a scanned pilot logbook PDF.\n\nCRITICAL — UNDERSTANDING DECIMAL FLIGHT HOURS:\nAll flight times in this logbook are recorded in DECIMAL hours.\n- 1.3 = one point three hours — the COMPLETE number is 1.3, not 3, not 1\n- 1.8 = one point eight hours — the COMPLETE number is 1.8, not 8, not 1\n- Hours and tenths are written in two separate sub-cells side by side (e.g. '1' and '3' in adjacent cells) — these TWO cells together form ONE decimal number: 1.3\n- Always combine: LEFT sub-cell = whole hours, RIGHT sub-cell = tenths → result = LEFT.RIGHT\n- Examples: 1|3 = 1.3, 1|8 = 1.8, 1|0 = 1.0, 1|6 = 1.6, 1|5 = 1.5\n- NEVER read just one sub-cell alone. NEVER add sub-cells together. NEVER treat them as separate values.\n- Individual flight hours are always between 0.3 and 8.0 — any value above 20 means you are reading a totals row — STOP and skip it.\n\nSTEP 1 — UNDERSTAND THE PAGE LAYOUT:\nEach PDF page shows a two-page logbook spread photographed open:\n- LEFT PAGE: Contains DATE, AIRCRAFT TYPE, AIRCRAFT IDENT, FROM, TO, REMARKS columns. The year is printed vertically along the left margin (e.g. "FEBRUARY-2019").\n- RIGHT PAGE: Contains the flight time columns — DUAL RECEIVED, PILOT IN COMMAND (INCL. SOLO), and TOTAL DURATION OF FLIGHT.\n- Rows are aligned by position across both pages — row 1 on the left = row 1 on the right.\n\nSTEP 2 — IDENTIFY BOUNDARIES. IGNORE THESE COMPLETELY:\n- The last 3 rows of the right page — ALWAYS summary rows: TOTALS THIS PAGE, AMT. FORWARDED, TOTALS TO DATE\n- The last 2 columns on the far right — ALWAYS cumulative running totals, not individual flight data\n- Any row with no DATE on the left page\n- Any row saying "AMOUNT BROUGHT FORWARD"\n- Any instructor certification or endorsement text\n\nSTEP 3 — READ THE YEAR:\nThe year is printed vertically along the left margin (e.g. "FEBRUARY-2019"). Use this year for ALL entries on that page. DATE column = day and month only (e.g. "02/04" = February 4th) → combine to form YYYY-MM-DD.\n\nSTEP 4 — DETECT LOGBOOK FORMAT:\nRead the column headers on the RIGHT page (ignoring the last 2 columns):\n- typeA: Has separate DUAL RECEIVED, PILOT IN COMMAND, and SOLO columns\n- typeB: Has DUAL RECEIVED and a combined PILOT IN COMMAND (INCL. SOLO) column — no separate SOLO column\n- simple: Only has a single total duration column\n\nSTEP 5 — LOCATE COLUMN HEADERS FIRST:\nBefore reading ANY row data, scan the RIGHT page headers and make a note of:\n1. Which column header says "DUAL RECEIVED" — call this the DUAL column\n2. Which column header says "PILOT IN COMMAND" or "PILOT IN COMMAND INCL. SOLO" — call this the PIC column\n3. Which column header says "SOLO" if present — call this the SOLO column\n4. Which column header says "TOTAL DURATION OF FLIGHT" — call this the DURATION column\n\nThe DUAL column is always to the LEFT of the PIC column.\nThe PIC column is always to the RIGHT of the DUAL column.\nThe DURATION column is always the rightmost valid column (before the 2 ignored total columns).\n\nSTEP 6 — BUILD A MENTAL TABLE:\nRead TOP TO BOTTOM only. Stop before the last 3 rows. For each valid flight row build:\n- Column A: DATE from left page\n- Column B: AIRCRAFT TYPE — normalized model name only (C-172, C-152, PA-34-200T etc). No registration numbers, phone numbers, or garbled text. If unrecognizable use last valid aircraft seen.\n- Column C: Value directly below the DUAL RECEIVED header for this row → combine sub-cells as LEFT.RIGHT decimal. Dash or blank = 0.\n- Column D: Value directly below the PILOT IN COMMAND header for this row → combine sub-cells as LEFT.RIGHT decimal. Dash or blank = 0.\n- Column E: Value directly below the SOLO header for this row (typeA only) → combine sub-cells as LEFT.RIGHT decimal. Dash or blank = 0.\n- Column F: Value directly below the TOTAL DURATION header for this row → combine sub-cells as LEFT.RIGHT decimal.\n\nCRITICAL — COLUMN POSITION MATTERS:\nBefore reading any row values, first locate the exact horizontal position of each column header on the right page:\n- Find the header text 'DUAL RECEIVED' — note its horizontal position. Any value directly below this header = dualReceived\n- Find the header text 'PILOT IN COMMAND' (or 'PILOT IN COMMAND INCL. SOLO') — note its horizontal position. Any value directly below this header = pilotInCommand\n- Find the header text 'SOLO' if present — note its horizontal position. Any value directly below this header = solo\n\nFor each flight row, look at WHERE the non-zero value appears horizontally:\n- If the value is positioned under the DUAL RECEIVED header → it is dualReceived\n- If the value is positioned under the PILOT IN COMMAND header → it is pilotInCommand\n- If the value is positioned under the SOLO header → it is solo\nA dash (-) or blank under any header = 0 for that field\n\nDo NOT assume all hours are Dual. Do NOT assume all hours are PIC. The column header above the value is the only thing that determines the flight type.\n\nSTEP 7 — CROSS-CHECK EACH ROW BEFORE ASSIGNING:\nFor each row, before writing any output, perform this mandatory cross-check:\n\n1. Look at Column C (DUAL). Does it have a real decimal number or a dash/blank?\n2. Look at Column D (PIC). Does it have a real decimal number or a dash/blank?\n3. Apply this logic:\n   - Column C has number AND Column D has dash → dualReceived = C value, pilotInCommand = 0\n   - Column C has dash AND Column D has number → pilotInCommand = D value, dualReceived = 0\n   - Column C has dash AND Column D has dash → skip this row, no flight hours\n   - BOTH columns appear to have numbers → look again more carefully. One of them MUST be a dash. The dash may look faint or be hard to see — but it is there. Re-examine and pick the correct one.\n\n4. SELF CHECK: After assigning, confirm: "The column I did NOT assign — does it have a dash or blank?" If yes, assignment is correct. If no, re-examine.\n\nSTEP 8 — EXTRACT OUTPUT:\nFor each verified row:\n- date = Column A in YYYY-MM-DD format\n- aircraft = Column B normalized\n- dualReceived = Column C value (or 0)\n- pilotInCommand = Column D value (or 0)\n- solo = Column E value (or 0, typeA only)\n- duration = Column F value\n- NEVER add columns together\n- NEVER guess or redistribute hours\n- Read each decimal number by combining the two sub-cells: LEFT cell = whole hours, RIGHT cell = tenths\n- 1 and 3 = 1.3, 1 and 8 = 1.8, 1 and 0 = 1.0, 1 and 6 = 1.6\n\nSTEP 9 — NORMALIZE AIRCRAFT TYPE:\n- Standard model names only: C-172, C-152, PA-28, PA-34-200T, etc.\n- Remove registration numbers, phone numbers, FAA cert numbers, random digit strings\n- If garbled → use last valid aircraft seen on that page\n- If completely unknown → use "Unknown"\n\nYou MUST always include logbookFormat in your response. Never omit it.\n\nReturn a mentalTable array showing every row from Step 6 — the raw date, aircraft, and exact values you read from columns C, D, E, and F before any filtering. This is required for debugging.`
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
