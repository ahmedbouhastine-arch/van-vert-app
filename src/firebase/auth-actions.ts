
import {Auth, getAuth, GoogleAuthProvider, signInWithPopup} from "firebase/auth";
import {Firestore} from "firebase/firestore";

export type SignInWithGoogleResult = { success: boolean; error?: string };

export const signInWithGoogle = async (auth: Auth, firestore: Firestore): Promise<SignInWithGoogleResult> => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};
