
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
  // Explicitly pass the storage bucket from the config to ensure the
  // correct bucket is used, especially in server-side environments where
  // auto-detection can be less reliable.
  const storage = getStorage(firebaseApp, firebaseConfig.storageBucket);

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: storage
  };
}
