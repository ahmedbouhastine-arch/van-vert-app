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
              text: `You are an expert aviation data extraction system analyzing a scanned pilot logbook PDF.\n\nCRITICAL — UNDERSTANDING DECIMAL FLIGHT HOURS:\nAll flight times in this logbook are recorded in decimal hours.\n- 1.3 = one point three hours — the COMPLETE number is 1.3, not 3, not 1\n- 1.8 = one point eight hours — the COMPLETE number is 1.8, not 8, not 1\n- Some logbooks write hours and tenths in two separate sub-cells side by side (e.g. '1' and '3' in adjacent cells) — these TWO cells together form ONE decimal number: 1.3. Never read them as separate numbers. Never add them. Never use just one of them.\n- Always combine the two sub-cells as: LEFT cell = whole hours, RIGHT cell = tenths. Result = LEFT.RIGHT (e.g. 1 and 3 = 1.3, 1 and 8 = 1.8, 1 and 0 = 1.0)\n- A value of just '3' in a cell that should be decimal hours is almost certainly the tenths part of 1.3 — look at the adjacent cell to find the whole hours part\n- Individual flight hours are always between 0.3 and 8.0 — if you see a value above 20 you are reading a totals row by mistake, stop and skip it\n\nSTEP 1 — UNDERSTAND THE PAGE LAYOUT:\nEach PDF page shows a two-page logbook spread photographed open:\n- LEFT PAGE: Contains flight details — DATE, AIRCRAFT TYPE, AIRCRAFT IDENT, FROM, TO, REMARKS columns. The year is printed vertically along the left margin (e.g. "FEBRUARY-2019").\n- RIGHT PAGE: Contains the flight time breakdown columns — DUAL RECEIVED, PILOT IN COMMAND (INCL. SOLO), and TOTAL DURATION OF FLIGHT.\n- The rows on the LEFT page and RIGHT page are aligned by position — row 1 on the left matches row 1 on the right, row 2 matches row 2, and so on.\n\nSTEP 2 — IDENTIFY THE BOUNDARIES OF VALID FLIGHT DATA:\nBefore reading anything, identify what to ignore:\n- IGNORE the last 3 rows of the right page — these are ALWAYS summary rows: TOTALS THIS PAGE, AMT. FORWARDED, TOTALS TO DATE. Never read these rows.\n- IGNORE the last 2 columns on the far right of the right page — these are always cumulative running total columns, not individual flight data.\n- IGNORE any row on the left page that has no date.\n- IGNORE the first row if it says "AMOUNT BROUGHT FORWARD" — this is a carry-forward total, not a flight.\n- IGNORE any instructor certification or endorsement text that appears on either page.\n- Only read rows that have a DATE on the left page and are NOT in the last 3 rows of the right page.\n\nSTEP 3 — READ THE YEAR:\nThe year is printed vertically along the left margin of the left page (e.g. "FEBRUARY-2019"). Use this year for ALL flight entries on that page. Dates in the DATE column contain only day and month (e.g. "02/04" = February 4th) — combine with the page year to form YYYY-MM-DD.\n\nSTEP 4 — DETECT LOGBOOK FORMAT:\nLook at the column headers on the RIGHT page (excluding the last 2 columns):\n- typeA: Has separate DUAL RECEIVED, PILOT IN COMMAND, and SOLO columns\n- typeB: Has DUAL RECEIVED and a combined PILOT IN COMMAND (INCL. SOLO) column — no separate SOLO column\n- simple: Only has a single total duration column\n\nSTEP 5 — BUILD A MENTAL TABLE:\nBefore extracting anything, build an internal table row by row, reading TOP TO BOTTOM only. Never read bottom to top. Stop when you reach the last 3 rows:\n- Column A: DATE — from the left page, reading down every row that has a flight entry\n- Column B: AIRCRAFT TYPE — normalized model name only (e.g. C-172, C-152, PA-34-200T). Never include registration numbers, phone numbers, instructor names, or garbled text. If unrecognizable, use the last valid aircraft seen.\n- Column C: DUAL RECEIVED hours — from the right page, combine the two sub-cells as LEFT.RIGHT to form the decimal number (e.g. '1' and '3' = 1.3). A dash (-) or blank = 0.\n- Column D: PILOT IN COMMAND hours — from the right page, combine the two sub-cells as LEFT.RIGHT to form the decimal number. A dash (-) or blank = 0.\n- Column E: SOLO hours — from the right page, combine the two sub-cells as LEFT.RIGHT to form the decimal number. Only for typeA logbooks. A dash (-) or blank = 0.\n- Column F: TOTAL DURATION — from the right page, combine the two sub-cells as LEFT.RIGHT to form the decimal number.\n\nCRITICAL — COLUMN POSITION MATTERS:\nBefore reading any row values, first locate the exact horizontal position of each column header on the right page:\n- Find the header text 'DUAL RECEIVED' — note its horizontal position. Any value directly below this header = dualReceived\n- Find the header text 'PILOT IN COMMAND' (or 'PILOT IN COMMAND INCL. SOLO') — note its horizontal position. Any value directly below this header = pilotInCommand\n- Find the header text 'SOLO' if present — note its horizontal position. Any value directly below this header = solo\n\nFor each flight row, look at WHERE the non-zero value appears horizontally:\n- If the value is positioned under the DUAL RECEIVED header → it is dualReceived\n- If the value is positioned under the PILOT IN COMMAND header → it is pilotInCommand\n- If the value is positioned under the SOLO header → it is solo\nA dash (-) or blank under any header = 0 for that field\n\nDo NOT assume all hours are Dual. Do NOT assume all hours are PIC. The column header above the value is the only thing that determines the flight type.\n\nThe rows on the LEFT page and the RIGHT page are aligned by position — row 1 on the left matches row 1 on the right, row 2 matches row 2, and so on.\nSTEP 6 — EXTRACT EACH FLIGHT ROW:\nFor each row in your mental table:\n- Look at columns C, D, and E independently\n- A dash (-) or blank cell means zero — do not read it as a number\n- Exactly ONE column will have a non-zero decimal number per flight row\n- The column that has the value tells you the flight type:\n  - Column C has value → dualReceived = that value, pilotInCommand = 0, solo = 0\n  - Column D has value → pilotInCommand = that value, dualReceived = 0, solo = 0\n  - Column E has value → solo = that value, dualReceived = 0, pilotInCommand = 0\n- The duration field = Column F value\n- NEVER add values from multiple columns together\n- NEVER guess or redistribute hours\n- Read each decimal number by combining the two sub-cells: LEFT cell = whole hours, RIGHT cell = tenths\n- 1 and 3 = 1.3, 1 and 8 = 1.8, 1 and 0 = 1.0, 1 and 6 = 1.6\n\nSTEP 7 — NORMALIZE AIRCRAFT TYPE:\n- Only use standard model names: C-172, C-152, PA-28, PA-34-200T, etc.\n- Remove any registration numbers, phone numbers, FAA cert numbers, or random digit strings\n- If the aircraft cell looks garbled or contains non-model text, default to the last valid aircraft model seen on that page\n- If no valid model can be determined, use "Unknown"\n\nYou MUST always include logbookFormat in your response. Never omit it.\n\nAlso return a mentalTable array showing every row you built in Step 5 — the raw date, aircraft, and exact values you read from columns C, D, E, and F before any filtering. This is required for debugging.`
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
