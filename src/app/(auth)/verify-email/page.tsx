
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
            return; // Wait for user state to be determined
        }

        if (!user) {
            router.push('/login'); // Should not happen, but a safeguard
            return;
        }

        // Redirect based on role, effectively bypassing verification
        const isAdmin = claims?.role && ['admin', 'head-admin', 'reviewer'].includes(claims.role);
        const homePath = isAdmin ? '/admin' : '/dashboard';
        router.push(homePath);

    }, [user, loading, claims, router]);

    // Show a loading screen while the redirect is happening
    return <LoadingScreen text="Finalizing login..." />;
}
