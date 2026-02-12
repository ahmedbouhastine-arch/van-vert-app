
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage';
import admin from 'firebase-admin';

// Client-side SDK initialization
export function initializeFirebase() {
  if (getApps().length) {
    const app = getApp();
    return getSdks(app);
  }
  const firebaseApp = initializeApp(firebaseConfig);
  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp)
  };
}

// Admin SDK initialization (for server-side use)
export function initializeAdminApp() {
    if (admin.apps.length > 0) {
        return {
            adminAuth: admin.auth(),
            adminFirestore: admin.firestore(),
            adminStorage: admin.storage(),
        };
    }

    // Initialize the admin app. It will automatically use Application Default Credentials
    // when running in a Google Cloud environment like App Hosting.
    admin.initializeApp({
        storageBucket: firebaseConfig.storageBucket,
    });
    
    return {
        adminAuth: admin.auth(),
        adminFirestore: admin.firestore(),
        adminStorage: admin.storage(),
    };
}
