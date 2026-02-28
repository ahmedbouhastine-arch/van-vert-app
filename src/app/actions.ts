'use server';
import 'server-only';

import { adminAuth, adminFirestore, adminStorage } from '@/lib/firebase-admin-prewarmed';
import { extractExpiryDate } from '@/ai/flows/extract-expiry-date';
import { extractFlightLogs } from '@/ai/flows/extract-flight-logs';
import type { FlightLog, Application, LogbookFormat } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { licenseTypes } from '@/lib/licensing';
import admin from 'firebase-admin';

async function getAuthenticatedUser(idToken?: string) {
    if (!idToken) {
        throw new Error("Unauthorized: No token provided.");
    }
    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        console.error("Error verifying auth token:", error);
        throw new Error("Unauthorized: Invalid token.");
    }
}


/**
 * Handles server-side errors, providing specific guidance for common IAM permission issues.
 * @param error The error object caught.
 * @param context A string identifying where the error occurred (e.g., the function name).
 */
function handleServerAuthError(error: unknown, context: string) {
    const err = (error as { message?: unknown; code?: unknown }) || {};
    const errorMessage = typeof err.message === 'string' ? err.message.toLowerCase() : '';
    const errorCode = err.code;

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

type StorageFile = {
    createWriteStream: (opts?: Record<string, unknown>) => {
        write: (chunk: unknown) => void;
        end: () => void;
        on: (ev: string, cb: (...args: unknown[]) => void) => void;
        destroy?: () => void;
    };
};

type StorageBucket = {
    file: (path: string) => StorageFile;
    name?: string;
};

async function uploadStreamToStorage(bucket: StorageBucket, path: string, stream: ReadableStream, mimeType: string) {
    const file = bucket.file(path);
    const writeStream = file.createWriteStream({
        metadata: { contentType: mimeType } as Record<string, unknown>,
        public: true,
    });

    const reader = stream.getReader();
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            // value is a Uint8Array chunk for readable streams
            writeStream.write(value as unknown);
        }
        writeStream.end();

        return new Promise<string>((resolve, reject) => {
            writeStream.on('finish', () => resolve(`https://storage.googleapis.com/${bucket.name}/${path}`));
            writeStream.on('error', (...args: unknown[]) => reject(args[0]));
        });
    } catch (error) {
        if (typeof writeStream.destroy === 'function') writeStream.destroy();
        throw error;
    }
}

export async function uploadFlightLogAction(formData: FormData, idToken?: string): Promise<{ publicUrl: string; extractedLogs: FlightLog[]; logbookFormat: LogbookFormat; }> {
    try {
        const user = await getAuthenticatedUser(idToken);
        const file = formData.get('file') as File;
        const applicationId = formData.get('applicationId') as string;
        if (!file || !applicationId) throw new Error("Missing file or application ID.");

        const appRef = adminFirestore.collection('applications').doc(applicationId);
        const appSnapshot = await appRef.get();
        if (!appSnapshot.exists) {
            throw new Error("Application not found.");
        }
        const applicationData = appSnapshot.data() as Application;
        if (applicationData.userId !== user.uid) {
            throw new Error("User does not have permission to access this application.");
        }

        const bucket = adminStorage.bucket();

        const storagePath = `applications/${applicationId}/flight-log-${uuidv4()}.pdf`;
        const publicUrl = await uploadStreamToStorage(bucket, storagePath, file.stream(), file.type);
        
        const { flights, logbookFormat } = await withTimeout(extractFlightLogs({ storagePath: publicUrl }));

        const extractedLogs: FlightLog[] = flights.map(log => ({
            ...log,
            id: uuidv4(),
        }));

        return { publicUrl, extractedLogs, logbookFormat };
    } catch (e: unknown) {
        handleServerAuthError(e, 'uploadFlightLogAction');
    }
}

