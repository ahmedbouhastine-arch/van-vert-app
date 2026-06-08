
'use client';

import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Generic content-shaped placeholder shown while admin access is being verified.
// Kept route-agnostic since the guard wraps every /admin/* page.
function AdminGuardSkeleton() {
  return (
    <div>
      <div className="mb-8 space-y-2.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-[var(--vv-border)] bg-white">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-[var(--vv-border-soft)] px-6 py-4 last:border-b-0">
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-5 w-[100px] rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// This component protects routes that require admin or head-admin privileges.
export function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, claims, loading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (loading) {
            return; // Wait for the loading to complete
        }

        // If the user is not logged in, or doesn't have the required role, redirect.
        if (!user || !claims || !['admin', 'head-admin'].includes(claims.role)) {
            router.push('/dashboard'); // Redirect non-admins to the user dashboard
        }
    }, [user, claims, loading, router]);

    // To prevent a flicker of the admin page content before the redirect can happen,
    // we show a loading screen while auth state is loading or if the user is not authorized.
    if (loading || !user || !claims || !['admin', 'head-admin'].includes(claims.role)) {
        return <AdminGuardSkeleton />;
    }

    // If the user is authorized, render the children.
    return <>{children}</>;
}
