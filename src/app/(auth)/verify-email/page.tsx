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

    useEffect(() => {
        if (loading) {
            return;
        }
        if (!user) {
            router.push('/login');
            return;
        }

        if (user.emailVerified) {
            const isAdmin = claims?.role === 'admin' || claims?.role === 'head-admin' || claims?.role === 'reviewer';
            const homePath = isAdmin ? '/admin' : '/dashboard';
            router.push(homePath);
            return;
        }

        const interval = setInterval(async () => {
            const currentUser = auth.currentUser;
            if (currentUser) {
                await currentUser.reload();
                if (currentUser.emailVerified) {
                    clearInterval(interval);
                    router.refresh();
                }
            }
        }, 3000); 

        return () => clearInterval(interval);

    }, [user, loading, claims, auth, router]);

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

    if (loading || !user || user.emailVerified) {
        return <LoadingScreen text="Verifying your status..." />;
    }

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
                        If you don't see the email in your inbox, please check your spam or junk folder.
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
                    Sign Out & Return to Login
                </Button>
            </CardFooter>
        </Card>
    );
}
