
'use server';

import { initializeAdminApp } from '@/firebase/admin-init';
import { extractExpiryDate } from '@/ai/flows/extract-expiry-date';
import { extractFlightLogs } from '@/ai/flows/extract-flight-logs';
import type { FlightLog } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Helper to decode data URI
function decodeDataUri(dataUri: string) {
    const parts = dataUri.split(',');
    const mimeType = parts[0].match(/:(.*?);/)?.[1];
    const base64Data = parts[1];
    if (!mimeType || !base64Data) {
        throw new Error('Invalid data URI');
    }
    const buffer = Buffer.from(base64Data, 'base64');
    return { buffer, mimeType };
}

export async function uploadDocumentAction(
    applicationId: string, 
    docId: string,
    fileDataUri: string, 
    fileName: string,
    requiresExpiry: boolean,
): Promise<{ storagePath: string; expiryDate: string | null | undefined }> {
    const { adminStorage } = initializeAdminApp();
    const bucket = adminStorage.bucket();
    
    const { buffer, mimeType } = decodeDataUri(fileDataUri);
    
    const storagePath = `applications/${applicationId}/${docId}/${fileName}`;
    const file = bucket.file(storagePath);
    
    console.log('Attempting to upload document to storage path:', storagePath);

    try {
        await file.save(buffer, { contentType: mimeType });
    } catch (e: any) {
        const errorPayload = JSON.stringify(e, Object.getOwnPropertyNames(e), 2);
        console.error("DETAILED DOCUMENT UPLOAD ERROR:", errorPayload);
        
        throw new Error(`Firebase Admin SDK Storage Error. Payload: ${errorPayload}`);
    }

    let detectedExpiryDate: string | null | undefined = undefined;

    if (requiresExpiry && mimeType.startsWith('image/')) {
        try {
            const { expiryDate } = await extractExpiryDate({ documentImage: fileDataUri });
            detectedExpiryDate = expiryDate;
        } catch (e: any) {
            console.error("AI expiry date detection failed:", e);
        }
    }

    return { storagePath, expiryDate: detectedExpiryDate };
}


export async function uploadFlightLogAction(
    applicationId: string,
    pdfDataUri: string,
): Promise<{ storagePath: string; extractedLogs: FlightLog[] }> {
    const { adminStorage } = initializeAdminApp();
    const bucket = adminStorage.bucket();
    
    const { buffer, mimeType } = decodeDataUri(pdfDataUri);

    if (mimeType !== 'application/pdf') {
        throw new Error('Invalid file type. Only PDF is allowed for flight logs.');
    }
    
    const storagePath = `applications/${applicationId}/flight-log.pdf`;
    const file = bucket.file(storagePath);

    console.log('Attempting to upload flight log to storage path:', storagePath);

    try {
        await file.save(buffer, { contentType: mimeType });
    } catch (e: any) {
        const errorPayload = JSON.stringify(e, Object.getOwnPropertyNames(e), 2);
        console.error("DETAILED FLIGHT LOG UPLOAD ERROR:", errorPayload);
        
        throw new Error(`Firebase Admin SDK Storage Error. Payload: ${errorPayload}`);
    }

    let extractedLogs: FlightLog[] = [];
    try {
        const aiResult = await extractFlightLogs({ flightLogPdf: pdfDataUri });
        if (aiResult) {
            extractedLogs = aiResult.map(log => ({ ...log, id: uuidv4(), remarks: log.remarks || '' }));
        }
    } catch (e: any) {
        console.error("AI flight log extraction failed:", e);
        throw e;
    }
    
    return { storagePath, extractedLogs };
}
