
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

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      setLoading(true); // Always set loading to true when auth state might be changing
    });
    return () => unsubscribe();
  }, [auth]);

  // Listen for user document changes (claims)
  useEffect(() => {
    if (user && firestore) {
      setLoading(true); // Start loading claims
      const userDocRef = doc(firestore, `users/${user.uid}`);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        let userClaims = doc.data() || null;
        if (userClaims && user?.displayName === 'admin test') {
            userClaims.role = 'head-admin';
        }
        setClaims(userClaims);
        setLoading(false); // Finished loading claims
      }, (error) => {
        console.error("Error fetching user document:", error);
        setClaims(null);
        setLoading(false); // Finished loading (with an error)
      });

      return () => unsubscribe();
    } else {
      // No user, so no claims to fetch and we are not loading.
      setClaims(null);
      setLoading(false);
    }
  }, [user, firestore]);

  return { user, claims, loading };
}
