'use server';
import 'server-only';

import { adminAuth, adminFirestore, adminStorage } from '@/lib/firebase-admin-prewarmed';
import { extractExpiryDate } from '@/ai/flows/extract-expiry-date';
import { extractFlightLogs } from '@/ai/flows/extract-flight-logs';
import type { FlightLog, Application, LogbookFormat, UserProfile } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { licenseTypes } from '@/lib/licensing';
import { BASE_URL } from '@/lib/utils';
import { isDevTestAccount } from '@/lib/dev-test-accounts';
import admin from 'firebase-admin';
import {
    sendVerificationEmail,
    sendApplicationReceivedEmail,
    sendApplicationApprovedEmail,
    sendApplicationRejectedEmail,
    sendApplicationNeedsMoreInfoEmail,
    sendWelcomeEmail,
    sendPasswordChangedEmail
} from '@/lib/send-email';

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

function handleServerAuthError(error: unknown, context: string): never {
    const err = (error as { message?: unknown; code?: unknown }) || {};
    const errorMessage = typeof err.message === 'string' ? err.message.toLowerCase() : '';
    const errorCode = err.code;

    const isAuthError =
        errorCode === 7 ||
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
    throw error;
}

// Upload limits (server-side enforcement)
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

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
            writeStream.write(value as unknown);
        }
        writeStream.end();

        return new Promise<string>((resolve, reject) => {
            writeStream.on('finish', () => {
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`;
                resolve(publicUrl);
            });
            writeStream.on('error', (...args: unknown[]) => {
                reject(args[0]);
            });
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

        if (file.size > MAX_FILE_SIZE_BYTES) {
            throw new Error(`File too large. Maximum size is 50MB, your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
        }

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

        const { flights, logbookFormat } = await withTimeout(extractFlightLogs({ storagePath: publicUrl }), 300000);

        const extractedLogs: FlightLog[] = flights.map(log => ({
            ...log,
            id: uuidv4(),
            flightType: 'PIC', // Defaulting to PIC during extraction if unknown
        }));

        await appRef.update({
            flightLogs: extractedLogs,
            flightLogPdfUrl: publicUrl,
            logbookFormat: logbookFormat,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

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
        const userRecord = await adminAuth.getUser(user.uid);
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
        await sendApplicationReceivedEmail(userRecord.email!, userRecord.displayName || 'Pilot', newAppId);
        return { applicationId: newAppId };
    } catch (e: unknown) {
        handleServerAuthError(e, 'createApplicationAction');
    }
}

export async function extractExpiryDateAction(args: { applicationId: string, documentUrl: string, idToken?: string }): Promise<{ expiryDate: string | null }> {
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

        if (!file) {
            throw new Error("No file provided for profile picture.");
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            throw new Error(`File too large. Maximum size is 50MB, your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
        }

        const bucket = adminStorage.bucket();
        const storagePath = `profile-pictures/${user.uid}/${file.name || 'profile.png'}`;
        const photoURL = await uploadStreamToStorage(bucket, storagePath, file.stream(), file.type);

        await adminAuth.updateUser(user.uid, { photoURL });
        await adminFirestore.collection('users').doc(user.uid).set({ photoURL }, { merge: true });

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

        const { expiryDate } = await withTimeout(extractExpiryDate({ documentDataUri: docToProcess.fileUrl }));
        return { expiryDate: expiryDate || null };
    } catch (e: unknown) {
        handleServerAuthError(e, 'getExpiryDateForSingleDocumentAction');
    }
}

export async function updateUserProfileAction(
    data: Partial<UserProfile>,
    idToken?: string
): Promise<{ success: boolean; updatedData: Partial<UserProfile> }> {
    try {
        const user = await getAuthenticatedUser(idToken);
        const { uid } = user;

        const authUpdates: { displayName?: string; phoneNumber?: string } = {};
        if (data.displayName) {
            authUpdates.displayName = data.displayName;
        }

        const firestoreUpdates: Partial<UserProfile> = { ...data };
        delete (firestoreUpdates as Record<string, unknown>)['nationality'];

        if (Object.keys(authUpdates).length > 0) {
            await adminAuth.updateUser(uid, authUpdates);
        }

        if (Object.keys(firestoreUpdates).length > 0) {
            await adminFirestore.collection('users').doc(uid).set(firestoreUpdates, { merge: true });
        }

        return { success: true, updatedData: firestoreUpdates };
    } catch (e) {
        handleServerAuthError(e, 'updateUserProfileAction');
        return { success: false, updatedData: {} };
    }
}

export async function deleteUserAccountAction(idToken?: string): Promise<{ success: boolean }> {
    try {
        const user = await getAuthenticatedUser(idToken);
        await adminAuth.deleteUser(user.uid);
        return { success: true };
    } catch (e) {
        handleServerAuthError(e, 'deleteUserAccountAction');
        return { success: false };
    }
}

// Firebase Auth has no concept of per-device sessions — revoking refresh tokens
// signs the account out everywhere except the current, still-valid ID token.
export async function signOutOtherSessionsAction(idToken?: string): Promise<{ success: boolean }> {
    try {
        const user = await getAuthenticatedUser(idToken);
        await adminAuth.revokeRefreshTokens(user.uid);
        return { success: true };
    } catch (e) {
        handleServerAuthError(e, 'signOutOtherSessionsAction');
        return { success: false };
    }
}

export async function sendVerificationEmailAction(email: string) {
    try {
        console.log(`Starting verification email action for: ${email}`);
        const verificationLink = await adminAuth.generateEmailVerificationLink(email);
        const result = await sendVerificationEmail(email, verificationLink);

        if (!result.success) {
            throw new Error(result.error);
        }

        const user = await adminAuth.getUserByEmail(email);
        await sendWelcomeEmailAction(user.email!, user.displayName || 'Pilot', `${BASE_URL}/dashboard`);

        return { success: true };
    } catch (error) {
        console.error('Error in sendVerificationEmailAction:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function markDevTestAccountVerifiedAction(email: string) {
    if (!isDevTestAccount(email)) {
        return { success: false, error: 'Not a dev test account.' };
    }
    try {
        const user = await adminAuth.getUserByEmail(email);
        await adminAuth.updateUser(user.uid, { emailVerified: true });
        return { success: true };
    } catch (error) {
        console.error('Error in markDevTestAccountVerifiedAction:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function approveApplicationAction(applicationId: string, idToken?: string) {
    try {
        await getAuthenticatedUser(idToken);
        const appRef = adminFirestore.collection('applications').doc(applicationId);
        await appRef.update({ status: 'approved', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        const appSnapshot = await appRef.get();
        const appData = appSnapshot.data()!;
        const user = await adminAuth.getUser(appData.userId);
        await sendApplicationApprovedEmail(user.email!, user.displayName || 'Pilot', `${BASE_URL}/dashboard`);
        return { success: true };
    } catch (error) {
        console.error('Error approving application:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function rejectApplicationAction(applicationId: string, reason: string, idToken?: string) {
    try {
        await getAuthenticatedUser(idToken);
        const appRef = adminFirestore.collection('applications').doc(applicationId);
        await appRef.update({ status: 'rejected', feedback: reason, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        const appSnapshot = await appRef.get();
        const appData = appSnapshot.data()!;
        const user = await adminAuth.getUser(appData.userId);
        await sendApplicationRejectedEmail(user.email!, user.displayName || 'Pilot', reason);
        return { success: true };
    } catch (error) {
        console.error('Error rejecting application:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function sendApplicationNeedsMoreInfoEmailAction(applicationId: string, requiredInfo: string, idToken?: string) {
    try {
        await getAuthenticatedUser(idToken);
        const appRef = adminFirestore.collection('applications').doc(applicationId);
        const appSnapshot = await appRef.get();
        const appData = appSnapshot.data()!;
        const user = await adminAuth.getUser(appData.userId);
        await sendApplicationNeedsMoreInfoEmail(user.email!, user.displayName || 'Pilot', requiredInfo, `${BASE_URL}/dashboard`);
        return { success: true };
    } catch (error) {
        console.error('Error sending needs more info email:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function sendWelcomeEmailAction(email: string, name: string, dashboardUrl: string) {
    try {
        const result = await sendWelcomeEmail(email, name, dashboardUrl);
        if (!result.success) throw new Error(result.error);
        return { success: true };
    } catch (error) {
        console.error('Error sending welcome email:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function sendPasswordChangedEmailAction(email: string, name: string, idToken?: string) {
    try {
        await getAuthenticatedUser(idToken);
        const resetLink = await adminAuth.generatePasswordResetLink(email);
        const result = await sendPasswordChangedEmail(email, name, new Date().toISOString(), resetLink);
        if (!result.success) throw new Error(result.error);
        return { success: true };
    } catch (error) {
        console.error('Error sending password changed email:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

/**
 * Automatically detects and links (migrates) Firestore data if a user logs in 
 * with a new account (e.g. Google) but had an existing email-based account.
 */
export async function detectAndLinkDuplicateAccountsAction(idToken: string) {
    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const newUid = decodedToken.uid;
        const email = decodedToken.email;

        if (!email) throw new Error("No email found in token.");

        // 1. Search for any OTHER user document with the same email
        const usersRef = adminFirestore.collection('users');
        const duplicateUsersQuery = await usersRef.where('email', '==', email).get();

        const oldUids: string[] = [];
        duplicateUsersQuery.forEach(doc => {
            if (doc.id !== newUid) {
                oldUids.push(doc.id);
            }
        });

        if (oldUids.length === 0) {
            return { success: true, linked: false };
        }

        console.log(`Linking detected for ${email}: Merging ${oldUids.length} old accounts into ${newUid}`);

        // 2. Perform Migration for each old UID found
        const batch = adminFirestore.batch();

        for (const oldUid of oldUids) {
            // A. Relink Applications
            const appsRef = adminFirestore.collection('applications');
            const userApps = await appsRef.where('userId', '==', oldUid).get();
            userApps.forEach(doc => {
                batch.update(doc.ref, { userId: newUid, updatedByMigration: true });
            });

            // B. Relink Notifications
            // Move subcollection (requires more than just a batch update, but we'll focus on apps for now)
            // For notifications, we can just delete the old ones or move them if critical.

            // C. Merge Profile Data if new profile is sparse
            const oldUserDoc = await usersRef.doc(oldUid).get();
            const oldData = oldUserDoc.data();
            if (oldData) {
                batch.set(usersRef.doc(newUid), {
                    displayName: oldData.displayName,
                    birthDate: oldData.birthDate,
                    photoURL: oldData.photoURL,
                    // keep existing or override if missing
                }, { merge: true });
            }

            // D. Remove/Mark the old user document to avoid re-detection
            batch.delete(usersRef.doc(oldUid));
        }

        await batch.commit();

        return { success: true, linked: true, count: oldUids.length };
    } catch (error) {
        console.error('Account linking failed:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function getCommunityStatsAction() {
    try {
        // Base figures, topped up with real counts from the platform as it grows
        const baseApplications = 286;
        const baseUnderReview = 587;
        const basePilots = 1876;

        const [appsSnapshot, underReviewSnapshot, usersSnapshot] = await Promise.all([
            adminFirestore.collection('applications').count().get(),
            adminFirestore.collection('applications').where('status', 'in', ['submitted', 'in_review', 'under_review']).count().get(),
            adminFirestore.collection('users').count().get(),
        ]);

        return {
            success: true,
            stats: {
                totalApplications: baseApplications + appsSnapshot.data().count,
                underReview: baseUnderReview + underReviewSnapshot.data().count,
                totalPilots: basePilots + usersSnapshot.data().count,
            }
        };
    } catch (error) {
        console.error('Failed to get community stats:', error);
        // Fallback stats in case of failure
        return {
            success: false,
            stats: {
                totalApplications: 286,
                underReview: 587,
                totalPilots: 1876,
            }
        };
    }
}

