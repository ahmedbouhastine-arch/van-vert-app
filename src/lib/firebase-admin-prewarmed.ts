
import admin from 'firebase-admin';
import { getApps, initializeApp } from 'firebase-admin/app';
import { firebaseConfig } from '@/firebase/config';

// Pre-warming Firebase Admin by initializing it at the module level.
// This helps prevent cold start delays and ensures the SDK is ready.
if (getApps().length === 0) {
  // When running on App Hosting, initializeApp() with no arguments and Application
  // Default Credentials (ADC) is sufficient. However, for local development,
  // the Admin SDK needs the project ID explicitly. Providing the config
  // from a client-side file ensures it works in both scenarios without needing
  // a separate server-side config file.
  initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
  });
}

// Use the namespaced API which can be more robust against bundler issues.
export const adminAuth = admin.auth();
export const adminFirestore = admin.firestore();
export const adminStorage = admin.storage();
