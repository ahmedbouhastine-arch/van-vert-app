import { cookies } from 'next/headers';
import { initializeAdminApp } from './admin-init';

export const getAuthenticatedAppForUser = async () => {
    const { adminAuth, adminFirestore } = initializeAdminApp();
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
        return null;
    }

    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        const currentUser = await adminAuth.getUser(decodedToken.uid);
        return { currentUser, firestore: adminFirestore };
    } catch (error) {
        console.error("Error verifying session cookie:", error);
        return null;
    }
};
