
'use client';

import { initializeFirebase } from '.';
import { FirebaseProvider } from './provider';

const { app, firestore, auth } = initializeFirebase();

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseProvider app={app} firestore={firestore} auth={auth}>
      {children}
    </FirebaseProvider>
  );
}