export async function updateFlightLogsAction(applicationId: string, flights: FlightLog[], idToken?: string): Promise<{ success: boolean }> {
    try {
        const user = await getAuthenticatedUser(idToken);
        
        const appRef = adminFirestore.collection('applications').doc(applicationId);
        const appSnapshot = await appRef.get();
        if (!appSnapshot.exists) {
            throw new Error("Application not found.");
        }
        const applicationData = appSnapshot.data() as Application;
        if (applicationData.userId !== user.uid) {
            throw new Error("User does not have permission to access this application.");
        }

        await appRef.update({
            flightLogs: flights,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return { success: true };
    } catch (e: unknown) {
        handleServerAuthError(e, 'updateFlightLogsAction');
        return { success: false };
    }
}

export async function createApplicationAction(
    licenseId: string,
    idToken?: string,
): Promise<{ applicationId: string }> {
    try {
        const user = await getAuthenticatedUser(idToken);
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
    } catch (e: unknown) {
        handleServerAuthError(e, 'createApplicationAction');
    }
}

export async function extractExpiryDateAction(args: {applicationId: string, documentUrl: string, idToken?: string}): Promise<{ expiryDate: string | null}> {
  try {
    const user = await getAuthenticatedUser(args.idToken);
    const appRef = adminFirestore.collection('applications').doc(args.applicationId);
    const appSnapshot = await appRef.get();
    if (!appSnapshot.exists) {
        throw new Error("Application not found.");
    }
    const applicationData = appSnapshot.data() as Application;
    if (applicationData.userId !== user.uid) {
        throw new Error("User does not have permission to access this application.");
    }
    
    const { expiryDate } = await withTimeout(extractExpiryDate({ documentDataUri: args.documentUrl }));
    return { expiryDate: expiryDate || null };

  } catch (e: unknown) {
      handleServerAuthError(e, 'extractExpiryDateAction');
  }
}

export async function uploadProfilePictureAction(formData: FormData, idToken?: string): Promise<{ photoURL: string }> {
    try {
        const token = idToken ?? (formData.get('idToken') as string | undefined);
        const user = await getAuthenticatedUser(token);
        const file = formData.get('file') as File;
        if (!file) throw new Error("No file provided for profile picture.");
        
        const bucket = adminStorage.bucket();
        
        const storagePath = `profile-pictures/${user.uid}/${file.name}`;
        const photoURL = await uploadStreamToStorage(bucket, storagePath, file.stream(), file.type);
        
        return { photoURL };
    } catch (e: unknown) {
        handleServerAuthError(e, 'uploadProfilePictureAction');
    }
}

export async function getExpiryDateForSingleDocumentAction(
    applicationId: string,
    docId: string
    , idToken?: string
): Promise<{ expiryDate: string | null }> {
    try {
        const user = await getAuthenticatedUser(idToken);
        const appRef = adminFirestore.collection('applications').doc(applicationId);
        const appSnapshot = await appRef.get();
        if (!appSnapshot.exists) throw new Error("Application not found.");
        const application = appSnapshot.data() as Application;
        if (application.userId !== user.uid) {
            throw new Error("User does not have permission to access this application.");
        }
        const docToProcess = application.documents.find(d => d.id === docId);
        if (!docToProcess || !docToProcess.fileUrl) throw new Error("Invalid document for AI check.");
        
        // Ensure the file URL is a valid data URI or accessible URL for the AI model.
        // For Storage URLs, you might need to fetch the content and convert to a data URI if the AI requires it.
        const { expiryDate } = await withTimeout(extractExpiryDate({ documentDataUri: docToProcess.fileUrl }));
        return { expiryDate: expiryDate || null };
    } catch (e: unknown) {
        handleServerAuthError(e, 'getExpiryDateForSingleDocumentAction');
    }
}

export async function updateUserProfileAction(
    data: { displayName?: string; phoneNumber?: string },
    idToken?: string
): Promise<{ success: boolean }> {
    try {
        const user = await getAuthenticatedUser(idToken);
        
        const authUpdates: { displayName?: string; phoneNumber?: string } = {};
        if (data.displayName) authUpdates.displayName = data.displayName;
        if (data.phoneNumber) authUpdates.phoneNumber = data.phoneNumber;
        
        if (Object.keys(authUpdates).length > 0) {
            await adminAuth.updateUser(user.uid, authUpdates);
        }

        return { success: true };
    } catch (e) {
        handleServerAuthError(e, 'updateUserProfileAction');
        return { success: false };
    }
}

export async function deleteUserAccountAction(idToken?: string): Promise<{ success: boolean }> {
    try {
        const user = await getAuthenticatedUser(idToken);
        await adminAuth.deleteUser(user.uid);
        // You might want to also clean up Firestore data associated with the user
        return { success: true };
    } catch (e) {
        handleServerAuthError(e, 'deleteUserAccountAction');
        return { success: false };
    }
}
