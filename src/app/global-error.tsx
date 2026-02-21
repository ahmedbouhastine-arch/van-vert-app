'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plane } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <div className="absolute h-full w-full animate-spin rounded-full border-4 border-dashed border-destructive"></div>
              <Plane className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold font-headline tracking-tight text-destructive">
              Application Error
            </h1>
            <p className="max-w-md text-muted-foreground">
              An error occurred. Details are below.
            </p>
            <div className="mt-4 w-full max-w-2xl rounded-md bg-muted p-4 text-left">
                <h2 className="text-lg font-semibold text-destructive">Error Details:</h2>
                <pre className="mt-2 whitespace-pre-wrap break-words text-sm text-destructive-foreground">
                  {error.message}
                </pre>
                <h3 className="mt-4 text-md font-semibold text-destructive">Stack Trace:</h3>
                <pre className="mt-2 whitespace-pre-wrap break-words text-sm text-destructive-foreground">
                  {error.stack}
                </pre>
            </div>
            <Button onClick={() => reset()} variant="outline">
              Try to Recover
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
