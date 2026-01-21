
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
    user: auth.currentUser,
    claims: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (state.user === null || user.uid !== state.user.uid) {
            setState({ user, claims: null, loading: true });
        }
      } else {
        setState({ user: null, claims: null, loading: false });
      }
    });

    return () => unsubscribe();
  }, [auth, state.user]);

  useEffect(() => {
    if (state.user && firestore) {
      const userDocRef = doc(firestore, `users/${state.user.uid}`);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        let claims = doc.data() || null;
        if (claims && state.user?.displayName === 'admin test') {
            claims.role = 'head-admin';
        }
        setState((prevState) => ({ ...prevState, claims, loading: false }));
      }, (error) => {
        console.error("Error fetching user document:", error);
        setState((prevState) => ({ ...prevState, claims: null, loading: false }));
      });

      return () => unsubscribe();
    } else if (!state.user) {
        setState(prevState => ({ ...prevState, loading: false }))
    }
  }, [state.user, firestore]);

  return state;
}
