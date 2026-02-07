'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { useUser, useAuth } from '@/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MailCheck, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
    const { user, loading, claims } = useUser();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    // This effect handles all redirection logic for the page.
    useEffect(() => {
        if (loading) return;

        if (!user) {
            // If there's no user, they should be at the login page.
            router.push('/login');
            return;
        }

        // If the user's email is verified, send them to their dashboard.
        if (user.emailVerified) {
            const isAdmin = claims?.role === 'admin' || claims?.role === 'head-admin' || claims?.role === 'reviewer';
            const homePath = isAdmin ? '/admin' : '/dashboard';
            router.push(homePath);
            return;
        }

        // If the user is not verified, this effect will set up an interval
        // to periodically check their verification status.
        const interval = setInterval(async () => {
            // user.reload() fetches the latest user state from Firebase servers.
            await user.reload();
            // The global onAuthStateChanged listener in FirebaseProvider will detect
            // the change in `emailVerified` status and trigger a re-render,
            // which causes this useEffect to run again and handle the redirect.
        }, 5000); // Check every 5 seconds.

        // Cleanup function to clear the interval when the component unmounts.
        return () => clearInterval(interval);

    }, [user, loading, claims, router]);

    const handleResendVerification = () => {
        startTransition(async () => {
            if (user) {
                try {
                    await sendEmailVerification(user);
                    toast({
                        title: 'Verification Email Sent',
                        description: 'A new verification link has been sent to your email address.',
                    });
                } catch (error: any) {
                    toast({
                        variant: 'destructive',
                        title: 'Error Sending Email',
                        description: 'Failed to send verification email. Please try again in a moment.',
                    });
                }
            }
        });
    };

    // Show a loading screen while the initial user state is being determined,
    // or if the user is already verified and is being redirected.
    if (loading || !user || user.emailVerified) {
        return <LoadingScreen text="Verifying your status..." />;
    }

    // Render the verification prompt for unverified users.
    return (
        <Card className="w-full max-w-md">
            <CardHeader className="items-center text-center">
                <MailCheck className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-2xl font-headline">Verify Your Email</CardTitle>
                <CardDescription>
                    A verification link has been sent to <span className="font-semibold text-foreground">{user.email}</span>. Please check your inbox and click the link to continue.
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-6">
                    Didn't receive the email? Check your spam folder or click below to resend.
                </p>
                <Button onClick={handleResendVerification} disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Resend Verification Email
                </Button>
            </CardContent>
        </Card>
    );
}
