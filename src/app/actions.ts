'use server';

import { initializeFirebase } from '@/firebase/init';
import { extractExpiryDate } from '@/ai/flows/extract-expiry-date';
import { extractFlightLogs } from '@/ai/flows/extract-flight-logs';
import type { FlightLog } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { ref, uploadBytes } from 'firebase/storage';

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
    // Initialize Firebase inside the action for reliability in serverless environments.
    const { storage } = initializeFirebase();
    
    const { buffer, mimeType } = decodeDataUri(fileDataUri);
    
    const storageRef = ref(storage, `applications/${applicationId}/${docId}/${fileName}`);
    
    try {
        await uploadBytes(storageRef, buffer, { contentType: mimeType });
    } catch (e: any) {
        console.error("DETAILED DOCUMENT UPLOAD ERROR:", JSON.stringify(e, null, 2));
        throw e;
    }

    let detectedExpiryDate: string | null | undefined = undefined;

    // AI Expiry Date Detection for images
    if (requiresExpiry && mimeType.startsWith('image/')) {
        try {
            const { expiryDate } = await extractExpiryDate({ documentImage: fileDataUri });
            detectedExpiryDate = expiryDate;
        } catch (e: any) {
            console.error("AI expiry date detection failed:", e);
            // Don't block the upload if AI fails. We can show a toast on the client later.
        }
    }

    return { storagePath: storageRef.fullPath, expiryDate: detectedExpiryDate };
}


export async function uploadFlightLogAction(
    applicationId: string,
    pdfDataUri: string,
): Promise<{ storagePath: string; extractedLogs: FlightLog[] }> {
    // Initialize Firebase inside the action for reliability in serverless environments.
    const { storage } = initializeFirebase();
    
    const { buffer, mimeType } = decodeDataUri(pdfDataUri);

    if (mimeType !== 'application/pdf') {
        throw new Error('Invalid file type. Only PDF is allowed for flight logs.');
    }
    
    const storageRef = ref(storage, `applications/${applicationId}/flight-log.pdf`);

    try {
        await uploadBytes(storageRef, buffer, { contentType: mimeType });
    } catch (e: any) {
        console.error("DETAILED FLIGHT LOG UPLOAD ERROR:", JSON.stringify(e, null, 2));
        throw e;
    }

    let extractedLogs: FlightLog[] = [];
    try {
        const aiResult = await extractFlightLogs({ flightLogPdf: pdfDataUri });
        if (aiResult) {
            extractedLogs = aiResult.map(log => ({ ...log, id: uuidv4(), remarks: log.remarks || '' }));
        }
    } catch (e: any) {
        console.error("AI flight log extraction failed:", e);
        // Re-throw the original error to preserve the full stack trace for debugging.
        throw e;
    }
    
    return { storagePath: storageRef.fullPath, extractedLogs };
}
