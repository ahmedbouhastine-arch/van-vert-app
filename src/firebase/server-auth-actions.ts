
import { headers } from 'next/headers';
import { initializeAdminApp } from './admin-init';

export const getAuthenticatedAppForUser = async () => {
    const { adminAuth, adminFirestore } = initializeAdminApp();
    const idToken = headers().get('Authorization')?.split('Bearer ')[1];

    if (!idToken) {
        return null;
    }

    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const currentUser = await adminAuth.getUser(decodedToken.uid);
        return { currentUser, firestore: adminFirestore };
    } catch (error) {
        console.error("Error getting authenticated user:", error);
        return null;
    }
};
