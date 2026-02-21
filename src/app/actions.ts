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

// Helper to handle timeouts
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 28000): Promise<T> {
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

export async function uploadFlightLogAction(formData: FormData) {
    const applicationId = formData.get('applicationId') as string;
    const file = formData.get('file') as File;

    console.time(`🚀 PRO PROCESS: ${file.name}`);
    
    const bucketName = firebaseConfig.storageBucket;
    if (!bucketName) throw new Error("Firebase Storage bucket name is not configured.");
    const bucket = adminStorage.bucket(bucketName);
    
    const storagePath = `applications/${applicationId}/${file.name}`;

    try {
        // STEP 1: Fast Stream to Storage (Very memory efficient)
        const publicUrl = await uploadStreamToStorage(bucket, storagePath, file.stream(), file.type);
        console.log("✅ File uploaded to storage:", publicUrl);

        // STEP 2: Process by Reference (The "Surprise" Fix)
        // We pass the URL, so the AI service handles the heavy lifting, not our server.
        let extractedLogs: FlightLog[] = [];
        try {
            const aiResult = await withTimeout(extractFlightLogs({ storagePath: publicUrl }));
            if (aiResult) {
                extractedLogs = aiResult.map(log => ({ ...log, id: uuidv4(), remarks: log.remarks || '' }));
            }
        } catch (e: any) {
            console.error("❌ AI extraction failed (but file is saved):", e.message);
        }

        console.timeEnd(`🚀 PRO PROCESS: ${file.name}`);
        return { publicUrl, extractedLogs };
    } catch (e: any) {
        console.error('💥 CRITICAL ERROR:', e);
        throw e;
    }
}

// ... rest of your actions remain the same (createApplicationAction, etc)
// Note: I'm keeping the file small for this demo, you should keep your other functions.

export async function createApplicationAction(
    userId: string,
    licenseId: string,
): Promise<{ applicationId: string }> {
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
}

export async function uploadDocumentAction(formData: FormData) {
    const applicationId = formData.get('applicationId') as string;
    const docId = formData.get('docId') as string;
    const file = formData.get('file') as File;
    const requiresExpiry = formData.get('requiresExpiry') === 'true';

    const bucketName = firebaseConfig.storageBucket;
    if (!bucketName) throw new Error("Firebase Storage bucket name is not configured.");
    const bucket = adminStorage.bucket(bucketName);
    const storagePath = `applications/${applicationId}/${docId}/${file.name}`;
    
    try {
        const publicUrl = await uploadStreamToStorage(bucket, storagePath, file.stream(), file.type);
        let detectedExpiryDate: string | null = null;
        if (requiresExpiry && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
            try {
                // For regular documents, we can also use storagePath for AI if updated
                const { expiryDate } = await withTimeout(extractExpiryDate({ documentDataUri: publicUrl }));
                detectedExpiryDate = expiryDate;
            } catch (e: any) {
                console.error("AI expiry date detection failed:", e.message);
            }
        }
        return { publicUrl, expiryDate: detectedExpiryDate, mimeType: file.type };
    } catch (e: any) {
        console.error('💥 UPLOAD ERROR:', e);
        throw e;
    }
}

export async function uploadProfilePictureAction(formData: FormData) {
    const userId = formData.get('userId') as string;
    const file = formData.get('file') as File;
    const bucketName = firebaseConfig.storageBucket;
    if (!bucketName) throw new Error("Firebase Storage bucket name is not configured.");
    const bucket = adminStorage.bucket(bucketName);
    const storagePath = `profile-pictures/${userId}/${file.name}`;
    const photoURL = await uploadStreamToStorage(bucket, storagePath, file.stream(), file.type);
    return { photoURL };
}

export async function getExpiryDateForSingleDocumentAction(
    applicationId: string,
    docId: string
): Promise<{ expiryDate: string | null }> {
    const appRef = adminFirestore.collection('applications').doc(applicationId);
    const appSnapshot = await appRef.get();
    if (!appSnapshot.exists) throw new Error("Application not found.");
    const application = appSnapshot.data() as Application;
    const docToProcess = application.documents.find(d => d.id === docId);
    if (!docToProcess || !docToProcess.fileUrl) throw new Error("Invalid document.");
    const { expiryDate } = await withTimeout(extractExpiryDate({ documentDataUri: docToProcess.fileUrl }));
    return { expiryDate: expiryDate || null };
}
