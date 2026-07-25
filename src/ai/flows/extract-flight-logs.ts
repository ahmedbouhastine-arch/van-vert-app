'use server';
import 'server-only';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { PDFDocument } from 'pdf-lib';
import { z } from 'zod';
import { checkAndCorrect, AIRCRAFT_RULE, DECIMAL_HOURS_RULE, HM_HOURS_RULE, DATE_RULE } from '@/lib/field-validation';

const PROJECT = 'studio-5434730977-5c28e';
const LOCATION = 'europe-west2';
const client = new DocumentProcessorServiceClient({ apiEndpoint: `${LOCATION}-documentai.googleapis.com` });
const DOC_AI_PAGE_LIMIT = 15;

export type LogbookFormat = 'SI-HM' | 'SI-DEC' | 'S-HM' | 'S-DEC';

// Fill in each processor's ID as it finishes training in Document AI Workbench.
const PROCESSOR_IDS: Record<LogbookFormat, string | null> = {
  'SI-HM': '989755d1517a9cc5',
  'SI-DEC': 'b2409a46b0bdcbd5',
  'S-HM': '125e002a35cd3cdc',
  'S-DEC': '268a11e52ab50d55',
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
  instrumentHours: z.number().optional().default(0),
  simInstrumentHours: z.number().optional().default(0),
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
  const trimmedMonth = month.trim();
  // Combined `date` layouts (e.g. "5/23") give month as a bare number; separate
  // `month` column layouts (e.g. Type 1) give a text name like "May" - accept both.
  const numericMonth = /^\d{1,2}$/.test(trimmedMonth) ? trimmedMonth.padStart(2, '0') : '';
  const mm = numericMonth || MONTH_MAP[trimmedMonth.toUpperCase().slice(0, 3)] || '';
  const dd = day.trim().padStart(2, '0');
  if (!mm || !dd || !year.trim()) return '';
  return `${year.trim()}-${mm}-${dd}`;
}

// Date arrives as either a single combined "M/D" cell (`date`), or as separate
// `month` / `day` fields - never both populated on the same document. Whichever
// is blank tells us which layout this processor's source documents use.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveMonthDay(entity: any): { month: string; day: string } {
  const combined = getChild(entity, 'date');
  if (combined) {
    const [m, d] = combined.split('/');
    return { month: (m ?? '').trim(), day: (d ?? '').trim() };
  }
  return { month: getChild(entity, 'month'), day: getChild(entity, 'day') };
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

async function extractFromPdfBytes(pdfBytes: Uint8Array, format: LogbookFormat): Promise<ExtractFlightLogsOutput> {
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
      const { month, day } = resolveMonthDay(entity);
      const dateResult = checkAndCorrect(buildDate(yearForPage(page), month, day), DATE_RULE);
      const dualResult = checkHours(getChild(entity, 'dual_hours'), hoursRule);
      const picResult = checkHours(getChild(entity, 'pic_hours'), hoursRule);
      const soloResult = isCombined ? { value: 0, corrected: false, needsReview: false } : checkHours(getChild(entity, 'solo_hours'), hoursRule);
      const instrumentResult = checkHours(getChild(entity, 'instrument_hours'), hoursRule);
      const simInstrumentResult = checkHours(getChild(entity, 'sim_instrument_hours'), hoursRule);

      const flaggedFields = [
        ...(aircraftResult.needsReview ? ['aircraft'] : []),
        ...(dateResult.needsReview ? ['date'] : []),
        ...(dualResult.needsReview ? ['dual_hours'] : []),
        ...(picResult.needsReview ? ['pic_hours'] : []),
        ...(soloResult.needsReview ? ['solo_hours'] : []),
        ...(instrumentResult.needsReview ? ['instrument_hours'] : []),
        ...(simInstrumentResult.needsReview ? ['sim_instrument_hours'] : []),
      ];

      return {
        date: dateResult.value,
        aircraft: aircraftResult.value,
        duration: dualResult.value + picResult.value + soloResult.value,
        dualReceived: dualResult.value,
        pilotInCommand: picResult.value,
        solo: soloResult.value,
        instrumentHours: instrumentResult.value,
        simInstrumentHours: simInstrumentResult.value,
        needsReview: flaggedFields.length > 0,
        flaggedFields,
      };
    })
    .filter(f => !!f.date && f.duration > 0);

  return { flights, logbookFormat: format };
}

async function fetchPdfBytes(input: { storagePath?: string; flightLogPdf?: string }): Promise<Uint8Array> {
  const mediaUrl = input.storagePath || input.flightLogPdf;
  if (!mediaUrl) throw new Error('No PDF source provided.');
  const response = await fetch(mediaUrl);
  return new Uint8Array(await response.arrayBuffer());
}

export async function extractFlightLogs(input: {
  storagePath?: string;
  flightLogPdf?: string;
  logbookFormat: LogbookFormat;
}): Promise<ExtractFlightLogsOutput> {
  const pdfBytes = await fetchPdfBytes(input);
  return extractFromPdfBytes(pdfBytes, input.logbookFormat);
}

// Row count dominates - a processor whose fields don't match the document's
// layout typically extracts few or zero coherent rows (dates won't parse,
// hours won't validate). Clean ratio only breaks near-ties between formats
// that both parsed a similar number of rows.
function scoreExtraction(output: { flights: Array<{ needsReview?: boolean }> }): number {
  const rows = output.flights.length;
  if (rows === 0) return 0;
  const cleanRatio = output.flights.filter(f => !f.needsReview).length / rows;
  return rows + cleanRatio;
}

export async function autoDetectAndExtractFlightLogs(input: {
  storagePath?: string;
  flightLogPdf?: string;
}): Promise<ExtractFlightLogsOutput & { confidence: number }> {
  const trainedFormats = (Object.keys(PROCESSOR_IDS) as LogbookFormat[]).filter(f => !!PROCESSOR_IDS[f]);
  if (trainedFormats.length === 0) throw new Error('No trained logbook processors are configured.');

  const pdfBytes = await fetchPdfBytes(input);

  if (trainedFormats.length === 1) {
    const output = await extractFromPdfBytes(pdfBytes, trainedFormats[0]);
    return { ...output, confidence: scoreExtraction(output) };
  }

  const results = await Promise.allSettled(
    trainedFormats.map(format => extractFromPdfBytes(pdfBytes, format))
  );

  const successes = results.filter(
    (r): r is PromiseFulfilledResult<ExtractFlightLogsOutput> => r.status === 'fulfilled'
  );
  if (successes.length === 0) {
    const firstFailure = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
    throw firstFailure?.reason ?? new Error('All logbook processor calls failed.');
  }

  const scored = successes.map(r => ({ output: r.value, score: scoreExtraction(r.value) }));
  const best = scored.reduce((a, b) => (b.score > a.score ? b : a));
  return { ...best.output, confidence: best.score };
}
