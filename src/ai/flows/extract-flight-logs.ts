'use server';
import 'server-only';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { PDFDocument } from 'pdf-lib';
import { z } from 'zod';
import { checkAndCorrect, AIRCRAFT_RULE, DECIMAL_HOURS_RULE, HM_HOURS_RULE, DATE_RULE } from '@/lib/field-validation';

const client = new DocumentProcessorServiceClient();
const PROJECT = 'studio-5434730977-5c28e';
const LOCATION = 'us';
const DOC_AI_PAGE_LIMIT = 15;

export type LogbookFormat = 'SI-HM' | 'SI-DEC' | 'S-HM' | 'S-DEC';

// Fill in each processor's ID as it finishes training in Document AI Workbench.
const PROCESSOR_IDS: Record<LogbookFormat, string | null> = {
  'SI-HM': 'TODO_PASTE_PROCESSOR_ID', // <- fill in once training finishes
  'SI-DEC': null,
  'S-HM': null,
  'S-DEC': null,
};

function processorName(format: LogbookFormat): string {
  const id = PROCESSOR_IDS[format];
  if (!id) throw new Error(`No trained processor yet for format "${format}".`);
  return `projects/${PROJECT}/locations/${LOCATION}/processors/${id}`;
}

const FlightLogEntrySchema = z.object({
  date: z.string(),
  aircraft: z.string(),
  duration: z.number(),
  dualReceived: z.number().optional().default(0),
  pilotInCommand: z.number().optional().default(0),
  solo: z.number().optional().default(0),
  instrumentSimulatedHours: z.number().optional().default(0),
  needsReview: z.boolean().optional().default(false),
  flaggedFields: z.array(z.string()).optional().default([]),
});

const ExtractFlightLogsOutputSchema = z.object({
  flights: z.array(FlightLogEntrySchema),
  logbookFormat: z.enum(['SI-HM', 'SI-DEC', 'S-HM', 'S-DEC']),
});
export type ExtractFlightLogsOutput = z.infer<typeof ExtractFlightLogsOutputSchema>;

async function splitPdfIntoChunks(pdfBytes: Uint8Array, maxPages: number) {
  const srcDoc = await PDFDocument.load(pdfBytes);
  const totalPages = srcDoc.getPageCount();
  if (totalPages <= maxPages) return { chunks: [Buffer.from(pdfBytes).toString('base64')], totalPages };
  const chunks: string[] = [];
  for (let start = 0; start < totalPages; start += maxPages) {
    const end = Math.min(start + maxPages, totalPages);
    const chunkDoc = await PDFDocument.create();
    const copied = await chunkDoc.copyPages(srcDoc, Array.from({ length: end - start }, (_, i) => start + i));
    copied.forEach(p => chunkDoc.addPage(p));
    chunks.push(Buffer.from(await chunkDoc.save()).toString('base64'));
  }
  return { chunks, totalPages };
}

