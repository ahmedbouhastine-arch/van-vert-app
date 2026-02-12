import { firebaseConfig } from '@/firebase/config';
import admin from 'firebase-admin';

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
