
'use server';
import 'server-only';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { z } from 'zod';

const client = new DocumentProcessorServiceClient();
const PROCESSOR_NAME = 'projects/REDACTED_FIREBASE_SENDER_ID/locations/us/processors/47422f02bcaec722/processorVersions/1e5684bc4378fc3e';

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

export async function extractFlightLogs(input: ExtractFlightLogsInput): Promise<ExtractFlightLogsOutput> {
  const mediaUrl = input.storagePath || input.flightLogPdf;
  if (!mediaUrl) throw new Error('No PDF source provided.');

  const response = await fetch(mediaUrl);
  const arrayBuffer = await response.arrayBuffer();
  const encodedContent = Buffer.from(arrayBuffer).toString('base64');

  const [result] = await client.processDocument({
    name: PROCESSOR_NAME,
    rawDocument: {
      content: encodedContent,
      mimeType: 'application/pdf',
    },
  });

  const entities = result.document?.entities ?? [];
  if (entities.length === 0) return { flights: [], logbookFormat: 'simple' };

  console.log('Total entities from Document AI:', entities.length);
  console.log('Entity types found:', [...new Set(entities.map(e => e.type))]);

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
        row.dualReceived = parseFloat(value) || 0;
        break;
      case 'PIC_hours_solo_incl':
        row.pilotInCommand = parseFloat(value) || 0;
        break;
      case 'instrument_hours':
        row.instrumentSimulatedHours = parseFloat(value) || 0;
        break;
      case 'solo_incl':
        row.solo = parseFloat(value) || 0;
        break;
    }
  }

  const hasPicInclSolo = entities.some(e => e.type === 'PIC_hours_solo_incl');
  const hasSeparateSolo = entities.some(e => e.type === 'solo_incl');
  const logbookFormat = hasSeparateSolo ? 'typeA' : hasPicInclSolo ? 'typeB' : 'simple';

  console.log('Detected logbook format:', logbookFormat);

  const currentYear = new Date().getFullYear();
  const flights = Array.from(rowMap.values())
    .sort((a, b) => (a.pageIndex ?? 0) - (b.pageIndex ?? 0) || (a.yPos ?? 0) - (b.yPos ?? 0))
    .map(row => ({
      date: parseDocumentAIDate(row.date ?? '', row.year ?? pageYearMap.get(row.pageIndex ?? 0)),
      aircraft: row.aircraft ?? 'Unknown',
      duration: (row.dualReceived ?? 0) + (row.pilotInCommand ?? 0) + (row.solo ?? 0),
      dualReceived: row.dualReceived ?? 0,
      pilotInCommand: row.pilotInCommand ?? 0,
      solo: row.solo ?? 0,
      instrumentSimulatedHours: row.instrumentSimulatedHours ?? 0,
    }))
    .filter(f => {
      const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(f.date) &&
        !isNaN(new Date(f.date).getTime()) &&
        new Date(f.date).getFullYear() >= 1990 &&
        new Date(f.date).getFullYear() <= currentYear;
      return dateValid && f.duration > 0;
    });

  console.log(`Built ${flights.length} flights from Document AI entities`);
  console.log('Sample flights:', JSON.stringify(flights.slice(0, 3), null, 2));

  return { flights, logbookFormat };
}
