
'use client';

import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";

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
        return <LoadingScreen text="Verifying Access..." />;
    }

    // If the user is authorized, render the children.
    return <>{children}</>;
}
