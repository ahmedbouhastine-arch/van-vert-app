
'use client';

import { GoogleAuthProvider, signInWithPopup, Auth } from "firebase/auth";
import { doc, setDoc, serverTimestamp, Firestore, getDoc, updateDoc, runTransaction } from "firebase/firestore";

export type SignInWithGoogleResult = { success: boolean; error?: string };

export const signInWithGoogle = async (auth: Auth, firestore: Firestore): Promise<SignInWithGoogleResult> => {
    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userRef = doc(firestore, "users", user.uid);

        await runTransaction(firestore, async (transaction) => {
            const docSnap = await transaction.get(userRef);

            if (docSnap.exists()) {
                transaction.update(userRef, {
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                });
            } else {
                transaction.set(userRef, {
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    role: 'user', // Default role
                    createdAt: serverTimestamp(),
                });
            }
        });

        return { success: true };
    } catch (error: unknown) {
        const err = (error as { code?: unknown; message?: unknown }) || {};
        // The user closing the popup is a normal flow, not an error to show.
        if (typeof err.code === 'string' && err.code === 'auth/popup-closed-by-user') {
            return { success: false };
        }
        return { success: false, error: typeof err.message === 'string' ? err.message : 'Login failed' };
    }
};
