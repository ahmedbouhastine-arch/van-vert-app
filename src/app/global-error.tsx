'use client';

import { useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { VvButton } from '@/components/vv/VvButton';
import { Plane } from 'lucide-react';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Error:', error);

    // Attempt to log the user out
    try {
        const auth = getAuth();
        signOut(auth).catch((e) => {
            // Even if sign-out fails, we should still try to recover.
            console.error('Sign-out failed during error handling:', e);
        });
    } catch(e) {
        console.error('Failed to get auth instance during error handling', e);
    }
  }, [error]);

  const handleReturnToLogin = () => {
    // A hard redirect is safest to clear all application state.
    window.location.href = '/login';
  }

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--sky-mist)] p-4 text-[var(--text-primary)]">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <div className="absolute h-full w-full animate-spin rounded-full border-4 border-dashed border-[var(--status-missing)]"></div>
              <Plane className="h-10 w-10 text-[var(--status-missing)]" />
            </div>
            <h1 className="font-outfit text-3xl font-bold tracking-tight text-[var(--status-missing)]">
              Application Error
            </h1>
            <p className="max-w-md text-[var(--text-secondary)]">
              We&apos;re sorry, but something went wrong. The application has encountered an unrecoverable error. For your security, you have been logged out.
            </p>
            <VvButton onClick={handleReturnToLogin}>
              Return to Login Page
            </VvButton>
          </div>
        </div>
      </body>
    </html>
  );
}
