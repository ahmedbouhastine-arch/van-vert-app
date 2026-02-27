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
              text: `You are an expert aviation data extraction system analyzing a scanned pilot logbook PDF.\nIMPORTANT: All flight hours in this logbook are in DECIMAL format. 1.3 means one point three hours (1 hour 18 minutes). 1.8 means one point eight hours. Never interpret these as whole numbers. Never add digits together. Read each number exactly as written.\nSTEP 1 — BUILD A MENTAL TABLE:\nBefore extracting anything, scan the entire page spread and build an internal table in your mind with these columns in order:\n\nColumn A: DATE — from the left page, reading down every row that has a flight entry\nColumn B: AIRCRAFT TYPE — from the left page, the aircraft model next to each date. Normalize to standard model names only (e.g. C-172, C-152, PA-34-200T). Never include registration numbers, phone numbers, or garbled text.\nColumn C: DUAL RECEIVED hours — from the right page, the value in the Dual Received column for that row\nColumn D: PILOT IN COMMAND hours — from the right page, the value in the PIC column for that row\nColumn E: SOLO hours — from the right page, the value in the Solo column for that row (if it exists)\n\nThe rows on the LEFT page and the RIGHT page are aligned by position — row 1 on the left matches row 1 on the right, row 2 matches row 2, and so on.\nSTEP 2 — DETECT LOGBOOK FORMAT:\nLook at the column headers on the right page:\n\ntypeA: Has separate DUAL RECEIVED, PILOT IN COMMAND, and SOLO columns\ntypeB: Has DUAL RECEIVED and a combined PILOT IN COMMAND (INCL. SOLO) column — no separate SOLO column\nsimple: Only has a single total duration column\n\nSTEP 3 — FOR EACH ROW IN YOUR MENTAL TABLE:\nLook at columns C, D, and E for that row:\n\nExactly ONE of these columns will have a non-zero decimal number\nThe other columns will be blank, a dash (-), or zero\nThe column that has the value tells you the flight type:\n\nColumn C has value → dualReceived = that value, pilotInCommand = 0, solo = 0, badge = Dual\nColumn D has value → pilotInCommand = that value, dualReceived = 0, solo = 0, badge = PIC\nColumn E has value → solo = that value, dualReceived = 0, pilotInCommand = 0, badge = Solo\n\n\nThe duration field = the total flight time from the TOTAL DURATION column on the right page\nNEVER add values from multiple columns together\nNEVER guess or redistribute hours\nRead each decimal number exactly as written — 1.3 is 1.3, not 3, not 13\n\nSTEP 4 — IGNORE:\n\nAll summary/total rows: TOTALS THIS PAGE, AMT. FORWARDED, TOTALS TO DATE, AMOUNT BROUGHT FORWARD\nAny row without a date and aircraft\nThe instructor certification section if present\n\nSTEP 5 — READ THE YEAR:\nThe year is printed vertically along the left margin (e.g. "FEBRUARY-2019"). Use this year for ALL entries on that page. Dates are day/month only — combine with the year to form YYYY-MM-DD.\nYou MUST always include logbookFormat in your response. Never omit it.\nAlso return a mentalTable array showing every row you built in Step 1 — the raw date, aircraft, and exact values you read from columns C, D, E, and total duration, before any filtering. This is required for debugging.`
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
