'use client';
export const dynamic = 'force-dynamic';

import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { GoogleIcon } from "@/components/GoogleIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { signInWithGoogle } from "@/firebase/auth-actions";
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
    const [showPassword, setShowPassword] = useState(false);

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
          toast({ variant: 'destructive', title: 'Login Failed', description });
          setIsSubmitting(false);
        }
    };

    const [mustLinkEmail, setMustLinkEmail] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Cannot connect to the database. Please try again later.' });
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
             router.push('/dashboard');
        }
    };

    if (loading || user) {
        return (
            <div className="flex min-h-screen" style={{ display: 'grid', gridTemplateColumns: '5fr 6fr' }}>
                <div className="hidden lg:block bg-[var(--navy)]" />
                <div className="flex flex-col justify-center px-12 py-16 bg-white">
                    <Skeleton className="mb-2 h-3 w-20" />
                    <Skeleton className="mb-8 h-9 w-48" />
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-3 w-12" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                        </div>
                        <Skeleton className="h-10 w-full rounded-lg" />
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-px flex-1" />
                            <Skeleton className="h-3 w-6" />
                            <Skeleton className="h-px flex-1" />
                        </div>
                        <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex min-h-screen"
            style={{ display: 'grid', gridTemplateColumns: '5fr 6fr' }}
        >
            {/* ── Left — navy brand panel ──────────────────────────────────────── */}
            <aside
                className="relative hidden flex-col justify-between overflow-hidden lg:flex"
                style={{
                    background: 'var(--navy)',
                    color: 'white',
                    padding: '48px 56px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Decorative arcs — bottom-left */}
                <svg
                    aria-hidden="true"
                    style={{
                        position: 'absolute', bottom: -180, left: -180,
                        opacity: 0.06, pointerEvents: 'none',
                    }}
                    width="640" height="640" viewBox="0 0 640 640"
                >
                    {[280, 220, 160, 100, 40].map((r) => (
                        <circle key={r} cx="320" cy="320" r={r} fill="none" stroke="white" strokeWidth="1" />
                    ))}
                </svg>

                {/* Back to home */}
                <Link
                    href="/"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        color: 'rgba(255,255,255,0.7)', fontSize: 13,
                        position: 'relative', width: 'fit-content',
                        transition: 'color 0.15s',
                    }}
                    className="hover:text-white"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to home
                </Link>

                {/* Center content */}
                <div style={{ position: 'relative', maxWidth: 420 }}>
                    {/* Wordmark */}
                    <span
                        style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            fontSize: 36,
                            letterSpacing: '-0.02em',
                            lineHeight: 1,
                        }}
                    >
                        <span style={{ color: 'white' }}>Van-</span>
                        <span style={{ color: 'var(--sky-bright)' }}>Vert</span>
                    </span>

                    {/* Kicker */}
                    <div
                        style={{
                            marginTop: 48,
                            fontSize: 11, fontWeight: 600,
                            letterSpacing: '3px', textTransform: 'uppercase',
                            color: 'var(--sky-bright)',
                        }}
                    >
                        Welcome back
                    </div>

                    {/* Headline */}
                    <h2
                        style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 600, fontSize: 36,
                            lineHeight: 1.15, letterSpacing: '-0.015em',
                            color: 'white', marginTop: 16,
                        }}
                    >
                        Sign in and pick up where your conversion left off.
                    </h2>

                    {/* Body */}
                    <p
                        style={{
                            marginTop: 16, fontSize: 15,
                            lineHeight: 1.6, color: 'rgba(255,255,255,0.6)',
                        }}
                    >
                        Your application stays exactly where you left it. New documents from your reviewer are highlighted at the top of your dashboard.
                    </p>
                </div>

                {/* Footer */}
                <div
                    style={{
                        position: 'relative',
                        fontSize: 11, fontWeight: 500,
                        letterSpacing: '3px', textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.35)',
                    }}
                >
                    Vanguard Aviation Academy
                </div>
            </aside>

            {/* ── Right — form ─────────────────────────────────────────────────── */}
            <main
                style={{
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center',
                    padding: '64px 48px',
                    background: 'var(--white)',
                }}
            >
                <div style={{ width: '100%', maxWidth: 420 }}>

                    {/* Heading */}
                    <div style={{ marginBottom: 32 }}>
                        <h1
                            style={{
                                fontFamily: 'var(--font-display)',
                                fontWeight: 600, fontSize: 30,
                                letterSpacing: '-0.01em', lineHeight: 1.1,
                                color: 'var(--navy)',
                            }}
                        >
                            Sign in
                        </h1>
                        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
                            Don&apos;t have an account?{' '}
                            <Link href="/register" style={{ color: 'var(--sky)', fontWeight: 600 }}>
                                Create one
                            </Link>.
                        </p>
                    </div>

                    {/* Form */}
                    <form
                        onSubmit={handleLogin}
                        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                    >
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

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <VvInput
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                label="Password"
                                placeholder="••••••••"
                                leftIcon={<Lock className="h-4 w-4" />}
                                rightIcon={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{ color: 'var(--text-muted)', display: 'flex' }}
                                        className="hover:text-sky transition-colors"
                                    >
                                        {showPassword
                                            ? <EyeOff className="h-4 w-4" />
                                            : <Eye className="h-4 w-4" />
                                        }
                                    </button>
                                }
                                required
                                disabled={isSubmitting}
                            />

                            {/* Keep me signed in + Forgot password */}
                            <div
                                style={{
                                    marginTop: 4,
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between', fontSize: 13,
                                }}
                            >
                                <label
                                    style={{
                                        display: 'inline-flex', gap: 8,
                                        alignItems: 'center',
                                        color: 'var(--text-secondary)', cursor: 'pointer',
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        style={{ accentColor: 'var(--sky)', width: 14, height: 14 }}
                                    />
                                    Keep me signed in
                                </label>
                                <Link
                                    href="/forgot-password"
                                    style={{
                                        color: 'var(--sky)', fontWeight: 500,
                                        fontSize: 13, transition: 'color 0.15s',
                                    }}
                                    className="hover:text-navy"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        {/* Submit */}
                        <VvButton
                            type="submit"
                            size="lg"
                            loading={isSubmitting}
                            style={{ marginTop: 4, width: '100%', justifyContent: 'center' }}
                        >
                            Sign in <ArrowRight className="h-4 w-4" />
                        </VvButton>
                    </form>

                    {/* Divider */}
                    <div style={{ position: 'relative', textAlign: 'center', margin: '8px 0' }}>
                        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'var(--border)' }} />
                        <span style={{
                            position: 'relative', background: 'white', padding: '0 12px',
                            fontSize: 11, fontWeight: 600, letterSpacing: '2px',
                            textTransform: 'uppercase', color: 'var(--text-muted)',
                        }}>
                            or
                        </span>
                    </div>

                    {/* Google */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isSubmitting}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: 10,
                            padding: '13px 18px',
                            background: 'white',
                            border: '1.5px solid var(--border)',
                            borderRadius: 8,
                            color: 'var(--text-primary)',
                            fontSize: 14, fontWeight: 500,
                            fontFamily: 'var(--font-body)',
                            cursor: 'pointer',
                            transition: 'border-color 0.15s, background 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                    >
                        <GoogleIcon className="h-[18px] w-[18px]" />
                        Continue with Google
                    </button>

                    {/* Legal note */}
                    <p
                        style={{
                            marginTop: 36, fontSize: 12,
                            color: 'var(--text-muted)', textAlign: 'center',
                            lineHeight: 1.6,
                        }}
                    >
                        Protected by SSO-grade encryption. By signing in you agree to our{' '}
                        <Link href="/terms" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>
                            Terms
                        </Link>{' '}and{' '}
                        <Link href="/privacy" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>
                            Privacy Policy
                        </Link>.
                    </p>
                </div>
            </main>

            {/* ── Must link email dialog ───────────────────────────────────────── */}
            <Dialog open={!!mustLinkEmail} onOpenChange={(open) => !open && setMustLinkEmail(null)}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle
                            style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 24, color: 'var(--navy)' }}
                        >
                            Account exists
                        </DialogTitle>
                        <DialogDescription className="pt-2" style={{ color: 'var(--text-secondary)' }}>
                            The email{' '}
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{mustLinkEmail}</span>{' '}
                            is already associated with an account using a different login method.
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
