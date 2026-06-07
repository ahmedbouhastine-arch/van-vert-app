'use client';
export const dynamic = 'force-dynamic';

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Lock, Mail } from "lucide-react";
import { VvButton } from "@/components/vv/VvButton";
import { VvInput } from "@/components/vv/VvInput";

export default function ForgotPasswordPage() {
    const { toast } = useToast();
    const auth = useAuth();
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handlePasswordReset = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setEmailSent(true);
            toast({ title: 'Reset Link Sent', description: `A password reset link has been sent to ${email}.` });
        } catch (error: unknown) {
            const err = (error as { code?: unknown; message?: unknown }) || {};
            let description = typeof err.message === 'string' ? err.message : 'Failed to send reset link.';
            if (typeof err.code === 'string' && err.code === 'auth/user-not-found') {
                description = "No account found with this email address.";
            }
            toast({ variant: 'destructive', title: 'Failed to Send', description });
        } finally {
            setIsSubmitting(false);
        }
    };

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
            <div style={{
                width: '100%', maxWidth: 440,
                background: 'white',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: 40,
            }}>
                {emailSent ? (
                    <>
                        {/* Success state */}
                        <div style={{
                            width: 56, height: 56, borderRadius: 12,
                            background: '#dcfce7', color: 'var(--status-ready)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: 20,
                        }}>
                            <Mail className="h-6 w-6" />
                        </div>

                        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 26, letterSpacing: '-0.01em', color: 'var(--navy)' }}>
                            Check your inbox
                        </h1>
                        <p style={{ marginTop: 10, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 340 }}>
                            We sent a password reset link to{' '}
                            <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{email}</span>. The link expires in 24 hours.
                        </p>

                        <div style={{
                            marginTop: 28, padding: 18, borderRadius: 10,
                            background: 'var(--sky-mist)', border: '1px solid var(--border)',
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

                        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <VvButton
                                size="lg"
                                loading={isSubmitting}
                                style={{ width: '100%', justifyContent: 'center' }}
                                onClick={async () => {
                                    setIsSubmitting(true);
                                    try {
                                        await sendPasswordResetEmail(auth, email);
                                        toast({ title: 'Reset Link Sent', description: `A new link has been sent to ${email}.` });
                                    } catch {
                                        toast({ variant: 'destructive', title: 'Failed to Send', description: 'Please try again.' });
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }}
                            >
                                Resend reset link
                            </VvButton>
                            <Link
                                href="/login"
                                style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', display: 'block' }}
                            >
                                Remembered it?{' '}
                                <span style={{ color: 'var(--sky)', fontWeight: 600 }}>Sign in</span>
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Form state */}
                        <div style={{
                            width: 56, height: 56, borderRadius: 12,
                            background: 'var(--sky-pale)', color: 'var(--sky)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: 20,
                        }}>
                            <Lock className="h-6 w-6" />
                        </div>

                        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 26, letterSpacing: '-0.01em', color: 'var(--navy)' }}>
                            Reset your password
                        </h1>
                        <p style={{ marginTop: 10, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            Enter the email on your account. We&apos;ll send a secure link to set a new password — valid for 30 minutes.
                        </p>

                        <form
                            onSubmit={handlePasswordReset}
                            style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 16 }}
                        >
                            <VvInput
                                id="email"
                                name="email"
                                type="email"
                                label="Email"
                                placeholder="pilot@vanvert.co"
                                leftIcon={<Mail className="h-4 w-4" />}
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <VvButton type="submit" size="lg" loading={isSubmitting} style={{ width: '100%', justifyContent: 'center' }}>
                                Send reset link
                            </VvButton>
                        </form>

                        <div style={{ marginTop: 24, fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
                            Remembered it?{' '}
                            <Link href="/login" style={{ color: 'var(--sky)', fontWeight: 600 }}>Sign in</Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
