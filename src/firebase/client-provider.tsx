
'use client';

import { initializeFirebase } from '.';
import { FirebaseProvider } from './provider';
import { UserProvider } from './auth/use-user';

const { app, firestore, auth } = initializeFirebase();

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseProvider app={app} firestore={firestore} auth={auth}>
      <UserProvider>
        {children}
      </UserProvider>
    </FirebaseProvider>
  );
}
