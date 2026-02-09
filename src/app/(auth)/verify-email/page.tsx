
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/firebase';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function VerifyEmailPage() {
    const { user, loading, claims } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (loading) {
            return; // Wait for user and claims state to be determined
        }

        if (!user) {
            router.push('/login'); // Should not happen, but a safeguard
            return;
        }

        // IMPORTANT: Wait for claims to be loaded before deciding where to redirect.
        // This prevents race conditions on new user registration.
        if (claims) {
            const isAdmin = ['reviewer', 'admin', 'head-admin'].includes(claims.role);
            const homePath = isAdmin ? '/admin' : '/dashboard';
            router.push(homePath);
        }
        // If claims are not yet loaded, this effect does nothing and will re-run when they are.

    }, [user, loading, claims, router]);

    // Show a loading screen while waiting for the redirect.
    return <LoadingScreen text="Finalizing account setup..." />;
}
