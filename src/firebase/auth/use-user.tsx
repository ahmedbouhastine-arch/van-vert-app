
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
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
    user: null, // Start with null user
    claims: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setState({ user, claims: null, loading: true }); // Set loading to true while we fetch claims
      } else {
        setState({ user: null, claims: null, loading: false });
      }
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (state.user && firestore) {
      const userDocRef = doc(firestore, `users/${state.user.uid}`);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        const claims = doc.data() || null;
        setState((prevState) => ({ ...prevState, claims, loading: false }));
      }, (error) => {
        console.error("Error fetching user document:", error);
        setState((prevState) => ({ ...prevState, claims: null, loading: false }));
      });

      return () => unsubscribe();
    }
  }, [state.user, firestore]);

  return state;
}
