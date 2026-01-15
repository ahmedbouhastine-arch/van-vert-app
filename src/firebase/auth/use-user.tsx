
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, onIdTokenChanged, type User } from 'firebase/auth';
import { useAuth, useFirestore } from '../provider';
import { doc, onSnapshot, type DocumentData } from 'firebase/firestore';

interface AuthState {
  user: User | null;
  claims: DocumentData | null;
  loading: boolean;
}

export function useUser() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [state, setState] = useState<AuthState>({
    user: auth.currentUser,
    claims: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setState((prevState) => ({ ...prevState, user, loading: false }));
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (state.user) {
      const claimsSub = onIdTokenChanged(state.user, async (user) => {
        setState((prevState) => ({ ...prevState, user, loading: true }));
      });
      
      const userDocRef = doc(firestore, `users/${state.user.uid}`);
      const userSub = onSnapshot(userDocRef, (doc) => {
        const claims = doc.data();
        setState((prevState) => ({ ...prevState, claims, loading: false }));
      });

      return () => {
        claimsSub();
        userSub();
      }
    }
  }, [state.user, firestore]);

  return state;
}
