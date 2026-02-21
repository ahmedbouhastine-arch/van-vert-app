'use server';

import 'server-only';
import { adminFirestore, adminStorage } from '@/lib/firebase-admin-prewarmed';
import { firebaseConfig } from '@/firebase/config';
import { extractExpiryDate } from '@/ai/flows/extract-expiry-date';
import { extractFlightLogs } from '@/ai/flows/extract-flight-logs';
import type { FlightLog, ApplicationDocument, Application } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { licenseTypes } from '@/lib/licensing';
import admin from 'firebase-admin';

/**
 * Catches errors from the Admin SDK and re-throws a more user-friendly error
 * that points towards a likely IAM permission issue in the deployed environment.
 * @param error The caught error object.
 * @param serviceName The name of the service that failed (e.g., 'Cloud Storage', 'Vertex AI').
 */
function handleAdminSDKAuthError(error: any, serviceName: string) {
    const errorMessage = error.message || '';
    // Keywords that often indicate a service account permission issue.
    const authErrorKeywords = [
        'could not refresh access token',
        'credential',
        'permission denied',
        'permissions',
        'forbidden',
        '403',
        'unable to detect a project id'
    ];

    if (authErrorKeywords.some(keyword => errorMessage.toLowerCase().includes(keyword.toLowerCase()))) {
        throw new Error(
            `Authentication failed when trying to access ${serviceName}. This is likely an IAM permission issue with the service account on your deployed server. ` +
            `Please ensure the App Hosting service account has the correct roles (e.g., "Storage Object Admin" for file uploads, "Vertex AI User" for AI features) in the Google Cloud Console.`
        );
    }
    
    // If it's not a recognizable auth error, re-throw the original error.
    throw error;
}


// Helper to handle timeouts
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 28000): Promise<T> {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
        )
    ]);
}

// Memory efficient chunk processing (simulated for storage upload which handles streams)
async function uploadStreamToStorage(bucket: any, path: string, stream: ReadableStream, mimeType: string) {
    const file = bucket.file(path);
    const writeStream = file.createWriteStream({
        metadata: { contentType: mimeType },
        public: true,
    });

    const reader = stream.getReader();
    let chunkNum = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            writeStream.write(value);
            chunkNum++;
            
            if (chunkNum % 5 === 0) { // Log progress every few chunks
                console.log(`📦 CHUNK ${chunkNum} processed. Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
            }

            // Force garbage collection if available (requires --expose-gc flag)
            if (global.gc) global.gc();
        }
        writeStream.end();

        return new Promise<string>((resolve, reject) => {
            writeStream.on('finish', () => resolve(`https://storage.googleapis.com/${bucket.name}/${path}`));
            writeStream.on('error', reject);
        });
    } catch (error) {
        writeStream.destroy();
        throw error;
    }
}

export async function createApplicationAction(
    userId: string,
    licenseId: string,
): Promise<{ applicationId: string }> {
    try {
        const licenseType = licenseTypes.find(lt => lt.id === licenseId);
        if (!licenseType) throw new Error(`License type with ID "${licenseId}" not found.`);

        const newAppId = uuidv4();
        const documents = licenseType.documentRequirements.map((req) => ({
            id: uuidv4(),
            docRequirementId: req.id,
            name: req.name,
            description: req.description,
            status: 'missing' as const,
            requiresExpiry: req.requiresExpiry,
            fileUrl: '',
            fileName: '',
            fileType: '',
            uploadedAt: '',
            expiryDate: '',
            isExpiringSoon: false,
        }));

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
        
        await adminFirestore.collection('applications').doc(newAppId).set(appData);
        return { applicationId: newAppId };
    } catch (e: any) {
        handleAdminSDKAuthError(e, 'Firestore');
        return { applicationId: '' }; // Will not be reached
    }
}

