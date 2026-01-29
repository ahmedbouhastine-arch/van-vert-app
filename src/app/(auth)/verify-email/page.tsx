
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/firebase';
import { getAuth, signOut, sendEmailVerification } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function VerifyEmailPage() {
    const { user, loading } = useUser();
    const router = useRouter();
    const auth = getAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (loading) {
            return;
        }
        if (!user) {
            router.push('/login');
            return;
        }
        if (user.emailVerified) {
            const homePath = user.providerData?.[0]?.providerId === 'password' ? '/dashboard' : '/admin';
            router.push(homePath);
        }
    }, [user, loading, router]);

    const handleResend = async () => {
        if (user) {
            try {
                await sendEmailVerification(user);
                toast({
                    title: 'Email Sent',
                    description: 'A new verification email has been sent to your address.',
                });
            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: error.message,
                });
            }
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    if (loading || !user || user.emailVerified) {
        return <LoadingScreen text="Checking verification status..." />;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl font-headline">Verify Your Email</CardTitle>
                <CardDescription>
                    A verification link has been sent to your email address: <strong>{user.email}</strong>.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    Please check your inbox (and spam folder) and click the link to complete your registration. This page will automatically redirect once your email is verified.
                </p>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-4">
                 <Button onClick={handleResend}>Resend Verification Email</Button>
                 <Button variant="outline" onClick={handleLogout}>Log Out</Button>
            </CardFooter>
        </Card>
    );
}
