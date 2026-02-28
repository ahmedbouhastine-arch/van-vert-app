'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { sendEmailVerification } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MailCheck } from 'lucide-react';

export default function VerifyEmailPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user?.emailVerified) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleResendVerification = async () => {
    if (user) {
        try {
            await sendEmailVerification(user);
            toast({ title: "Verification Email Sent", description: "A new verification link has been sent to your email address." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to resend verification email. Please try again later." });
        }
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <Card className="w-full max-w-md bg-slate-900/80 backdrop-blur-sm border-slate-700 shadow-2xl shadow-blue-500/10 rounded-xl">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
                <MailCheck className="h-12 w-12 text-blue-400" />
            </div>
          <CardTitle className="text-3xl font-bold text-white font-headline tracking-tight">Verify Your Email</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-slate-400">
          <p className="mb-6">
            We&apos;ve sent a verification email to <span className="font-semibold text-blue-400">{user?.email}</span>. Please check your inbox and click the link to activate your account.
          </p>
          <p className="mb-8 text-sm">
            If you haven&apos;t received the email, please check your spam folder or click the button below to resend it.
          </p>
          <Button onClick={handleResendVerification} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-base transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg shadow-blue-600/20">
            Resend Verification Email
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
