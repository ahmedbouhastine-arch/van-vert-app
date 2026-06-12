'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, LogOut, Mail } from 'lucide-react';
import { signOut } from 'firebase/auth';
import * as serverActions from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { VvButton } from '@/components/vv/VvButton';

function VerifyEmailSkeleton() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--sky-mist)] px-6 py-12">
            <div className="mb-7">
                <Skeleton className="h-7 w-28" />
            </div>
            <div className="w-full max-w-[480px] rounded-2xl border border-[var(--vv-border)] bg-white p-10">
                <div className="flex flex-col items-center text-center">
                    <Skeleton className="mb-6 h-16 w-16 rounded-2xl" />
                    <Skeleton className="mb-3 h-8 w-52" />
                    <Skeleton className="mb-1.5 h-4 w-72 max-w-full" />
                    <Skeleton className="h-4 w-56 max-w-full" />
                </div>
                <Skeleton className="mt-7 h-24 rounded-lg" />
                <div className="mt-6 flex flex-col gap-2.5">
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="mx-auto h-4 w-28" />
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    const { user, loading } = useUser();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isResending, setIsResending] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [resent, setResent] = useState(false);

    useEffect(() => {
        if (!loading && user?.emailVerified) {
            router.push('/onboarding');
        }
    }, [user, loading, router]);

    const handleResendVerification = async () => {
        if (!user || !user.email) return;
        setIsResending(true);
        try {
            const result = await serverActions.sendVerificationEmailAction(user.email);
            if (result.success) {
                setResent(true);
                setTimeout(() => setResent(false), 3000);
                toast({ title: "Verification Email Sent", description: "A new verification link has been sent to your email address." });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error("Resend failed:", error);
            toast({ variant: "destructive", title: "Resend Failed", description: error instanceof Error ? error.message : "Failed to resend. Please try again." });
        } finally {
            setIsResending(false);
        }
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await fetch('/api/auth/session/logout', { method: 'POST' });
            await signOut(auth);
            localStorage.clear();
            sessionStorage.clear();
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error("Logout failed:", error);
            setIsLoggingOut(false);
            toast({ variant: "destructive", title: "Logout Failed", description: "An error occurred while trying to log out. Please try again." });
        }
    };

    if (loading) {
        return <VerifyEmailSkeleton />;
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'var(--sky-mist)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 24px',
                position: 'relative',
            }}
        >
            {/* Back to home */}
            <Link
                href="/"
                style={{
                    position: 'absolute', top: 28, left: 32,
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    color: 'var(--text-secondary)', fontSize: 13,
                    padding: '8px 14px', borderRadius: 8,
                    background: 'white', border: '1px solid var(--border)',
                    transition: 'color 0.15s',
                }}
                className="hover:text-navy"
            >
                <ArrowLeft className="h-3.5 w-3.5" /> Home
            </Link>

            {/* Wordmark */}
            <div style={{ marginBottom: 28 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, letterSpacing: '-0.02em', lineHeight: 1 }}>
                    <span style={{ color: 'var(--navy)' }}>Van-</span>
                    <span style={{ color: 'var(--sky)' }}>Vert</span>
                </span>
            </div>

            {/* Card */}
            <div
                style={{
                    width: '100%', maxWidth: 480,
                    background: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    padding: 40,
                    textAlign: 'center',
                }}
            >
                {/* Icon */}
                <div style={{
                    width: 64, height: 64, borderRadius: 14,
                    background: 'var(--sky-pale)', color: 'var(--sky)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 24,
                }}>
                    <Mail className="h-7 w-7" />
                </div>

                <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 28, letterSpacing: '-0.01em', color: 'var(--navy)' }}>
                    Verify your email
                </h1>
                <p style={{ marginTop: 12, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                    We sent a verification link to{' '}
                    <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{user?.email}</span>.
                    {' '}Click the link to activate your account.
                </p>

                {/* Didn't see it */}
                <div style={{
                    marginTop: 28, padding: 18, borderRadius: 10,
                    background: 'var(--sky-mist)', border: '1px solid var(--border)',
                    textAlign: 'left',
                }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)', marginBottom: 8 }}>
                        Didn&apos;t see it?
                    </div>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {[
                            'Check your spam or junk folder',
                            'Confirm the email above is correct',
                            'Wait 60 seconds before resending',
                        ].map((t, i) => (
                            <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                <span style={{ color: 'var(--sky)', marginTop: 2 }}>·</span>
                                {t}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Resent confirmation */}
                {resent && (
                    <div style={{
                        marginTop: 16, padding: '10px 16px', borderRadius: 8,
                        background: '#dcfce7', color: 'var(--status-ready)',
                        fontSize: 13, fontWeight: 500,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                        ✓ Email sent — check your inbox
                    </div>
                )}

                {/* Actions */}
                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <VvButton
                        size="lg"
                        onClick={handleResendVerification}
                        disabled={isResending || isLoggingOut}
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        {isResending ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Resending...</>
                        ) : (
                            'Resend verification email'
                        )}
                    </VvButton>

                    <button
                        onClick={handleLogout}
                        disabled={isResending || isLoggingOut}
                        style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            fontSize: 14, fontWeight: 500,
                            color: 'var(--sky)', background: 'transparent', border: 'none',
                            cursor: 'pointer', padding: '10px 0',
                            transition: 'color 0.15s',
                            opacity: (isResending || isLoggingOut) ? 0.5 : 1,
                        }}
                        className="hover:text-navy"
                    >
                        {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                        Back to login
                    </button>
                </div>
            </div>
        </div>
    );
}
