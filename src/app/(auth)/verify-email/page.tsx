'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useTransition } from 'react';
import { useUser, useAuth } from '@/firebase';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MailCheck, Loader2, LogOut, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function VerifyEmailPage() {
    const { user, loading, claims } = useUser();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isResending, startResendTransition] = useTransition();
    const [isSigningOut, startSignOutTransition] = useTransition();

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
        startResendTransition(async () => {
            if (user) {
                try {
                    const actionCodeSettings = {
                        url: `${window.location.origin}/verified`,
                        handleCodeInApp: true,
                    };
                    await sendEmailVerification(user, actionCodeSettings);
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

    const handleSignOut = () => {
        startSignOutTransition(async () => {
            try {
                await signOut(auth);
                router.push('/login');
                toast({
                    title: 'Logged Out',
                    description: 'You have been successfully logged out.',
                });
            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'Logout Failed',
                    description: error.message,
                });
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
                    A verification link has been sent to <span className="font-semibold text-foreground">{user.email}</span>. Please click the link to continue.
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <Alert className="mb-6 text-left">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Can't find the email?</AlertTitle>
                    <AlertDescription>
                        If you don&apos;t see the email in your inbox, please check your spam folder.
                    </AlertDescription>
                </Alert>
                
                <Button onClick={handleResendVerification} disabled={isResending || isSigningOut}>
                    {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Resend Verification Email
                </Button>
            </CardContent>
            <CardFooter className="flex-col gap-2 pt-4 border-t">
                 <Button onClick={handleSignOut} variant="outline" className="w-full" disabled={isSigningOut || isResending}>
                    {isSigningOut ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <LogOut className="mr-2 h-4 w-4" />
                    )}
                    Sign Out
                </Button>
                <p className="text-xs text-muted-foreground">Or, sign out and try logging in again.</p>
            </CardFooter>
        </Card>
    );
}
