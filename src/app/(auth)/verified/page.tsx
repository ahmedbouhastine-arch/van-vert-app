'use client';
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

export default function VerifiedPage() {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => router.push('/dashboard'), 2200);
        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'var(--sky-mist)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 48,
            }}
        >
            <div
                className="animate-verified-pop"
                style={{
                    width: 80,
                    height: 80,
                    borderRadius: 20,
                    background: '#dcfce7',
                    color: 'var(--status-ready)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 28,
                }}
            >
                <CheckCircle className="h-10 w-10" />
            </div>

            <h1 className="vv-h1" style={{ fontSize: 32, textAlign: 'center' }}>
                Email verified
            </h1>
            <p
                style={{
                    marginTop: 12,
                    fontSize: 15,
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                    maxWidth: 400,
                }}
            >
                Your account is confirmed. Redirecting to your dashboard…
            </p>

            <div
                style={{
                    marginTop: 24,
                    width: 200,
                    height: 3,
                    borderRadius: 2,
                    background: 'var(--border)',
                    overflow: 'hidden',
                }}
            >
                <div
                    className="animate-verified-bar"
                    style={{
                        height: '100%',
                        background: 'var(--sky)',
                        borderRadius: 2,
                    }}
                />
            </div>
        </div>
    );
}
