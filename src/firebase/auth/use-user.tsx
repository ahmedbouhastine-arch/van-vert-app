'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useAuth, useFirestore } from '../provider';
import { doc, onSnapshot, type DocumentData } from 'firebase/firestore';

interface AuthState {
  user: User | null;
  claims: DocumentData | null;
  loading: boolean;
}

const UserContext = createContext<AuthState | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const firestore = useFirestore();
  const [state, setState] = useState<AuthState>({
      user: null,
      claims: null,
      loading: true,
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
          // User is signed in.
          if (!firestore) return;
          const userDocRef = doc(firestore, `users/${authUser.uid}`);
          const unsubscribeClaims = onSnapshot(userDocRef, (snapshot) => {
              let userClaims = snapshot.data() || null;
              if (userClaims && authUser?.displayName === 'admin test') {
                  userClaims.role = 'head-admin';
              }
              setState({ user: authUser, claims: userClaims, loading: false });
          }, (error) => {
              console.error("Error fetching user document:", error);
              setState({ user: authUser, claims: null, loading: false });
          });
          return unsubscribeClaims;
      } else {
          // User is signed out.
          setState({ user: null, claims: null, loading: false });
          return;
      }
    });

    return () => unsubscribeAuth();
  }, [auth, firestore]);
  
  return <UserContext.Provider value={state}>{children}</UserContext.Provider>;
}

export function useUser(): AuthState {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
