
'use server';

import 'server-only';
import { adminFirestore, adminStorage } from '@/lib/firebase-admin-prewarmed';
import { firebaseConfig } from '@/firebase/config';
import { extractExpiryDate } from '@/ai/flows/extract-expiry-date';
import { extractFlightLogs } from '@/ai/flows/extract-flight-logs';
import type { FlightLog, Application, LogbookFormat } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { licenseTypes } from '@/lib/licensing';
import admin from 'firebase-admin';
import { getAuthenticatedUser } from '@/lib/auth';

/**
 * Handles server-side errors, providing specific guidance for common IAM permission issues.
 * @param error The error object caught.
 * @param context A string identifying where the error occurred (e.g., the function name).
 */
function handleServerAuthError(error: any, context: string) {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code;

    // Check for common signs of authentication/permission issues on the server
    const isAuthError =
        errorCode === 7 || // gRPC code for PERMISSION_DENIED
        errorCode === 'PERMISSION_DENIED' ||
        errorMessage.includes('credential') ||
        errorMessage.includes('access token') ||
        errorMessage.includes('permission denied') ||
        errorMessage.includes('iam') ||
        errorMessage.includes('does not have storage.objects.create');

    if (isAuthError) {
        console.error(`Authentication/Permission Error in ${context}:`, error);
        // Throw a new, more descriptive error to guide the user.
        throw new Error(
            `Authentication failed on the server. This is likely an IAM permission issue with the App Hosting service account. Please ensure the service account has the 'Storage Object Admin' and 'Vertex AI User' roles in your Google Cloud project.`
        );
    }

    // For non-auth errors, re-throw the original error
    throw error;
}


// Helper to handle timeouts
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 120000): Promise<T> {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
        )
    ]);
}

async function uploadStreamToStorage(bucket: any, path: string, stream: ReadableStream, mimeType: string) {
    const file = bucket.file(path);
    const writeStream = file.createWriteStream({
        metadata: { contentType: mimeType },
        public: true,
    });

    const reader = stream.getReader();
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            writeStream.write(value);
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

export async function uploadFlightLogAction(formData: FormData): Promise<{ publicUrl: string; extractedLogs: FlightLog[]; logbookFormat: LogbookFormat; }> {
    try {
        await getAuthenticatedUser();
        const file = formData.get('file') as File;
        const applicationId = formData.get('applicationId') as string;
        if (!file || !applicationId) throw new Error("Missing file or application ID.");

        const bucketName = firebaseConfig.storageBucket;
        if (!bucketName) throw new Error("Firebase Storage bucket name is not configured.");
        const bucket = adminStorage.bucket(bucketName);

        const storagePath = `applications/${applicationId}/flight-log-${uuidv4()}.pdf`;
        const publicUrl = await uploadStreamToStorage(bucket, storagePath, file.stream(), file.type);
        
        const { flights, logbookFormat } = await withTimeout(extractFlightLogs({ storagePath: publicUrl }));

        const extractedLogs: FlightLog[] = flights.map(log => ({
            ...log,
            id: uuidv4(),
            remarks: '', // Simplified based on latest schema
            isPIC: false,  // Simplified
            isSolo: false, // Simplified
        }));

        return { publicUrl, extractedLogs, logbookFormat };
    } catch(e: any) {
        handleServerAuthError(e, 'uploadFlightLogAction');
        throw e;
    }
}

export async function createApplicationAction(
    licenseId: string,
): Promise<{ applicationId: string }> {
    try {
        const user = await getAuthenticatedUser();
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
            userId: user.uid,
            licenseType: licenseType.name,
            status: 'draft' as const,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            feedback: "",
            documents: documents,
            flightLogs: [],
            flightLogPdfUrl: "",
            logbookFormat: 'simple' as LogbookFormat
        };
        
        await adminFirestore.collection('applications').doc(newAppId).set(appData);
        return { applicationId: newAppId };
    } catch(e: any) {
        handleServerAuthError(e, 'createApplicationAction');
        throw e;
    }
}

export async function uploadDocumentAction(formData: FormData): Promise<{ publicUrl: string, expiryDate: string | null, mimeType: string }> {
    try {
        await getAuthenticatedUser();
        const file = formData.get('file') as File;
        const applicationId = formData.get('applicationId') as string;
        const docId = formData.get('docId') as string;
        const requiresExpiry = formData.get('requiresExpiry') === 'true';
        if (!file || !applicationId || !docId) throw new Error("Missing required form data.");

        const bucketName = firebaseConfig.storageBucket;
        if (!bucketName) throw new Error("Firebase Storage bucket name is not configured.");
        const bucket = adminStorage.bucket(bucketName);
        
        const storagePath = `applications/${applicationId}/${docId}/${file.name}`;
        const publicUrl = await uploadStreamToStorage(bucket, storagePath, file.stream(), file.type);
        
        let detectedExpiryDate: string | null = null;
        if (requiresExpiry && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
            const { expiryDate } = await withTimeout(extractExpiryDate({ documentDataUri: publicUrl }));
            detectedExpiryDate = expiryDate || null;
        }

        return { publicUrl, expiryDate: detectedExpiryDate, mimeType: file.type };
    } catch (e: any) {
        handleServerAuthError(e, 'uploadDocumentAction');
        throw e;
    }
}

export async function uploadProfilePictureAction(formData: FormData): Promise<{ photoURL: string }> {
    try {
        const user = await getAuthenticatedUser();
        const file = formData.get('file') as File;
        if (!file) throw new Error("No file provided for profile picture.");
        
        const bucketName = firebaseConfig.storageBucket;
        if (!bucketName) throw new Error("Firebase Storage bucket name is not configured.");
        const bucket = adminStorage.bucket(bucketName);
        
        const storagePath = `profile-pictures/${user.uid}/${file.name}`;
        const photoURL = await uploadStreamToStorage(bucket, storagePath, file.stream(), file.type);
        
        return { photoURL };
    } catch(e: any) {
        handleServerAuthError(e, 'uploadProfilePictureAction');
        throw e;
    }
}

export async function getExpiryDateForSingleDocumentAction(
    applicationId: string,
    docId: string
): Promise<{ expiryDate: string | null }> {
    try {
        await getAuthenticatedUser();
        const appRef = adminFirestore.collection('applications').doc(applicationId);
        const appSnapshot = await appRef.get();
        if (!appSnapshot.exists) throw new Error("Application not found.");
        const application = appSnapshot.data() as Application;
        const docToProcess = application.documents.find(d => d.id === docId);
        if (!docToProcess || !docToProcess.fileUrl) throw new Error("Invalid document for AI check.");
        
        // Ensure the file URL is a valid data URI or accessible URL for the AI model.
        // For Storage URLs, you might need to fetch the content and convert to a data URI if the AI requires it.
        const { expiryDate } = await withTimeout(extractExpiryDate({ documentDataUri: docToProcess.fileUrl }));
        return { expiryDate: expiryDate || null };
    } catch(e: any) {
        handleServerAuthError(e, 'getExpiryDateForSingleDocumentAction');
        throw e;
    }
}
