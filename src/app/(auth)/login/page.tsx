'use client';
export const dynamic = 'force-dynamic';

import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { GoogleIcon } from "@/components/GoogleIcon";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Eye, EyeOff, Loader2, AtSign, Lock, ArrowLeft, Plane } from "lucide-react";
import { signInWithGoogle } from "@/firebase/auth-actions";
import { sendPasswordResetEmailAction } from '@/app/actions';
import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { BASE_URL } from "@/lib/utils";
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
        } catch (error) {
          let description = "An unexpected error occurred. Please try again.";
          if (error && typeof error === 'object' && 'code' in error &&
              ['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password'].includes(error.code as string)) {
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

    const [mustLinkEmail, setMustLinkEmail] = useState<string | null>(null);

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
        
        if (result.mustLink) {
            setMustLinkEmail(result.email || null);
            setIsSubmitting(false);
        } else if (result.error) {
            toast({ variant: 'destructive', title: 'Login Failed', description: result.error });
            setIsSubmitting(false);
        } else if (result.isNewUser) {
             const { sendWelcomeEmailAction } = await import('@/app/actions');
             await sendWelcomeEmailAction(
                 auth.currentUser?.email || '', 
                 auth.currentUser?.displayName || 'Pilot', 
                 `${BASE_URL}/dashboard`
             );
             toast({ title: "Account Created" });
             // No need to redirect manually as onAuthStateChanged handles it, but just in case:
             router.push('/dashboard');
        }
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
        } catch (error) {
            console.error('Password reset error:', error);
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
      return <LoadingScreen text="Checking your credentials..." />;
    }

  return (
    <PageTransition className="min-h-screen flex flex-col relative overflow-hidden bg-slate-950">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="mb-8 flex justify-center">
            <Link href="/" className="group flex items-center gap-2">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <Plane className="h-8 w-8" />
              </div>
            </Link>
          </div>

          <div className="glass-card p-8 rounded-3xl shadow-2xl space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-extrabold font-headline tracking-tight text-white">Welcome Back</h1>
              <p className="text-muted-foreground">Log in to your Van-Vert account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <div className="relative group">
                  <AtSign className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="pilot@vanvert.co"
                    required
                    disabled={isSubmitting}
                    className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/50 transition-all text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    className="pl-10 pr-10 h-12 bg-white/5 border-white/10 rounded-xl focus:ring-primary/50 transition-all text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-white transition-colors"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900/50 backdrop-blur-md px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              variant="outline"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 transition-all text-white flex gap-3"
            >
              <GoogleIcon className="h-5 w-5" />
              Google Authentication
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              New to Van-Vert?{" "}
              <Link href="/register" className="font-bold text-primary hover:text-primary/80 transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      <Link href="/" className="absolute top-6 left-6 md:top-8 md:left-8 p-3 rounded-full glass-card hover:bg-white/5 transition-all text-white flex items-center gap-2 group z-20">
        <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Home</span>
      </Link>

      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
         <DialogContent className="sm:max-w-md bg-slate-900/90 backdrop-blur-xl border-white/10 text-white rounded-3xl">
           <DialogHeader>
             <DialogTitle className="text-2xl font-bold">Reset Password</DialogTitle>
             <DialogDescription className="text-slate-400">
               We&apos;ll send you a secure link to reset your password.
             </DialogDescription>
           </DialogHeader>
           <form onSubmit={handlePasswordReset} className="space-y-4 pt-4">
             <div className="relative group">
               <AtSign className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
               <Input
                 id="forgot-password-email"
                 type="email"
                 placeholder="pilot@vanvert.co"
                 required
                 value={forgotPasswordEmail}
                 onChange={(e) => setForgotPasswordEmail(e.target.value)}
                 className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl text-white"
               />
             </div>
             <DialogFooter className="flex-col sm:flex-row gap-3">
               <DialogClose asChild>
                 <Button type="button" variant="ghost" className="rounded-xl">Cancel</Button>
               </DialogClose>
               <Button type="submit" disabled={isSubmitting} className="rounded-xl flex-1 bg-primary">
                 {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Link"}
               </Button>
             </DialogFooter>
           </form>
         </DialogContent>
      </Dialog>

      <Dialog open={!!mustLinkEmail} onOpenChange={(open) => !open && setMustLinkEmail(null)}>
         <DialogContent className="sm:max-w-md bg-slate-900/90 backdrop-blur-xl border-white/10 text-white rounded-3xl">
           <DialogHeader>
             <DialogTitle className="text-2xl font-bold flex items-center gap-2">
               Account Exists
             </DialogTitle>
             <DialogDescription className="text-slate-400 pt-2">
               The email <span className="text-white font-medium">{mustLinkEmail}</span> is already associated with an account using a different login method.
               <br /><br />
               Please log in with your email and password first, and then you can link your Google account in your profile settings.
             </DialogDescription>
           </DialogHeader>
           <DialogFooter>
             <DialogClose asChild>
               <Button type="button" className="w-full rounded-xl bg-primary hover:bg-primary/90">Got it</Button>
             </DialogClose>
           </DialogFooter>
         </DialogContent>
      </Dialog>
    </PageTransition>
  );
};

export default LoginPage;
