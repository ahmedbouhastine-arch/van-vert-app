'use client';
export const dynamic = 'force-dynamic';

import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { GoogleIcon } from "@/components/GoogleIcon";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ArrowLeft, ArrowRight, Mail, Lock } from "lucide-react";
import { signInWithGoogle } from "@/firebase/auth-actions";
import { sendPasswordResetEmailAction } from '@/app/actions';
import { BASE_URL } from "@/lib/utils";
import { VvButton } from "@/components/vv/VvButton";
import { VvInput } from "@/components/vv/VvInput";
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
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="relative hidden w-[38%] flex-col justify-between overflow-hidden bg-navy px-12 py-10 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full border border-white/20" />
          <div className="absolute -bottom-16 -left-10 h-64 w-64 rounded-full border border-white/20" />
        </div>

        <Link href="/" className="relative z-10 flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="relative z-10">
          <span className="font-outfit text-2xl font-bold tracking-tight">
            <span className="text-white">Van-</span>
            <span className="text-sky-bright">Vert</span>
          </span>

          <p className="mt-12 text-xs font-semibold uppercase tracking-[0.2em] text-sky-pale/50">Welcome back</p>
          <h1 className="mt-3 max-w-sm font-outfit text-3xl font-bold leading-tight tracking-tight">
            Sign in and pick up where your conversion left off.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-sky-pale/60">
            Your application stays exactly where you left it. New documents from your reviewer are highlighted at the top of your dashboard.
          </p>
        </div>

        <p className="relative z-10 text-xs font-semibold uppercase tracking-[0.2em] text-sky-pale/40">
          Vanguard Aviation Academy
        </p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center bg-white px-6 py-16">
        <div className="w-full max-w-md">
          <h2 className="font-outfit text-3xl font-bold tracking-tight text-navy">Sign in</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-sky hover:text-navy">Create one</Link>.
          </p>

          <form onSubmit={handleLogin} className="mt-8 flex flex-col gap-5">
            <VvInput
              id="email"
              name="email"
              type="email"
              label="Email"
              placeholder="pilot@vanvert.co"
              leftIcon={<Mail className="h-4 w-4" />}
              required
              disabled={isSubmitting}
            />

            <div className="flex flex-col gap-1.5">
              <VvInput
                id="password"
                name="password"
                type="password"
                label="Password"
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                required
                disabled={isSubmitting}
              />
              <div className="mt-1 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-text-secondary">
                  <input type="checkbox" className="h-4 w-4 rounded border-vv-border text-sky focus:ring-sky" />
                  Keep me signed in
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-sm font-medium text-sky hover:text-navy transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <VvButton type="submit" size="lg" loading={isSubmitting} className="mt-1">
              Sign in <ArrowRight className="h-4 w-4" />
            </VvButton>
          </form>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-vv-border" />
            <span className="text-xs font-medium uppercase tracking-widest text-text-muted">Or</span>
            <div className="h-px flex-1 bg-vv-border" />
          </div>

          <VvButton
            variant="outline"
            size="lg"
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="w-full border-vv-border text-text-primary hover:bg-surface hover:text-text-primary"
          >
            <GoogleIcon className="h-5 w-5" />
            Continue with Google
          </VvButton>

          <p className="mt-8 text-center text-xs leading-relaxed text-text-muted">
            Protected by SSO-grade encryption. By signing in you agree to our{" "}
            <Link href="/terms" className="underline hover:text-text-secondary">Terms</Link> and{" "}
            <Link href="/privacy" className="underline hover:text-text-secondary">Privacy Policy</Link>.
          </p>
        </div>
      </div>

      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
         <DialogContent className="sm:max-w-md rounded-2xl">
           <DialogHeader>
             <DialogTitle className="font-outfit text-2xl font-bold text-navy">Reset password</DialogTitle>
             <DialogDescription className="text-text-secondary">
               We&apos;ll send you a secure link to reset your password.
             </DialogDescription>
           </DialogHeader>
           <form onSubmit={handlePasswordReset} className="space-y-4 pt-2">
             <VvInput
               id="forgot-password-email"
               type="email"
               placeholder="pilot@vanvert.co"
               leftIcon={<Mail className="h-4 w-4" />}
               required
               value={forgotPasswordEmail}
               onChange={(e) => setForgotPasswordEmail(e.target.value)}
             />
             <DialogFooter className="flex-col gap-3 sm:flex-row">
               <DialogClose asChild>
                 <VvButton type="button" variant="ghost">Cancel</VvButton>
               </DialogClose>
               <VvButton type="submit" loading={isSubmitting} className="flex-1">
                 Send link
               </VvButton>
             </DialogFooter>
           </form>
         </DialogContent>
      </Dialog>

      <Dialog open={!!mustLinkEmail} onOpenChange={(open) => !open && setMustLinkEmail(null)}>
         <DialogContent className="sm:max-w-md rounded-2xl">
           <DialogHeader>
             <DialogTitle className="font-outfit text-2xl font-bold text-navy">Account exists</DialogTitle>
             <DialogDescription className="pt-2 text-text-secondary">
               The email <span className="font-medium text-text-primary">{mustLinkEmail}</span> is already associated with an account using a different login method.
               <br /><br />
               Please log in with your email and password first, and then you can link your Google account in your profile settings.
             </DialogDescription>
           </DialogHeader>
           <DialogFooter>
             <DialogClose asChild>
               <VvButton type="button" className="w-full">Got it</VvButton>
             </DialogClose>
           </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoginPage;
