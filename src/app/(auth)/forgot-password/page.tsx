'use client';
export const dynamic = 'force-dynamic';

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Lock, Mail } from "lucide-react";
import { VvButton } from "@/components/vv/VvButton";
import { VvCard } from "@/components/vv/VvCard";
import { VvInput } from "@/components/vv/VvInput";

function Logo() {
  return (
    <span className="font-outfit text-2xl font-bold tracking-tight">
      <span className="text-navy">Van-</span>
      <span className="text-sky">Vert</span>
    </span>
  );
}

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
            toast({
                title: 'Reset Link Sent',
                description: `A password reset link has been sent to ${email}.`,
            });
        } catch (error: unknown) {
            const err = (error as { code?: unknown; message?: unknown }) || {};
            let description = typeof err.message === 'string' ? err.message : 'Failed to send reset link.';
            if (typeof err.code === 'string' && err.code === 'auth/user-not-found') {
              description = "No account found with this email address.";
            }
            toast({
              variant: 'destructive',
              title: 'Failed to Send',
              description: description,
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="relative flex min-h-screen flex-col items-center bg-sky-mist px-6 py-10">
            <Link
                href="/"
                className="absolute left-6 top-6 flex items-center gap-2 rounded-full border border-vv-border bg-white px-4 py-2 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:text-navy md:left-10 md:top-10"
            >
                <ArrowLeft className="h-4 w-4" /> Home
            </Link>

            <div className="mt-24 w-full max-w-md md:mt-32">
                <div className="mb-8 flex justify-center">
                    <Logo />
                </div>

                <VvCard className="text-center">
                    {emailSent ? (
                        <>
                            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-status-ready-bg">
                                <Mail className="h-7 w-7 text-status-ready-text" />
                            </span>
                            <h1 className="mt-6 font-outfit text-2xl font-bold text-navy">Check your inbox</h1>
                            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-text-secondary">
                                We sent a password reset link to{" "}
                                <span className="font-semibold text-navy">{email}</span>. The link expires in 24 hours.
                            </p>

                            <div className="mt-6 rounded-xl border border-vv-border bg-surface p-5 text-left text-sm text-text-secondary">
                                <p className="mb-2 font-semibold text-navy">Didn&apos;t see it?</p>
                                <ul className="space-y-1.5">
                                    <li>· Check your spam or junk folder</li>
                                    <li>· Confirm the email above is correct</li>
                                    <li>· Wait 60 seconds before resending</li>
                                </ul>
                            </div>

                            <VvButton
                                size="lg"
                                className="mt-6 w-full"
                                loading={isSubmitting}
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
                            <Link href="/login" className="mt-4 inline-block text-sm font-medium text-sky hover:text-navy">
                                Back to login
                            </Link>
                        </>
                    ) : (
                        <>
                            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-pale">
                                <Lock className="h-7 w-7 text-sky" />
                            </span>
                            <h1 className="mt-6 font-outfit text-2xl font-bold text-navy">Reset your password</h1>
                            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-text-secondary">
                                Enter the email on your account. We&apos;ll send a secure link to set a new password — valid for 30 minutes.
                            </p>

                            <form onSubmit={handlePasswordReset} className="mt-6 flex flex-col gap-5 text-left">
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
                                <VvButton type="submit" size="lg" loading={isSubmitting} className="w-full">
                                    Send reset link
                                </VvButton>
                            </form>

                            <p className="mt-5 text-sm text-text-secondary">
                                Remembered it?{" "}
                                <Link href="/login" className="font-semibold text-sky hover:text-navy">Sign in</Link>
                            </p>
                        </>
                    )}
                </VvCard>
            </div>
        </div>
    );
}
