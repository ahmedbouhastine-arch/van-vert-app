'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, LogOut, Mail } from 'lucide-react';
import { signOut } from 'firebase/auth';
import * as serverActions from '@/app/actions';
import { LoadingScreen } from '@/components/LoadingScreen';
import { VvButton } from '@/components/vv/VvButton';
import { VvCard } from '@/components/vv/VvCard';

function Logo() {
  return (
    <span className="font-outfit text-2xl font-bold tracking-tight">
      <span className="text-navy">Van-</span>
      <span className="text-sky">Vert</span>
    </span>
  );
}

export default function VerifyEmailPage() {
  const { user, loading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!loading && user?.emailVerified) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleResendVerification = async () => {
    if (!user || !user.email) return;

    setIsResending(true);
    try {
        const result = await serverActions.sendVerificationEmailAction(user.email);
        if (result.success) {
            toast({
                title: "Verification Email Sent",
                description: "A new verification link has been sent to your email address."
            });
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error("Resend failed:", error);
        toast({
            variant: "destructive",
            title: "Resend Failed",
            description: error instanceof Error ? error.message : "Failed to resend verification email. Please try again later."
        });
    } finally {
        setIsResending(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // 1. Clear server-side session
      await fetch('/api/auth/session/logout', { method: 'POST' });

      // 2. Sign out from Firebase Client SDK
      await signOut(auth);

      // 3. Clear local storage for a fresh state
      localStorage.clear();
      sessionStorage.clear();

      // 4. Redirect to login
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error("Logout failed during verification:", error);
      setIsLoggingOut(false);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "An error occurred while trying to log out. Please try again."
      });
    }
  };

  if (loading) {
    return <LoadingScreen text="Checking your account..." />;
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-sky-mist px-6 py-10">
      <Link
        href="/"
        className="absolute left-6 top-6 flex items-center gap-2 rounded-full border border-[var(--vv-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--text-secondary)] shadow-sm transition-colors hover:text-navy md:left-10 md:top-10"
      >
        <ArrowLeft className="h-4 w-4" /> Home
      </Link>

      <div className="mt-24 w-full max-w-md md:mt-32">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <VvCard className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-pale">
            <Mail className="h-7 w-7 text-sky" />
          </span>
          <h1 className="mt-6 font-outfit text-2xl font-bold text-navy">Verify your email</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-[var(--text-secondary)]">
            We sent a verification link to <span className="font-semibold text-navy">{user?.email}</span>. Click the link to activate your account.
          </p>

          <div className="mt-6 rounded-xl border border-[var(--vv-border)] bg-surface p-5 text-left text-sm text-[var(--text-secondary)]">
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
            onClick={handleResendVerification}
            disabled={isResending || isLoggingOut}
          >
            {isResending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Resending...
              </>
            ) : (
              "Resend verification email"
            )}
          </VvButton>

          <button
            onClick={handleLogout}
            disabled={isResending || isLoggingOut}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-sky transition-colors hover:text-navy disabled:opacity-50"
          >
            {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Back to login
          </button>
        </VvCard>
      </div>
    </div>
  );
}
