'use client';
export const dynamic = 'force-dynamic';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, ArrowLeft, ArrowRight, User as UserIcon, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuth, createUserWithEmailAndPassword, updateProfile, deleteUser } from "firebase/auth";
import { useFirebaseApp, useFirestore, useUser } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { GoogleIcon } from "@/components/GoogleIcon";
import { LoadingScreen } from "@/components/LoadingScreen";
import { signInWithGoogle } from "@/firebase/auth-actions";
import * as serverActions from "@/app/actions";
import { BASE_URL } from "@/lib/utils";
import { VvButton } from "@/components/vv/VvButton";
import { VvInput } from "@/components/vv/VvInput";

const passwordRequirements = [
    { id: "length", text: "8+ chars", regex: /.{8,}/ },
    { id: "uppercase", text: "Uppercase", regex: /[A-Z]/ },
    { id: "number", text: "Number", regex: /[0-9]/ },
];

export default function RegisterPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [password, setPassword] = useState("");
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const app = useFirebaseApp();
    const auth = getAuth(app);
    const firestore = useFirestore();
    const { loading, user } = useUser();

    const validatedRequirements = passwordRequirements.map(req => ({
        ...req,
        isValid: req.regex.test(password),
    }));

    const allRequirementsMet = validatedRequirements.every(req => req.isValid);

    const handleRegister = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!allRequirementsMet) {
            toast({
                variant: 'destructive',
                title: 'Weak Password',
                description: 'Please meet all password requirements.',
            });
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        const email = formData.get("email") as string;
        const fullName = formData.get("full-name") as string;

        createUserWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                const user = userCredential.user;

                try {
                    // 1. First update the profile so the name is available on the backend
                    await updateProfile(user, { displayName: fullName });

                    // 2. Save the user to Firestore
                    if (firestore) {
                        await setDoc(doc(firestore, "users", user.uid), {
                            displayName: fullName,
                            email: user.email,
                            role: email === 'head-admin@test.va' ? 'head-admin' : 'user',
                            createdAt: serverTimestamp(),
                        });
                    }

                    // 3. Now that the backend is fully synced, trigger the verification email
                    const emailResult = await serverActions.sendVerificationEmailAction(email);

                    if (!emailResult.success) {
                        console.error('Email sending failed:', emailResult.error);
                        toast({
                             variant: 'destructive',
                             title: 'Email Issue',
                             description: 'Account created, but we couldn\'t send the verification email. Please contact support.',
                        });
                    }

                    router.push('/verify-email');

                } catch (dbError) {
                    await deleteUser(user).catch(deleteError => {
                        console.error("Cleanup failed:", deleteError);
                    });
                    throw dbError;
                }
            })
            .catch((error) => {
              let description = 'An unexpected error occurred. Please try again.';
              if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/email-already-in-use') {
                description = 'Account already exists. Please log in.';
              }
              toast({
                variant: 'destructive',
                title: 'Registration Failed',
                description: description,
              });
              setIsSubmitting(false);
            });
    }

    const handleGoogleLogin = async () => {
        if (!firestore) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Database connection failed.',
            });
            return;
        }
        setIsSubmitting(true);
        const result = await signInWithGoogle(auth, firestore);

        if (result.error) {
            toast({ variant: 'destructive', title: 'Sign up Failed', description: result.error });
            setIsSubmitting(false);
        } else {
             if (result.isNewUser) {
                 await serverActions.sendWelcomeEmailAction(
                     auth.currentUser?.email || '',
                     auth.currentUser?.displayName || 'Pilot',
                     `${BASE_URL}/dashboard`
                 );
                 toast({ title: "Account Created!" });
             }
             router.push('/dashboard');
        }
    }

    if (loading || user) {
        return <LoadingScreen text="Preparing your pilot profile..."/>;
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

          <p className="mt-12 text-xs font-semibold uppercase tracking-[0.2em] text-sky-pale/50">Get started</p>
          <h1 className="mt-3 max-w-sm font-outfit text-3xl font-bold leading-tight tracking-tight">
            One profile. Every authority you&apos;ll ever convert with.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-sky-pale/60">
            Set up your profile once. We&apos;ll re-use your documents and translations across PPL, CPL, ATPL — and across every authority pair we support.
          </p>
        </div>

        <p className="relative z-10 text-xs font-semibold uppercase tracking-[0.2em] text-sky-pale/40">
          Vanguard Aviation Academy
        </p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center bg-white px-6 py-16">
        <div className="w-full max-w-md">
          <h2 className="font-outfit text-3xl font-bold tracking-tight text-navy">Create account</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Already a pilot here?{" "}
            <Link href="/login" className="font-semibold text-sky hover:text-navy">Sign in</Link>.
          </p>

          <form onSubmit={handleRegister} className="mt-8 flex flex-col gap-5">
            <VvInput
              id="full-name"
              name="full-name"
              label="Full name"
              placeholder="Captain Ana Pereira"
              leftIcon={<UserIcon className="h-4 w-4" />}
              required
              disabled={isSubmitting}
            />

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

            <div className="flex flex-col gap-2.5">
              <VvInput
                id="password"
                type="password"
                label="Password"
                placeholder="Choose a secure password"
                leftIcon={<Lock className="h-4 w-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 px-1">
                {validatedRequirements.map(req => (
                  <div key={req.id} className="flex items-center gap-1.5">
                    {req.isValid ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-status-ready-text" />
                    ) : (
                      <span className="h-3.5 w-3.5 rounded-full border border-[var(--vv-border)]" />
                    )}
                    <span className={`text-[11px] font-medium uppercase tracking-wider ${req.isValid ? 'text-status-ready-text' : 'text-[var(--text-muted)]'}`}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[var(--vv-border)] text-sky focus:ring-sky"
                required
              />
              <span>
                I agree to Van-Vert&apos;s{" "}
                <Link href="/terms" className="text-sky hover:text-navy">Terms of Service</Link> and{" "}
                <Link href="/privacy" className="text-sky hover:text-navy">Privacy Policy</Link>.
              </span>
            </label>

            <VvButton
              type="submit"
              size="lg"
              loading={isSubmitting}
              disabled={isSubmitting || (password.length > 0 && !allRequirementsMet) || !agreedToTerms}
              className="mt-1"
            >
              Create account <ArrowRight className="h-4 w-4" />
            </VvButton>
          </form>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-[var(--vv-border)]" />
            <span className="text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">Or</span>
            <div className="h-px flex-1 bg-[var(--vv-border)]" />
          </div>

          <VvButton
            variant="outline"
            size="lg"
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="w-full border-[var(--vv-border)] text-[var(--text-primary)] hover:bg-surface hover:text-[var(--text-primary)]"
          >
            <GoogleIcon className="h-5 w-5" />
            Sign up with Google
          </VvButton>
        </div>
      </div>
    </div>
  );
}
