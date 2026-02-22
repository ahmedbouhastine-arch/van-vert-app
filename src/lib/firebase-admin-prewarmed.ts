import admin from 'firebase-admin';
import { getApps, initializeApp, getApp } from 'firebase-admin/app';

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

initializeAdmin();

// Use the namespaced API which can be more robust against bundler issues.
export const adminAuth = admin.auth();
export const adminFirestore = admin.firestore();
export const adminStorage = admin.storage();