const MONTH_MAP: Record<string, string> = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
  JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
};
function buildDate(year: string, month: string, day: string): string {
  const mm = MONTH_MAP[month.trim().toUpperCase().slice(0, 3)] ?? '';
  const dd = day.trim().padStart(2, '0');
  if (!mm || !dd || !year.trim()) return '';
  return `${year.trim()}-${mm}-${dd}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processDocumentChunked(pdfBytes: Uint8Array, format: LogbookFormat): Promise<any[]> {
  const { chunks } = await splitPdfIntoChunks(pdfBytes, DOC_AI_PAGE_LIMIT);
  const name = processorName(format);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allEntities: any[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const pageOffset = i * DOC_AI_PAGE_LIMIT;
    const [result] = await client.processDocument({ name, rawDocument: { content: chunks[i], mimeType: 'application/pdf' } });
    for (const entity of result.document?.entities ?? []) {
      if (pageOffset > 0 && entity.pageAnchor?.pageRefs) {
        for (const ref of entity.pageAnchor.pageRefs) ref.page = Number(ref.page ?? 0) + pageOffset;
      }
      allEntities.push(entity);
    }
  }
  return allEntities;
}

// Document AI sometimes prefixes child types with "parentType/" - handle both
// until confirmed against a real SI-HM test response.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getChild(entity: any, childType: string): string {
  const props = entity.properties ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const match = props.find((p: any) => p.type === childType || p.type === `flight_entry/${childType}`);
  return match?.mentionText?.trim() ?? '';
}

function checkHours(raw: string, rule: typeof DECIMAL_HOURS_RULE) {
  if (!raw.trim()) return { value: 0, corrected: false, needsReview: false }; // blank is a normal, valid zero - not an error
  return checkAndCorrect(raw, rule);
}

export async function extractFlightLogs(input: {
  storagePath?: string;
  flightLogPdf?: string;
  logbookFormat: LogbookFormat;
}): Promise<ExtractFlightLogsOutput> {
  const mediaUrl = input.storagePath || input.flightLogPdf;
  if (!mediaUrl) throw new Error('No PDF source provided.');
  const format = input.logbookFormat;

  const response = await fetch(mediaUrl);
  const pdfBytes = new Uint8Array(await response.arrayBuffer());
  const entities = await processDocumentChunked(pdfBytes, format);
  if (entities.length === 0) return { flights: [], logbookFormat: format };

  const pageYearMap = new Map<number, string>();
  for (const e of entities) {
    if (e.type === 'year') pageYearMap.set(Number(e.pageAnchor?.pageRefs?.[0]?.page ?? 0), e.mentionText?.trim() ?? '');
  }
  let lastKnownYear = '';
  const yearForPage = (page: number) => {
    if (pageYearMap.has(page)) lastKnownYear = pageYearMap.get(page)!;
    return lastKnownYear;
  };

  const isHm = format === 'SI-HM' || format === 'S-HM';
  const isCombined = format.startsWith('SI-');
  const hoursRule = isHm ? HM_HOURS_RULE : DECIMAL_HOURS_RULE;

  const flights = entities
    .filter(e => e.type === 'flight_entry')
    .map(entity => {
      const page = Number(entity.pageAnchor?.pageRefs?.[0]?.page ?? 0);

      const aircraftResult = checkAndCorrect(getChild(entity, 'aircraft') || 'Unknown', AIRCRAFT_RULE);
      const dateResult = checkAndCorrect(buildDate(yearForPage(page), getChild(entity, 'month'), getChild(entity, 'day')), DATE_RULE);
      const dualResult = checkHours(getChild(entity, 'dual_hours'), hoursRule);
      const picResult = checkHours(getChild(entity, 'pic_hours'), hoursRule);
      const soloResult = isCombined ? { value: 0, corrected: false, needsReview: false } : checkHours(getChild(entity, 'solo_hours'), hoursRule);
      const instrumentResult = checkHours(getChild(entity, 'instrument_hours'), hoursRule);

      const flaggedFields = [
        ...(aircraftResult.needsReview ? ['aircraft'] : []),
        ...(dateResult.needsReview ? ['date'] : []),
        ...(dualResult.needsReview ? ['dual_hours'] : []),
        ...(picResult.needsReview ? ['pic_hours'] : []),
        ...(soloResult.needsReview ? ['solo_hours'] : []),
        ...(instrumentResult.needsReview ? ['instrument_hours'] : []),
      ];

      return {
        date: dateResult.value,
        aircraft: aircraftResult.value,
        duration: dualResult.value + picResult.value + soloResult.value,
        dualReceived: dualResult.value,
        pilotInCommand: picResult.value,
        solo: soloResult.value,
        instrumentSimulatedHours: instrumentResult.value,
        needsReview: flaggedFields.length > 0,
        flaggedFields,
      };
    })
    .filter(f => !!f.date && f.duration > 0);

  return { flights, logbookFormat: format };
}
