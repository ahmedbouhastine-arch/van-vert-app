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

    // When running locally, the Admin SDK needs the project ID explicitly.
    // In a deployed Google Cloud environment (like App Hosting), it uses Application
    // Default Credentials and can discover the project ID automatically.
    // Providing the config here makes the initialization robust for both environments.
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
    });
    
    return {
        adminAuth: admin.auth(),
        adminFirestore: admin.firestore(),
        adminStorage: admin.storage(),
    };
}
