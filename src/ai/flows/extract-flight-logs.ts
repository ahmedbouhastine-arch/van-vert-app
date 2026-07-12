'use server';
import 'server-only';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { PDFDocument } from 'pdf-lib';
import { z } from 'zod';

const client = new DocumentProcessorServiceClient();
const PROCESSOR_NAME = 'projects/studio-5434730977-5c28e/locations/us/processors/47422f02bcaec722/processorVersions/1e5684bc4378fc3e';
const DOC_AI_PAGE_LIMIT = 15;

const ExtractFlightLogsInputSchema = z.object({
  flightLogPdf: z.string().optional(),
  storagePath: z.string().optional(),
});
export type ExtractFlightLogsInput = z.infer<typeof ExtractFlightLogsInputSchema>;

const FlightLogEntrySchema = z.object({
  date: z.string(),
  aircraft: z.string(),
  duration: z.number(),
  dualReceived: z.number().optional().default(0),
  pilotInCommand: z.number().optional().default(0),
  solo: z.number().optional().default(0),
  instrumentSimulatedHours: z.number().optional().default(0),
});

const ExtractFlightLogsOutputSchema = z.object({
  flights: z.array(FlightLogEntrySchema),
  logbookFormat: z.enum(['typeA', 'typeB', 'simple']),
});
export type ExtractFlightLogsOutput = z.infer<typeof ExtractFlightLogsOutputSchema>;

/**
 * Splits a PDF into chunks of at most `maxPages` pages.
 * Returns an array of base64-encoded PDF chunks and the total page count.
 */
async function splitPdfIntoChunks(pdfBytes: Uint8Array, maxPages: number): Promise<{ chunks: string[]; totalPages: number }> {
  const srcDoc = await PDFDocument.load(pdfBytes);
  const totalPages = srcDoc.getPageCount();

  if (totalPages <= maxPages) {
    return {
      chunks: [Buffer.from(pdfBytes).toString('base64')],
      totalPages,
    };
  }

  const chunks: string[] = [];
  for (let start = 0; start < totalPages; start += maxPages) {
    const end = Math.min(start + maxPages, totalPages);
    const chunkDoc = await PDFDocument.create();
    const copiedPages = await chunkDoc.copyPages(srcDoc, Array.from({ length: end - start }, (_, i) => start + i));
    copiedPages.forEach(page => chunkDoc.addPage(page));
    const chunkBytes = await chunkDoc.save();
    chunks.push(Buffer.from(chunkBytes).toString('base64'));
  }

  return { chunks, totalPages };
}

/**
 * Processes a PDF through Document AI, automatically chunking if it exceeds the page limit.
 * Returns merged entities with corrected page indexes.
 */
async function processDocumentChunked(pdfBytes: Uint8Array) {
  const { chunks, totalPages } = await splitPdfIntoChunks(pdfBytes, DOC_AI_PAGE_LIMIT);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allEntities: any[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const pageOffset = i * DOC_AI_PAGE_LIMIT;

    const [result] = await client.processDocument({
      name: PROCESSOR_NAME,
      rawDocument: {
        content: chunks[i],
        mimeType: 'application/pdf',
      },
    });

    const entities = result.document?.entities ?? [];

    // Offset page indexes so they reference the original PDF's page numbers
    for (const entity of entities) {
      if (pageOffset > 0 && entity.pageAnchor?.pageRefs) {
        for (const ref of entity.pageAnchor.pageRefs) {
          ref.page = Number(ref.page ?? 0) + pageOffset;
        }
      }
      allEntities.push(entity);
    }
  }

  return allEntities;
}

function parseDocumentAIDate(rawDate: string, year?: string): string {
  if (!rawDate) return '';

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) return rawDate;

  // Format: "02 16" or "0216" → month=02, day=16
  const spaceMatch = rawDate.match(/^(\d{1,2})\s+(\d{1,2})$/);
  if (spaceMatch) {
    const month = spaceMatch[1].padStart(2, '0');
    const day = spaceMatch[2].padStart(2, '0');
    const y = year ?? new Date().getFullYear().toString();
    return `${y}-${month}-${day}`;
  }

  // Format: "216" or "0216" → month=02, day=16
  const compactMatch = rawDate.match(/^(\d{1,2})(\d{2})$/);
  if (compactMatch) {
    const month = compactMatch[1].padStart(2, '0');
    const day = compactMatch[2].padStart(2, '0');
    const y = year ?? new Date().getFullYear().toString();
    return `${y}-${month}-${day}`;
  }

  // Format: "02/16" or "02-16"
  const slashMatch = rawDate.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (slashMatch) {
    const month = slashMatch[1].padStart(2, '0');
    const day = slashMatch[2].padStart(2, '0');
    const y = year ?? new Date().getFullYear().toString();
    return `${y}-${month}-${day}`;
  }

  return '';
}

