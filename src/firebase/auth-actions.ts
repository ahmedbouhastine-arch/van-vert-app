import {Auth, GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo} from "firebase/auth";
import {Firestore, doc, getDoc, setDoc, serverTimestamp} from "firebase/firestore";

export type SignInWithGoogleResult = { success: boolean; error?: string; isNewUser?: boolean };

export const signInWithGoogle = async (auth: Auth, firestore: Firestore): Promise<SignInWithGoogleResult> => {
    const provider = new GoogleAuthProvider();
    try {
        const credential = await signInWithPopup(auth, provider);
        const userInfo = getAdditionalUserInfo(credential);
        const user = credential.user;

        if (userInfo?.isNewUser) {
            // New user signed up using Google. We need to initialize their profile.
            await setDoc(doc(firestore, "users", user.uid), {
                displayName: user.displayName || 'Pilot',
                email: user.email,
                role: 'user', // Default role for Google SSO
                createdAt: serverTimestamp(),
                photoURL: user.photoURL || null
            }, { merge: true }); // Use merge in case some other trigger created it
        } else {
             // Just safely ensure they exist in Firestore if it was somehow skipped
             const userDoc = await getDoc(doc(firestore, "users", user.uid));
             if (!userDoc.exists()) {
                 await setDoc(doc(firestore, "users", user.uid), {
                    displayName: user.displayName || 'Pilot',
                    email: user.email,
                    role: 'user',
                    createdAt: serverTimestamp(),
                    photoURL: user.photoURL || null
                });
             }
        }

        return { success: true, isNewUser: userInfo?.isNewUser };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};
