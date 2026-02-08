
'use client';

import { GoogleAuthProvider, signInWithPopup, Auth } from "firebase/auth";
import { doc, setDoc, serverTimestamp, Firestore, getDoc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export const signInWithGoogle = async (auth: Auth, firestore: Firestore) => {
    const provider = new GoogleAuthProvider();
    const { toast } = useToast();

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userRef = doc(firestore, "users", user.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            // Existing user: Update profile info that might change from Google,
            // but leave role and createdAt untouched to preserve admin changes.
            await updateDoc(userRef, {
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
            });
        } else {
            // New user: Create the document with an initial role and timestamp.
            await setDoc(userRef, {
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                role: user.email === 'head-admin@test.va' ? 'head-admin' : 'user',
                createdAt: serverTimestamp(),
            });
        }
        
    } catch (error: any) {
        // The user closing the popup is a normal flow, not an error to show.
        if (error.code === 'auth/popup-closed-by-user') {
            return;
        }
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: error.message,
        });
    }
};
