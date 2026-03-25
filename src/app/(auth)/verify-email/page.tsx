'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MailCheck } from 'lucide-react';
import * as serverActions from '@/app/actions';

export default function VerifyEmailPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);

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
    } catch (error: any) {
        console.error("Resend failed:", error);
        toast({ 
            variant: "destructive", 
            title: "Resend Failed", 
            description: error.message || "Failed to resend verification email. Please try again later." 
        });
    } finally {
        setIsResending(false);
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
            <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <Card className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border-white/10 shadow-2xl rounded-3xl relative z-10">
        <CardHeader className="text-center pt-10">
            <div className="flex justify-center items-center mb-6">
                <div className="p-4 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <MailCheck className="h-12 w-12" />
                </div>
            </div>
          <CardTitle className="text-3xl font-extrabold text-white font-headline tracking-tight">Verify Your Email</CardTitle>
        </CardHeader>
        <CardContent className="text-center px-8 pb-10">
          <p className="mb-6 text-slate-300 leading-relaxed">
            We've sent a verification email to <span className="font-bold text-blue-400">{user?.email}</span>. Please check your inbox and click the link to activate your account.
          </p>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-8 text-sm text-slate-400 text-left">
            <p className="font-medium text-slate-200 mb-1">Didn't get the email?</p>
            <ul className="list-disc pl-4 space-y-1">
                <li>Check your spam or junk folder.</li>
                <li>Verify your email address is correct.</li>
                <li>Wait a few minutes before resending.</li>
            </ul>
          </div>
          <Button 
            onClick={handleResendVerification} 
            disabled={isResending}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-base transition-all duration-300 shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {isResending ? (
                <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Resending...
                </>
            ) : (
                "Resend Verification Email"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
