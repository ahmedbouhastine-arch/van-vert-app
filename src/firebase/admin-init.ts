import admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';

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
    // Explicitly setting the storageBucket makes the connection more robust.
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: firebaseConfig.storageBucket,
    });
    
    return {
        adminAuth: admin.auth(),
        adminFirestore: admin.firestore(),
        adminStorage: admin.storage(),
    };
}
