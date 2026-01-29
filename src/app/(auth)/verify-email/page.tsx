
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
            return;
        }
        if (!user) {
            router.push('/login');
            return;
        }
        
        // Always redirect away from this page if user is logged in
        const isAdmin = claims?.role === 'admin' || claims?.role === 'head-admin' || claims?.role === 'reviewer';
        const homePath = isAdmin ? '/admin' : '/dashboard';
        router.push(homePath);

    }, [user, loading, claims, router]);

    // Show a loading screen while redirecting
    return <LoadingScreen text="Redirecting..." />;
}