function normalizeAircraft(raw: string): string {
  if (!raw) return 'Unknown';
  return raw
    .replace(/^\(-/, 'C-')   // "(-172" → "C-172"
    .replace(/^0-/, 'C-')    // "0-172" → "C-172"
    .replace(/^c-/i, 'C-')   // normalize lowercase
    .trim();
}

function parseHours(raw: string): number {
  if (!raw || raw === '-') return 0;
  const trimmed = raw.trim();

  // Single digit "0" → 0.0 not a standalone value to skip
  if (trimmed === '0') return 0;

  // Already a proper decimal like "1.3"
  if (/^\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed);

  // Two numbers separated by space, newline, or tab: "1 3" → 1.3, "0 8" → 0.8
  const parts = trimmed.split(/[\s\n\t]+/);
  if (parts.length === 2) {
    const whole = parseInt(parts[0]) || 0;
    const tenths = parseInt(parts[1]) || 0;
    return parseFloat(`${whole}.${tenths}`);
  }

  // Single compact number like "13" → 1.3, "08" → 0.8, "16" → 1.6
  // Rule: if 2 digits, first digit = whole hours, second digit = tenths
  if (/^\d{2}$/.test(trimmed)) {
    const whole = parseInt(trimmed[0]);
    const tenths = parseInt(trimmed[1]);
    return parseFloat(`${whole}.${tenths}`);
  }

  // Single digit like "8" → 0.8, "1" → could be 1.0
  // If single digit and <= 8, treat as tenths only (0.X)
  if (/^\d$/.test(trimmed)) {
    const digit = parseInt(trimmed);
    if (digit <= 8) return parseFloat(`0.${digit}`);
    return digit;
  }

  return 0;
}

function inferMissingDate(lastDate: string, nextDate: string): string {
  if (!lastDate) return '';

  const last = new Date(lastDate);
  const lastDay = last.getDate();
  const lastMonth = last.getMonth(); // 0-indexed
  const lastYear = last.getFullYear();

  // If we have a next valid date, infer based on range
  if (nextDate) {
    const next = new Date(nextDate);
    const nextDay = next.getDate();

    // Missing date is between lastDate and nextDate
    // Guess the midpoint day in the same month/year as last
    if (lastDay >= 0 && lastDay <= 9 && nextDay >= 10 && nextDay <= 19) {
      // Missing is likely in the 1x range
      const guessDay = Math.round((lastDay + nextDay) / 2);
      const guessed = new Date(lastYear, lastMonth, guessDay);
      return guessed.toISOString().split('T')[0];
    }
    if (lastDay >= 10 && lastDay <= 19 && nextDay >= 20 && nextDay <= 29) {
      const guessDay = Math.round((lastDay + nextDay) / 2);
      const guessed = new Date(lastYear, lastMonth, guessDay);
      return guessed.toISOString().split('T')[0];
    }
    if (lastDay >= 20 && lastDay <= 29 && nextDay >= 30) {
      const guessDay = Math.round((lastDay + nextDay) / 2);
      const guessed = new Date(lastYear, lastMonth, guessDay);
      return guessed.toISOString().split('T')[0];
    }
  }

  // Cannot confidently infer — return empty string so user fixes manually
  // But still keep the year and month so the UI can show "Unknown day, February 2019"
  const monthYear = `${lastYear}-${String(lastMonth + 1).padStart(2, '0')}-00`;
  return monthYear;
}

export async function extractFlightLogs(input: ExtractFlightLogsInput): Promise<ExtractFlightLogsOutput> {
  const mediaUrl = input.storagePath || input.flightLogPdf;
  if (!mediaUrl) throw new Error('No PDF source provided.');

  const response = await fetch(mediaUrl);
  const arrayBuffer = await response.arrayBuffer();
  const pdfBytes = new Uint8Array(arrayBuffer);

  const entities = await processDocumentChunked(pdfBytes);
  if (entities.length === 0) return { flights: [], logbookFormat: 'simple' };

  type RowData = {
    date?: string;
    aircraft?: string;
    dualReceived?: number;
    pilotInCommand?: number;
    instrumentSimulatedHours?: number;
    solo?: number;
    year?: string;
    pageIndex?: number;
    yPos?: number;
  };

  const pageYearMap = new Map<number, string>();
  for (const entity of entities) {
    if (entity.type === 'year') {
      const pageIndex = Number(entity.pageAnchor?.pageRefs?.[0]?.page ?? 0);
      pageYearMap.set(pageIndex, entity.mentionText?.trim() ?? '');
    }
  }

  const rowMap: Map<string, RowData> = new Map();

  for (const entity of entities) {
    const value = entity.mentionText?.trim() ?? '';
    if (!value || value === '-') continue;

    const pageRef = entity.pageAnchor?.pageRefs?.[0];
    const pageIndex = Number(pageRef?.page ?? 0);
    const yPos = pageRef?.boundingPoly?.normalizedVertices?.[0]?.y ?? 0;

    const yKey = `${pageIndex}_${Math.round(yPos * 50)}`;

    if (!rowMap.has(yKey)) rowMap.set(yKey, { pageIndex, yPos });
    const row = rowMap.get(yKey)!;

    switch (entity.type) {
      case 'Date':
        row.date = value;
        break;
      case 'year':
        row.year = value;
        break;
      case 'aircraft_type':
        row.aircraft = value;
        break;
      case 'dual_hours':
        row.dualReceived = parseHours(value);
        break;
      case 'PIC_hours_solo_incl':
        row.pilotInCommand = parseHours(value);
        break;
      case 'instrument_hours':
        row.instrumentSimulatedHours = parseHours(value);
        break;
      case 'solo_incl':
        row.solo = parseHours(value);
        break;
    }
  }

  const hasPicInclSolo = entities.some(e => e.type === 'PIC_hours_solo_incl');
  const hasSoloInclText = entities.some(e => e.type === 'solo_incl');

  // solo_incl entity means the logbook header says "INCL. SOLO" → typeB
  // If no solo_incl text but has PIC column → typeA (separate columns)
  // If neither → simple
  const logbookFormat = hasSoloInclText ? 'typeB' : hasPicInclSolo ? 'typeA' : 'simple';

  const currentYear = new Date().getFullYear();
  
  const allMapped = Array.from(rowMap.values())
    .sort((a, b) => (a.pageIndex ?? 0) - (b.pageIndex ?? 0) || (a.yPos ?? 0) - (b.yPos ?? 0))
    .map(row => ({
      date: parseDocumentAIDate(row.date ?? '', row.year ?? pageYearMap.get(row.pageIndex ?? 0)),
      aircraft: normalizeAircraft(row.aircraft ?? 'Unknown'),
      duration: (row.dualReceived ?? 0) + (row.pilotInCommand ?? 0) + (row.solo ?? 0),
      dualReceived: row.dualReceived ?? 0,
      pilotInCommand: row.pilotInCommand ?? 0,
      solo: row.solo ?? 0,
      instrumentSimulatedHours: row.instrumentSimulatedHours ?? 0,
    }));

  // Carry forward missing dates
  let lastValidDate = '';
  const flightsWithDates = allMapped.map((f, index) => {
    if (f.date) {
      lastValidDate = f.date;
      return f;
    }

    // Look ahead for next valid date
    const nextValidDate = allMapped.slice(index + 1).find(r => !!r.date)?.date ?? '';
    const inferredDate = inferMissingDate(lastValidDate, nextValidDate);

    return { ...f, date: inferredDate };
  });

  const flights = flightsWithDates.filter(f => {
    const dateValid =
      // Normal valid date
      (/^\d{4}-\d{2}-\d{2}$/.test(f.date) &&
      !isNaN(new Date(f.date).getTime()) &&
      new Date(f.date).getFullYear() >= 1990 &&
      new Date(f.date).getFullYear() <= currentYear)
      ||
      // Unknown day date like "2019-02-00"
      /^\d{4}-\d{2}-00$/.test(f.date);
    return dateValid && f.duration > 0;
  });

  return { flights, logbookFormat };
}
