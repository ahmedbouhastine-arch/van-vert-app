
'use server';

import { initializeAdminApp } from '@/firebase/admin-init';
import { firebaseConfig } from '@/firebase/config';
import { extractExpiryDate } from '@/ai/flows/extract-expiry-date';
import { extractFlightLogs } from '@/ai/flows/extract-flight-logs';
import type { FlightLog, ApplicationDocument } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { licenseTypes } from '@/lib/licensing';
import admin from 'firebase-admin';

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

function handleStorageError(e: any, path: string) {
    const errorMessage = e.message || '';
    if (errorMessage.includes('Could not refresh access token') || errorMessage.includes('credential')) {
        throw new Error('Firebase Admin SDK failed to authenticate. This is a common issue in development environments. Please run `gcloud auth application-default login` in your terminal and restart the server.');
    }
    // The "bucket not found" error is often a permissions issue.
    if (e.code === 404 || errorMessage.includes('does not exist')) {
        throw new Error(`The storage bucket was not found, which often indicates a permission issue with the Admin SDK. Please ensure your Application Default Credentials are valid by running 'gcloud auth application-default login'. Original error: ${errorMessage}`);
    }

    throw new Error(`Firebase Admin SDK Storage Error on path '${path}': ${errorMessage}`);
}


export async function createApplicationAction(
    userId: string,
    licenseId: string,
): Promise<{ applicationId: string }> {
    console.log('--- Starting createApplicationAction ---');
    const { adminStorage, adminFirestore } = initializeAdminApp();
    const bucketName = firebaseConfig.storageBucket;
    
    console.log(`Using bucket name from config: ${bucketName}`);
    if (!bucketName) {
        console.error("CRITICAL: Firebase Storage bucket name is not configured in firebaseConfig.");
        throw new Error("Firebase Storage bucket name is not configured.");
    }
    
    const bucket = adminStorage.bucket(bucketName);

    const licenseType = licenseTypes.find(lt => lt.id === licenseId);
    if (!licenseType) {
        throw new Error(`License type with ID "${licenseId}" not found.`);
    }

    const newAppId = uuidv4();
    console.log(`Generated new Application ID: ${newAppId}`);

    const documentPromises = licenseType.documentRequirements.map(async (req) => {
        const docInstanceId = uuidv4();
        const placeholderFileName = 'placeholder.txt';
        const storagePath = `applications/${newAppId}/${docInstanceId}/${placeholderFileName}`;
        const file = bucket.file(storagePath);
        
        try {
            console.log(`Attempting to create placeholder file at path: ${storagePath}`);
            await file.save(Buffer.from(''), {
                contentType: 'text/plain',
                public: true,
            });
            console.log(`Placeholder created for document: ${req.name}`);
        } catch (e: any) {
            console.error(`Failed to create placeholder for ${req.name} at ${storagePath}`);
            handleStorageError(e, storagePath);
        }
        
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

        const doc: ApplicationDocument = {
            id: docInstanceId,
            docRequirementId: req.id,
            name: req.name,
            description: req.description,
            status: 'missing',
            requiresExpiry: req.requiresExpiry,
            fileUrl: publicUrl,
            fileName: placeholderFileName,
        };
        return doc;
    });

    const documents = await Promise.all(documentPromises);
    console.log('All placeholder files created successfully.');

    const appData = {
        id: newAppId,
        userId: userId,
        licenseType: licenseType.name,
        status: 'draft' as const,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        feedback: "",
        documents: documents,
        flightLogs: [],
        flightLogPdfUrl: "",
    };
    
    console.log('Writing new application data to Firestore...');
    await adminFirestore.collection('applications').doc(newAppId).set(appData);
    console.log('--- Finished createApplicationAction ---');

    return { applicationId: newAppId };
}


export async function uploadProfilePictureAction(
    userId: string,
    fileDataUri: string,
    fileName: string,
): Promise<{ photoURL: string }> {
    const { adminStorage } = initializeAdminApp();
    const bucketName = firebaseConfig.storageBucket;
    if (!bucketName) {
        throw new Error("Firebase Storage bucket name is not configured.");
    }
    const bucket = adminStorage.bucket(bucketName);

    const { buffer, mimeType } = decodeDataUri(fileDataUri);
    const storagePath = `profile-pictures/${userId}/${fileName}`;
    const file = bucket.file(storagePath);
    
    try {
        await file.save(buffer, {
            contentType: mimeType,
            public: true,
        });
        
        const photoURL = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
        return { photoURL };

    } catch (e: any) {
       handleStorageError(e, storagePath);
       // The line below will not be reached because handleStorageError throws,
       // but it's needed for TypeScript to know the function has a return path.
       return { photoURL: '' };
    }
}


export async function uploadDocumentAction(
    applicationId: string, 
    docId: string,
    fileDataUri: string, 
    fileName: string,
    requiresExpiry: boolean,
): Promise<{ publicUrl: string; expiryDate: string | null | undefined }> {
    const { adminStorage } = initializeAdminApp();
    const bucketName = firebaseConfig.storageBucket;
    if (!bucketName) {
        throw new Error("Firebase Storage bucket name is not configured.");
    }
    const bucket = adminStorage.bucket(bucketName);
    
    const { buffer, mimeType } = decodeDataUri(fileDataUri);
    
    const storagePath = `applications/${applicationId}/${docId}/${fileName}`;
    const file = bucket.file(storagePath);
    
    try {
        await file.save(buffer, { 
            contentType: mimeType,
            public: true,
        });
    } catch (e: any) {
        handleStorageError(e, storagePath);
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
    
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
    return { publicUrl, expiryDate: detectedExpiryDate };
}


export async function uploadFlightLogAction(
    applicationId: string,
    pdfDataUri: string,
    fileName: string,
): Promise<{ publicUrl: string; extractedLogs: FlightLog[] }> {
    const { adminStorage } = initializeAdminApp();
    const bucketName = firebaseConfig.storageBucket;
     if (!bucketName) {
        throw new Error("Firebase Storage bucket name is not configured.");
    }
    const bucket = adminStorage.bucket(bucketName);
    
    const { buffer, mimeType } = decodeDataUri(pdfDataUri);

    if (mimeType !== 'application/pdf') {
        throw new Error('Invalid file type. Only PDF is allowed for flight logs.');
    }
    
    const storagePath = `applications/${applicationId}/${fileName}`;
    const file = bucket.file(storagePath);

    try {
        await file.save(buffer, { 
            contentType: mimeType,
            public: true,
        });
    } catch (e: any) {
        handleStorageError(e, storagePath);
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
    
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
    return { publicUrl, extractedLogs };
}
