import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  // If an app is already initialized, return its SDKs.
  if (getApps().length) {
    return getSdks(getApp());
  }

  // Otherwise, initialize a new app with the provided config.
  const firebaseApp = initializeApp(firebaseConfig);
  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  // Explicitly provide the bucket URL to getStorage to ensure the correct bucket is used.
  // This helps prevent "404 Not Found" errors if automatic detection fails.
  const storage = getStorage(firebaseApp, `gs://${firebaseConfig.storageBucket}`);

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: storage
  };
}
