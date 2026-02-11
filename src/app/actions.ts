
'use server';

import { initializeFirebase } from '@/firebase';
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

// NOTE: Server Actions may run in a separate environment. We need to initialize Firebase here.
const { storage } = initializeFirebase();

export async function uploadDocumentAction(
    applicationId: string, 
    docId: string,
    fileDataUri: string, 
    fileName: string,
    requiresExpiry: boolean,
): Promise<{ storagePath: string; expiryDate: string | null | undefined }> {
    
    const { buffer, mimeType } = decodeDataUri(fileDataUri);
    
    const storageRef = ref(storage, `applications/${applicationId}/${docId}/${fileName}`);
    await uploadBytes(storageRef, buffer, { contentType: mimeType });

    let detectedExpiryDate: string | null | undefined = undefined;

    // AI Expiry Date Detection for images
    if (requiresExpiry && mimeType.startsWith('image/')) {
        try {
            const { expiryDate } = await extractExpiryDate({ documentImage: fileDataUri });
            detectedExpiryDate = expiryDate;
        } catch (e) {
            console.error("AI expiry date detection failed:", e);
            // Don't block the upload if AI fails
        }
    }

    return { storagePath: storageRef.fullPath, expiryDate: detectedExpiryDate };
}


export async function uploadFlightLogAction(
    applicationId: string,
    pdfDataUri: string,
): Promise<{ storagePath: string; extractedLogs: FlightLog[] }> {
    
    const { buffer, mimeType } = decodeDataUri(pdfDataUri);

    if (mimeType !== 'application/pdf') {
        throw new Error('Invalid file type. Only PDF is allowed for flight logs.');
    }

    const storageRef = ref(storage, `applications/${applicationId}/flight-log.pdf`);
    await uploadBytes(storageRef, buffer, { contentType: mimeType });

    let extractedLogs: FlightLog[] = [];
    try {
        const aiResult = await extractFlightLogs({ flightLogPdf: pdfDataUri });
        if (aiResult) {
            extractedLogs = aiResult.map(log => ({ ...log, id: uuidv4(), remarks: log.remarks || '' }));
        }
    } catch (e) {
        console.error("AI flight log extraction failed:", e);
        // Return empty logs but still count the upload as successful
        // We throw the error so the client can notify the user.
        throw new Error("AI processing of the flight log failed.");
    }
    
    return { storagePath: storageRef.fullPath, extractedLogs };
}
