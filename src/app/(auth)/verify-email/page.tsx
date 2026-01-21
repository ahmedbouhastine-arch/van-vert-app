'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, sendEmailVerification, signOut } from 'firebase/auth';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function VerifyEmailPage() {
  const { user, loading, claims } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth();
  const [isSending, startResendTransition] = useTransition();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.emailVerified) {
      const isAdmin = claims?.role === 'admin';
      const homePath = isAdmin ? '/admin' : '/dashboard';
      router.push(homePath);
    }
  }, [user, loading, claims, router]);

  const handleResendVerification = () => {
    if (!user) return;
    startResendTransition(async () => {
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
          description: error.message,
        });
      }
    });
  };

  const handleRefresh = async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    // The useEffect hook will detect the change in user.emailVerified and redirect
    if (auth.currentUser.emailVerified) {
        const isAdmin = claims?.role === 'admin';
        const homePath = isAdmin ? '/admin' : '/dashboard';
        router.push(homePath);
    } else {
        toast({
            variant: "destructive",
            title: "Email Not Verified",
            description: "Please check your inbox and click the verification link.",
        })
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading || !user || user.emailVerified) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Check Your Inbox</CardTitle>
          <CardDescription>
            We've sent a verification link to <strong>{user.email}</strong>. Please
            click the link in the email to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button onClick={handleResendVerification} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
              </>
            ) : (
              'Resend Verification Email'
            )}
          </Button>
          <Button onClick={handleRefresh} variant="secondary">
            I've Verified My Email
          </Button>
        </CardContent>
        <CardFooter className="flex-col items-start gap-4 text-sm">
            <div className="text-muted-foreground">
                <p>
                    Already verified or have issues?{" "}
                    <button onClick={handleLogout} className="underline font-semibold hover:text-primary">
                        Log out
                    </button>{" "}
                    and try logging in again.
                </p>
            </div>
        </CardFooter>
      </Card>
    </>
  );
}
