'use server';
import 'server-only';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { z } from 'zod';

const client = new DocumentProcessorServiceClient();

const PROCESSOR_NAME = 'projects/REDACTED_FIREBASE_SENDER_ID/locations/us/processors/47422f02bcaec722/processorVersions/1e5684bc4378fc3e';

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

export async function extractFlightLogs(input: ExtractFlightLogsInput): Promise<ExtractFlightLogsOutput> {
  const mediaUrl = input.flightLogPdf || input.storagePath;
  if (!mediaUrl) throw new Error('No PDF source provided.');

  // Fetch the PDF from Firebase Storage as a buffer
  const response = await fetch(mediaUrl);
  const arrayBuffer = await response.arrayBuffer();
  const pdfBuffer = Buffer.from(arrayBuffer);
  const encodedContent = pdfBuffer.toString('base64');

  // Call Document AI
  const [result] = await client.processDocument({
    name: PROCESSOR_NAME,
    rawDocument: {
      content: encodedContent,
      mimeType: 'application/pdf',
    },
  });

  const document = result.document;
  if (!document?.entities) {
    return { flights: [], logbookFormat: 'simple' };
  }

  // Parse entities into flight logs
  const flightMap: Record<number, Partial<FlightLog>> = {};

  for (const entity of document.entities) {
    const value = entity.mentionText?.trim() ?? '';
    const pageIndex = entity.pageAnchor?.pageRefs?.[0]?.page ?? 0;
    const rowIndex = Number(entity.properties?.find(p => p.type === 'row_index')?.mentionText ?? pageIndex);

    if (!flightMap[rowIndex]) flightMap[rowIndex] = {};

    switch (entity.type) {
      case 'Date':
        flightMap[rowIndex].date = value;
        break;
      case 'aircraft_type':
        flightMap[rowIndex].aircraft = value;
        break;
      case 'dual_hours':
        flightMap[rowIndex].dualReceived = parseFloat(value) || 0;
        break;
      case 'PIC_hours_solo_incl':
        flightMap[rowIndex].pilotInCommand = parseFloat(value) || 0;
        break;
      case 'instrument_hours':
        flightMap[rowIndex].instrumentHours = parseFloat(value) || 0;
        break;
      case 'solo_incl':
        flightMap[rowIndex].solo = parseFloat(value) || 0;
        break;
      case 'year':
        flightMap[rowIndex].year = value;
        break;
    }
  }

  // Detect logbook format from solo_incl field presence
  const hasSoloIncl = document.entities.some(e => e.type === 'solo_incl');
  const hasSeparateSolo = document.entities.some(e => e.type === 'solo_incl' && e.mentionText === 'no');
  const logbookFormat = hasSeparateSolo ? 'typeA' : hasSoloIncl ? 'typeB' : 'simple';

  // Build and filter flights
  const currentYear = new Date().getFullYear();
  const flights = Object.values(flightMap)
    .map(f => ({
      date: f.date ?? '',
      aircraft: f.aircraft ?? 'Unknown',
      duration: (f.dualReceived ?? 0) + (f.pilotInCommand ?? 0) + (f.solo ?? 0) || 0,
      dualReceived: f.dualReceived ?? 0,
      pilotInCommand: f.pilotInCommand ?? 0,
      solo: f.solo ?? 0,
    }))
    .filter(f => {
      const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(f.date) &&
        !isNaN(new Date(f.date).getTime()) &&
        new Date(f.date).getFullYear() >= 1990 &&
        new Date(f.date).getFullYear() <= currentYear;
      return dateValid && !!f.aircraft && f.duration > 0;
    });

  return { flights, logbookFormat };
}
type FlightLog = z.infer<typeof FlightLogEntrySchema>;