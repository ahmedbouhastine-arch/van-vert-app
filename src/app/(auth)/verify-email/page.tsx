'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUser, useAuth } from '@/firebase';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, LogOut } from 'lucide-react';

export default function VerifyEmailPage() {
    const { user, loading, claims } = useUser();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (loading) {
            return;
        }
        if (!user) {
            router.push('/login');
            return;
        }

        // If email is verified, redirect away from this page.
        // Also check for claims to ensure profile is loaded.
        if (user.emailVerified && claims) {
            const isAdmin = ['reviewer', 'admin', 'head-admin'].includes(claims.role);
            const homePath = isAdmin ? '/admin' : '/dashboard';
            router.push(homePath);
        }
    }, [user, loading, claims, router]);
    
    const handleResendVerification = async () => {
        if (!user) return;
        setIsSending(true);
        try {
            await sendEmailVerification(user);
            toast({
                title: "Verification Email Sent",
                description: `A new verification link has been sent to ${user.email}.`,
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to Send',
                description: "There was an error sending the verification email. Please try again shortly.",
            });
        } finally {
            setIsSending(false);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    // While loading user state or if user is verified (and about to be redirected)
    if (loading || (user && user.emailVerified)) {
        return <LoadingScreen text="Checking verification status..." />;
    }

    // If user is loaded but not verified
    return (
        <Card>
            <CardHeader className="items-center text-center">
                <Mail className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-2xl font-headline">Verify Your Email</CardTitle>
                <CardDescription>
                    A verification link has been sent to your email address: <span className="font-semibold text-foreground">{user?.email}</span>. Please click the link to continue.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <Button onClick={handleResendVerification} disabled={isSending}>
                    {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Resend Verification Email
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                    After verifying, you may need to log in again.
                </p>
            </CardContent>
            <CardFooter>
                 <Button variant="outline" className="w-full" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </CardFooter>
        </Card>
    );
}
