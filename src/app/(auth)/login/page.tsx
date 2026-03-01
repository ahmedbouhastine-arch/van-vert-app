'use client';
export const dynamic = 'force-dynamic';

import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { GoogleIcon } from "@/components/GoogleIcon";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Eye, EyeOff, Loader2, AtSign, Lock } from "lucide-react";
import { signInWithGoogle, sendPasswordResetEmailAction } from "@/firebase/auth-actions";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const LoginPage = () => {
    const router = useRouter();
    const { toast } = useToast();
    const auth = useAuth();
    const firestore = useFirestore();
    const { user, loading, claims } = useUser();
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");

    useEffect(() => {
        if (!loading && user) {
            if (user.emailVerified) {
                const isAdmin = claims && ['reviewer', 'admin', 'head-admin'].includes(claims.role);
                const homePath = isAdmin ? '/admin' : '/dashboard';
                router.push(homePath);
            } else {
                router.push('/verify-email');
            }
        }
    }, [user, loading, claims, router]);

    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Redirect is handled by the useEffect hook
        } catch (error: unknown) {
          let description = "An unexpected error occurred. Please try again.";
          const err = (error as { code?: unknown }) || {};
          if (typeof err.code === 'string' && ['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password'].includes(err.code)) {
            description = "Invalid email or password. Please try again.";
          }
          toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: description,
          });
          setIsSubmitting(false);
        }
    }

    const handleGoogleLogin = async () => {
        if (!firestore) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Cannot connect to the database. Please try again later.',
            });
            return;
        }
        setIsSubmitting(true);
        const result = await signInWithGoogle(auth, firestore);
        
        if (result.error) {
            toast({ variant: 'destructive', title: 'Login Failed', description: result.error });
            setIsSubmitting(false);
        }
        // Redirect is handled by the useEffect hook
    }

    const handlePasswordReset = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        try {
            const result = await sendPasswordResetEmailAction(forgotPasswordEmail);
            if (result.success) {
                toast({
                  description: "Password reset email sent! Check your inbox.",
                });
                setIsForgotPasswordOpen(false);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result.error || 'Failed to send password reset email. Please try again.',
                });
            }
        } catch (error: unknown) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'An unexpected error occurred. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
            setForgotPasswordEmail("");
        }
    }

    if (loading || user) {
      return <LoadingScreen text="Authenticating..." />;
    }

  return (
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-700 shadow-2xl shadow-blue-500/10 rounded-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white font-headline tracking-tight">
              van-vert
            </CardTitle>
            <CardDescription className="text-slate-400">
              Sign in to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="grid gap-4">
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="pilot@example.com"
                  required
                  disabled={isSubmitting}
                  className="pl-10 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 transition-all"
                />
              </div>
              <div className="grid gap-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="pl-10 pr-10 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 transition-all"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                 <div className="flex items-center justify-end">
                    <Button variant="link" size="sm" type="button" onClick={() => setIsForgotPasswordOpen(true)} className="text-blue-400 hover:text-blue-300 px-0">
                      Forgot your password?
                    </Button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-base transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg shadow-blue-600/20"
                disabled={isSubmitting}
              >
                 {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Login
              </Button>
            </form>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900/80 px-2 text-slate-400">
                  Or continue with
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full bg-slate-800/60 border-slate-700 text-white hover:bg-slate-700/60 hover:text-white font-semibold py-3 rounded-lg transition-all"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
            >
              <GoogleIcon className="mr-3 h-5 w-5" />
              Sign in with Google
            </Button>
            <div className="mt-6 text-center text-sm">
              <p className="text-slate-400">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-2">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900/80 backdrop-blur-sm border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Forgot Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we will send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordReset}>
            <div className="grid gap-4 py-4">
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="forgot-password-email"
                  type="email"
                  placeholder="pilot@example.com"
                  required
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="pl-10 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 rounded-lg"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Reset Link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoginPage;
