
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, signOut } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  claims: DocumentData | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
  storage: FirebaseStorage | null; // The Storage service instance
  // User authentication state
  user: User | null;
  claims: DocumentData | null;
  isUserLoading: boolean; // True during initial auth check
  userError: Error | null; // Error from auth listener
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  user: User | null;
  claims: DocumentData | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult {
  user: User | null;
  claims: DocumentData | null;
  loading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
  storage,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    claims: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth) {
      setUserAuthState({ user: null, claims: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }
  
    setUserAuthState({ user: null, claims: null, isUserLoading: true, userError: null });

    let unsubscribeClaims: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (authUser) => {
        console.log("FirebaseProvider: onAuthStateChanged fired. authUser:", !!authUser);
        // Clean up any existing claims listener before creating a new one
        if (unsubscribeClaims) {
          try { unsubscribeClaims(); } catch (e) { /* ignore */ }
          unsubscribeClaims = null;
        }

        if (authUser) {
            console.log("FirebaseProvider: User authenticated, getting ID token");
            // User is authenticated on the client.
            // Create the server-side session cookie, then load claims.
            authUser.getIdToken().then(idToken => {
                console.log("FirebaseProvider: ID token received, creating session");
                fetch('/api/auth/session', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${idToken}` }
                })
                .then(res => {
                    console.log("FirebaseProvider: Session creation response:", res.status);
                    // Session cookie created. Now load user claims.
                    if (!firestore) {
                        setUserAuthState({ user: authUser, claims: null, isUserLoading: false, userError: new Error("Firestore not available") });
                        return;
                    }
                    const userDocRef = doc(firestore, `users/${authUser.uid}`);
                    unsubscribeClaims = onSnapshot(userDocRef, 
                        (snapshot) => {
                            const userClaims = snapshot.data() || null;
                            console.log("FirebaseProvider: User claims loaded:", !!userClaims);
                            setUserAuthState({ user: authUser, claims: userClaims, isUserLoading: false, userError: null });
                        },
                        (error) => {
                            console.error("FirebaseProvider: onSnapshot error:", error);
                            setUserAuthState({ user: authUser, claims: null, isUserLoading: false, userError: error });
                        }
                    );
                })
                .catch(err => {
                    // This is a critical failure. The server session could not be created.
                    console.error("Fatal: Failed to set session cookie. Logging out.", err);
                    signOut(auth); // Force logout for safety.
                    setUserAuthState({ user: null, claims: null, isUserLoading: false, userError: err });
                });
            });
        } else {
          console.log("FirebaseProvider: No user, clearing session");
          // User is signed out. Clear the server session cookie.
          fetch('/api/auth/session/logout', { method: 'POST' })
            .then(res => console.log("FirebaseProvider: Logout session response:", res.status))
            .catch(err => console.error("FirebaseProvider: Logout session error:", err))
            .finally(() => {
               console.log("FirebaseProvider: Setting loading to false");
               setUserAuthState({ user: null, claims: null, isUserLoading: false, userError: null });
            });
        }
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, claims: null, isUserLoading: false, userError: error });
      }
    );
  
    // Return cleanup that unsubscribes both auth and claims listeners
    return () => {
      try { unsubscribeAuth(); } catch (e) { /* ignore */ }
      if (unsubscribeClaims) {
        try { unsubscribeClaims(); } catch (e) { /* ignore */ }
      }
    };
  }, [auth, firestore]);

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth && storage);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      storage: servicesAvailable ? storage : null,
      user: userAuthState.user,
      claims: userAuthState.claims,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, storage, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth || !context.storage) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    storage: context.storage,
    user: context.user,
    claims: context.claims,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase Storage instance. */
export const useStorage = (): FirebaseStorage => {
  const { storage } = useFirebase();
  return storage as FirebaseStorage;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => {
  const { user, claims, isUserLoading, userError } = useFirebase();
  return { user, claims, loading: isUserLoading, userError };
};
