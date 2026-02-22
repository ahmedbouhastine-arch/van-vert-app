import { getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Pre-warming Firebase Admin by initializing it at the module level.
// This helps prevent cold start delays and ensures the SDK is ready.

function initializeAdmin() {
  if (getApps().length > 0) {
    return getApp();
  }

  // When running on App Hosting, initializeApp() with no arguments
  // automatically discovers the project configuration and credentials.
  return initializeApp();
}

const adminApp = initializeAdmin();

export const adminAuth = getAuth(adminApp);
export const adminFirestore = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