export async function uploadDocumentAction(formData: FormData) {
    try {
        const applicationId = formData.get('applicationId') as string;
        const docId = formData.get('docId') as string;
        const file = formData.get('file') as File;
        const requiresExpiry = formData.get('requiresExpiry') === 'true';

        console.time(`📦 UPLOAD DOC: ${file.name}`);
        console.log(`📄 FILE: ${file.name} (${Math.round(file.size / 1024 / 1024)} MB)`);

        const bucketName = firebaseConfig.storageBucket;
        if (!bucketName) throw new Error("Firebase Storage bucket name is not configured.");
        const bucket = adminStorage.bucket(bucketName);
        
        const storagePath = `applications/${applicationId}/${docId}/${file.name}`;
        
        const publicUrl = await uploadStreamToStorage(bucket, storagePath, file.stream(), file.type);
        
        let detectedExpiryDate: string | null = null;
        if (requiresExpiry && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
            try {
                const buffer = Buffer.from(await file.arrayBuffer());
                const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`;
                const { expiryDate } = await withTimeout(extractExpiryDate({ documentDataUri: dataUri }));
                detectedExpiryDate = expiryDate;
            } catch (e: any) {
                console.error("AI expiry date detection failed:", e.message);
                handleAdminSDKAuthError(e, 'Vertex AI');
            }
        }

        console.timeEnd(`📦 UPLOAD DOC: ${file.name}`);
        return { publicUrl, expiryDate: detectedExpiryDate, mimeType: file.type };
    } catch (e: any) {
        console.error('💥 UPLOAD ERROR:', e);
        handleAdminSDKAuthError(e, 'Cloud Storage');
        return { publicUrl: '', expiryDate: null, mimeType: '' }; // Will not be reached
    }
}

export async function uploadFlightLogAction(formData: FormData) {
    try {
        const applicationId = formData.get('applicationId') as string;
        const file = formData.get('file') as File;

        console.time(`📦 UPLOAD FLIGHT LOG: ${file.name}`);
        console.log(`📄 FILE: ${file.name} (${Math.round(file.size / 1024 / 1024)} MB)`);

        if (file.type !== 'application/pdf') throw new Error('Invalid file type. Only PDF is allowed.');

        const bucketName = firebaseConfig.storageBucket;
        if (!bucketName) throw new Error("Firebase Storage bucket name is not configured.");
        const bucket = adminStorage.bucket(bucketName);
        
        const storagePath = `applications/${applicationId}/${file.name}`;

        const publicUrl = await uploadStreamToStorage(bucket, storagePath, file.stream(), file.type);
        
        let extractedLogs: FlightLog[] = [];
        try {
            const buffer = Buffer.from(await file.arrayBuffer());
            const pdfDataUri = `data:${file.type};base64,${buffer.toString('base64')}`;
            const aiResult = await withTimeout(extractFlightLogs({ flightLogPdf: pdfDataUri }));
            if (aiResult) {
                extractedLogs = aiResult.map(log => ({ ...log, id: uuidv4(), remarks: log.remarks || '' }));
            }
        } catch (e: any) {
            console.error("AI extraction failed:", e);
            handleAdminSDKAuthError(e, 'Vertex AI');
        }

        console.timeEnd(`📦 UPLOAD FLIGHT LOG: ${file.name}`);
        return { publicUrl, extractedLogs };
    } catch (e: any) {
        console.error('💥 FLIGHT LOG ERROR:', e);
        handleAdminSDKAuthError(e, 'Cloud Storage');
        return { publicUrl: '', extractedLogs: [] }; // Will not be reached
    }
}

export async function uploadProfilePictureAction(formData: FormData) {
    try {
        const userId = formData.get('userId') as string;
        const file = formData.get('file') as File;

        const bucketName = firebaseConfig.storageBucket;
        if (!bucketName) throw new Error("Firebase Storage bucket name is not configured.");
        const bucket = adminStorage.bucket(bucketName);
        
        const storagePath = `profile-pictures/${userId}/${file.name}`;
        
        const photoURL = await uploadStreamToStorage(bucket, storagePath, file.stream(), file.type);
        return { photoURL };
    } catch (e: any) {
        handleAdminSDKAuthError(e, 'Cloud Storage');
        return { photoURL: '' }; // Will not be reached
    }
}

export async function getExpiryDateForSingleDocumentAction(
    applicationId: string,
    docId: string
): Promise<{ expiryDate: string | null }> {
    let fileBuffer: Buffer;
    let docToProcess: ApplicationDocument | undefined;
    const bucketName = firebaseConfig.storageBucket;
    if (!bucketName) throw new Error("Firebase Storage bucket name is not configured.");
    const bucket = adminStorage.bucket(bucketName);

    try {
        const appRef = adminFirestore.collection('applications').doc(applicationId);
        const appSnapshot = await appRef.get();
        if (!appSnapshot.exists) throw new Error("Application not found.");
        const application = appSnapshot.data() as Application;

        docToProcess = application.documents.find(d => d.id === docId);
        if (!docToProcess || !docToProcess.fileUrl || !docToProcess.fileName) throw new Error("Invalid document.");

        const file = bucket.file(`applications/${applicationId}/${docId}/${docToProcess.fileName}`);
        [fileBuffer] = await file.download();
    } catch(e: any) {
        console.error("💥 Storage error in getExpiryDateForSingleDocumentAction:", e);
        handleAdminSDKAuthError(e, 'Cloud Storage');
        return { expiryDate: null }; // for TS
    }

    try {
        if (!docToProcess?.fileType) throw new Error("Document file type is missing.");
        const dataUri = `data:${docToProcess.fileType};base64,${fileBuffer.toString('base64')}`;
        const { expiryDate } = await withTimeout(extractExpiryDate({ documentDataUri: dataUri }));
        return { expiryDate: expiryDate || null };
    } catch (e: any) {
        console.error("💥 AI error in getExpiryDateForSingleDocumentAction:", e);
        handleAdminSDKAuthError(e, 'Vertex AI');
        return { expiryDate: null }; // for TS
    }
}
