
import admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';

// This ensures we only initialize the app once.
if (!admin.apps.length) {
  admin.initializeApp({
    // The credential will be Application Default Credentials.
    // This works automatically in App Hosting.
    // For local dev, you must run `gcloud auth application-default login` in your terminal.
    credential: admin.credential.applicationDefault(),
    // Explicitly providing the projectId from the config makes the initialization
    // robust for local development where the project ID might not be inferred.
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
  });
}

// Export the initialized services.
export const adminAuth = admin.auth();
export const adminFirestore = admin.firestore();
export const adminStorage = admin.storage();
