'use server';
import 'server-only';

import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';
import { z } from 'zod';

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from 'canvas';
import { Buffer } from 'buffer'; 


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

// Configure PDF.js worker (important for Node.js)
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.mjs';

const ai = genkit({ plugins: [vertexAI({ projectId: 'REDACTED_FIREBASE_PROJECT_ID', location: 'us-central1' })] });

export async function extractFlightLogs(input: ExtractFlightLogsInput): Promise<ExtractFlightLogsOutput> {
  const mediaUrl = input.flightLogPdf || input.storagePath;
  if (!mediaUrl) throw new Error("No PDF source provided.");

  let pdfBuffer: Buffer;
  if (mediaUrl.startsWith('data:application/pdf;base64,')) {
    pdfBuffer = Buffer.from(mediaUrl.split(',')[1], 'base64');
  } else {
    // Assuming mediaUrl is a publicly accessible URL for now.
    // In a real Firebase Storage scenario, this URL might need authentication.
    const response = await fetch(mediaUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF from storage: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    pdfBuffer = Buffer.from(arrayBuffer);
  }

  const loadingTask = pdfjsLib.getDocument(pdfBuffer);
  const pdfDocument = await loadingTask.promise;

  let allExtractedFlights: (typeof FlightLogEntrySchema)[] = [];
  let detectedLogbookFormat: (typeof ExtractFlightLogsOutputSchema._def.shape.logbookFormat.options)[number] = 'simple';

  const basePromptText = `You are an expert aviation data extraction system analyzing a scanned pilot logbook spread — two physical pages photographed open side by side.
STEP 1 — UNDERSTAND THE PAGE SPREAD LAYOUT:
This image shows a single scanned page or a two-page spread of a pilot logbook.

LEFT PAGE: Contains flight details — DATE, AIRCRAFT TYPE, AIRCRAFT IDENT, FROM, TO, REMARKS, and some basic columns. The year is printed vertically along the left margin (e.g., "FEBRUARY-2019").
RIGHT PAGE: Contains the flight time breakdown columns — DUAL RECEIVED, PILOT IN COMMAND (INCL. SOLO), SOLO, and TOTAL DURATION OF FLIGHT. The rows on the right page correspond directly to the rows on the left page — they are the same flights, just continued across the page spread.

You must read BOTH pages together. Match each flight row from the left page with its corresponding hour data on the right page by row position.
STEP 2 — READ THE YEAR:
The year is printed vertically along the left margin of the left page (e.g., "FEBRUARY-2019"). Use this year for ALL flight entries on that spread. The DATE column contains only day and month (e.g., "02/04" = February 4th) — combine with the page year to form YYYY-MM-DD.
STEP 3 — DETECT LOGBOOK FORMAT by reading the column headers on the RIGHT page:

typeA: Separate columns for DUAL RECEIVED, PILOT IN COMMAND, and SOLO
typeB: DUAL RECEIVED column and a combined PILOT IN COMMAND column that includes solo (e.g., "PILOT IN COMMAND INCL. SOLO"). No separate SOLO column.
simple: Only a single total duration column, no breakdown by type

STEP 4 — NORMALIZE AIRCRAFT TYPE:
When reading the AIRCRAFT TYPE column, clean and normalize the value:

Only extract the standard aircraft model name (e.g., "C-172", "PA-34-200T", "C-152")
Remove any telephone numbers, registration numbers, instructor names, certification codes, or any other non-aircraft-model text
If the value looks garbled or unrecognizable as an aircraft model, default to the most recently seen valid aircraft model on that page
If no valid aircraft model can be determined at all, use "Unknown"
Never include telephone numbers, FAA certificate numbers, or random digit strings in the aircraft field

STEP 5 — EXTRACT EACH FLIGHT ROW by combining data from both pages:
For each row that has a date, aircraft, and duration:

Get the date and aircraft from the LEFT page
Get the hour breakdown from the RIGHT page by matching row position
If the value is in the DUAL RECEIVED column → set dualReceived to that value, set pilotInCommand and solo to 0
If the value is in the PILOT IN COMMAND column → set pilotInCommand to that value, set dualReceived and solo to 0
If the value is in the SOLO column → set solo to that value, set dualReceived and pilotInCommand to 0
A single flight row will NEVER have hours in more than one column. Never redistribute or guess hours.
If a cell is empty, a dash (-), or blank → that field is 0
The duration field is the TOTAL DURATION OF FLIGHT column value from the right page

STEP 6 — IGNORE all summary/total rows (TOTALS THIS PAGE, AMT. FORWARDED, TOTALS TO DATE, AMOUNT BROUGHT FORWARD). Extract only individual flight rows.
You MUST always include the logbookFormat field in your response. It is required. Choose one of: typeB if the logbook has a combined PIC (including solo) column, typeA if PIC and Solo are separate columns, or simple if the logbook has minimal column detail. Never omit this field.`;


  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const viewport = page.getViewport({ scale: 2 }); // Scale up for better OCR
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    const pageImage = canvas.toDataURL('image/png'); // Get base64 PNG image

    let lastError: unknown; // Reset lastError for each page attempt
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const res = await ai.generate({
            model: 'vertexai/gemini-2.0-flash',
            prompt: [
              {
                text: basePromptText,
              },
              { media: { url: pageImage, contentType: 'image/png' } }
            ],
            output: { schema: ExtractFlightLogsOutputSchema },
            config: {
              temperature: 0.1,
            }
        });

        const output = res.output;
        if (!output) {
          // If a page returns no output, it might just be a blank page or unreadable.
          // Continue to the next page without adding flights, but keep logbookFormat as simple if not detected.
          continue;
        }

        if (!output?.logbookFormat) {
          output.logbookFormat = 'simple';
        }

        const parsed = ExtractFlightLogsOutputSchema.parse(output as unknown);

        // Merge flights
        allExtractedFlights = allExtractedFlights.concat(parsed.flights);

        // Keep the first non-simple logbook format detected
        if (detectedLogbookFormat === 'simple' && parsed.logbookFormat !== 'simple') {
          detectedLogbookFormat = parsed.logbookFormat;
        }
        break; // Break from retry loop if successful
      } catch (error: unknown) {
        lastError = error;
        const isRateLimit = error instanceof Error && error.message.includes('429');
        if (isRateLimit && attempt < 5) {
          const delay = attempt * 8000; // 8s, 16s, 24s, 32s
          console.log(`Rate limited for page ${i}, retrying in ${delay}ms (attempt ${attempt}/5)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        // If it's not a rate limit or all retries exhausted, rethrow
        throw error;
      }
    }
  }

  // Final filtering and return
  const currentYear = new Date().getFullYear();
  const filteredFlights = allExtractedFlights.filter((log) => {
    const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(log.date) && 
      !isNaN(new Date(log.date).getTime()) &&
      new Date(log.date).getFullYear() >= 1990 &&
      new Date(log.date).getFullYear() <= currentYear;
    return dateValid && !!log.aircraft && typeof log.duration === 'number' && log.duration > 0;
  });

  return {
    flights: filteredFlights,
    logbookFormat: detectedLogbookFormat,
  };
}

function getErrorMessage(err: unknown): string {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  const e = err as { message?: unknown };
  if (typeof e.message === 'string') return e.message;
  return 'An unexpected error occurred';
}
