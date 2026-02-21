import { getApps, initializeApp, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { firebaseConfig } from '@/firebase/config';

// Pre-warming Firebase Admin by initializing it at the module level.
// This helps prevent cold start delays and ensures the SDK is ready.

function initializeAdmin() {
  if (getApps().length === 0) {
    // In many environments, Application Default Credentials (ADC) are used automatically.
    // If you need to use a specific service account key, you would pass it to `cert()`.
    return initializeApp({
      storageBucket: firebaseConfig.storageBucket,
    });
  }
  return getApp();
}

const adminApp = initializeAdmin();

export const adminFirestore = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
