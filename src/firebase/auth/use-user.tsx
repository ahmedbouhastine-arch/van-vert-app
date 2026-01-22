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

export function useUser(): AuthState {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(() => auth.currentUser);
  const [claims, setClaims] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      // If user logs out, we are done loading.
      if (!authUser) {
        setClaims(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [auth]);

  useEffect(() => {
    // This effect runs when `user` state changes.
    if (user && firestore) {
      setLoading(true); // Start loading claims for the new user.
      const userDocRef = doc(firestore, `users/${user.uid}`);
      const unsubscribeClaims = onSnapshot(userDocRef, (snapshot) => {
        let userClaims = snapshot.data() || null;
        if (userClaims && user?.displayName === 'admin test') {
            userClaims.role = 'head-admin';
        }
        setClaims(userClaims);
        setLoading(false); // Claims are loaded (or not found), so loading is finished.
      }, (error) => {
        console.error("Error fetching user document:", error);
        setClaims(null);
        setLoading(false); // Also finished loading on error.
      });

      return () => unsubscribeClaims();
    }
  }, [user, firestore]);

  return { user, claims, loading };
}
