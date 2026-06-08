'use client';
export const dynamic = 'force-dynamic';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, User as UserIcon, Mail, Lock, Eye, EyeOff, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuth, createUserWithEmailAndPassword, updateProfile, deleteUser, signOut } from "firebase/auth";
import { useFirebaseApp, useFirestore, useUser } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { GoogleIcon } from "@/components/GoogleIcon";
import { LoadingScreen } from "@/components/LoadingScreen";
import { signInWithGoogle } from "@/firebase/auth-actions";
import * as serverActions from "@/app/actions";
import { BASE_URL } from "@/lib/utils";
import { DEV_TEST_ACCOUNTS, isDevTestAccount } from "@/lib/dev-test-accounts";
import { VvButton } from "@/components/vv/VvButton";
import { VvInput } from "@/components/vv/VvInput";

// Must satisfy both passwordRequirements below and Firebase's project-level
// password policy (uppercase + number) — plain "testtest" is rejected server-side.
const DEV_TEST_PASSWORD = 'Testtest1';

const passwordRequirements = [
    { id: "length",    text: "8+ chars",  regex: /.{8,}/  },
    { id: "uppercase", text: "Uppercase", regex: /[A-Z]/  },
    { id: "number",    text: "Number",    regex: /[0-9]/  },
];


export default function RegisterPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const app = useFirebaseApp();
    const auth = getAuth(app);
    const firestore = useFirestore();
    const { loading, user } = useUser();

    const validatedRequirements = passwordRequirements.map((req) => ({
        ...req,
        isValid: req.regex.test(password),
    }));

    const allRequirementsMet = validatedRequirements.every((req) => req.isValid);

    const handleRegister = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const email = formData.get("email") as string;
        const fullName = formData.get("full-name") as string;

        if (!allRequirementsMet && !isDevTestAccount(email)) {
            toast({ variant: 'destructive', title: 'Weak Password', description: 'Please meet all password requirements.' });
            return;
        }

        setIsSubmitting(true);

        const accountPassword = isDevTestAccount(email) ? DEV_TEST_PASSWORD : password;

        createUserWithEmailAndPassword(auth, email, accountPassword)
            .then(async (userCredential) => {
                const fbUser = userCredential.user;
                try {
                    await updateProfile(fbUser, { displayName: fullName });
                    if (firestore) {
                        await setDoc(doc(firestore, "users", fbUser.uid), {
                            displayName: fullName,
                            email: fbUser.email,
                            role: isDevTestAccount(email) ? DEV_TEST_ACCOUNTS[email] : 'user',
                            createdAt: serverTimestamp(),
                        });
                    }
                    const freshIdToken = await fbUser.getIdToken();
                    await serverActions.syncOwnRoleClaimAction(freshIdToken);
                    if (isDevTestAccount(email)) {
                        // Dev seed accounts use fake addresses that can't receive a real
                        // verification email — mark them verified server-side instead and
                        // re-authenticate so the client picks up the fresh emailVerified flag.
                        await serverActions.markDevTestAccountVerifiedAction(email);
                        await signOut(auth);
                        toast({ title: 'Test account ready', description: `Log in with ${email} / ${DEV_TEST_PASSWORD}.` });
                        router.push('/login');
                        return;
                    }

                    const emailResult = await serverActions.sendVerificationEmailAction(email);
                    if (!emailResult.success) {
                        toast({ variant: 'destructive', title: 'Email Issue', description: 'Account created, but we couldn\'t send the verification email. Please contact support.' });
                    }
                    router.push('/verify-email');
                } catch (dbError) {
                    await deleteUser(fbUser).catch((e) => console.error("Cleanup failed:", e));
                    throw dbError;
                }
            })
            .catch((error) => {
                let description = 'An unexpected error occurred. Please try again.';
                if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/email-already-in-use') {
                    description = 'Account already exists. Please log in.';
                }
                toast({ variant: 'destructive', title: 'Registration Failed', description });
                setIsSubmitting(false);
            });
    };

    const handleGoogleLogin = async () => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database connection failed.' });
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
    };

    if (loading || user) {
        return <LoadingScreen text="Preparing your pilot profile..." />;
    }

    return (
        <div
            className="flex min-h-screen"
            style={{ display: 'grid', gridTemplateColumns: '5fr 6fr' }}
        >
            {/* ── Left — navy brand panel ──────────────────────────────────────── */}
            <aside
                className="relative hidden lg:flex"
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
                {/* Decorative arcs */}
                <svg
                    aria-hidden="true"
                    style={{ position: 'absolute', bottom: -180, left: -180, opacity: 0.06, pointerEvents: 'none' }}
                    width="640" height="640" viewBox="0 0 640 640"
                >
                    {[280, 220, 160, 100, 40].map((r) => (
                        <circle key={r} cx="320" cy="320" r={r} fill="none" stroke="white" strokeWidth="1" />
                    ))}
                </svg>

                <Link
                    href="/"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.7)', fontSize: 13, position: 'relative', width: 'fit-content', transition: 'color 0.15s' }}
                    className="hover:text-white"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to home
                </Link>

                <div style={{ position: 'relative', maxWidth: 420 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36, letterSpacing: '-0.02em', lineHeight: 1 }}>
                        <span style={{ color: 'white' }}>Van-</span>
                        <span style={{ color: 'var(--sky-bright)' }}>Vert</span>
                    </span>

                    <div style={{ marginTop: 48, fontSize: 11, fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--sky-bright)' }}>
                        Get started
                    </div>

                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 36, lineHeight: 1.15, letterSpacing: '-0.015em', color: 'white', marginTop: 16 }}>
                        One profile. Every authority you&apos;ll ever convert with.
                    </h2>

                    <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.6, color: 'rgba(255,255,255,0.6)' }}>
                        Set up your profile once. We&apos;ll re-use your documents and translations across PPL, CPL, ATPL — and across every authority pair we support.
                    </p>
                </div>

                <div style={{ position: 'relative', fontSize: 11, fontWeight: 500, letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                    Vanguard Aviation Academy
                </div>
            </aside>

            {/* ── Right — form ─────────────────────────────────────────────────── */}
            <main style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '64px 48px', background: 'var(--white)' }}>
                <div style={{ width: '100%', maxWidth: 420 }}>

                    <div style={{ marginBottom: 32 }}>
                        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 30, letterSpacing: '-0.01em', lineHeight: 1.1, color: 'var(--navy)' }}>
                            Create account
                        </h1>
                        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
                            Already a pilot here?{' '}
                            <Link href="/login" style={{ color: 'var(--sky)', fontWeight: 600 }}>Sign in</Link>.
                        </p>
                    </div>

                    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <VvInput
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                label="Password"
                                placeholder="Choose a secure password"
                                leftIcon={<Lock className="h-4 w-4" />}
                                rightIcon={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{ color: 'var(--text-muted)', display: 'flex' }}
                                        className="hover:text-sky transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                }
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isSubmitting}
                            />

                            {/* Password requirements */}
                            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', paddingLeft: 2 }}>
                                {validatedRequirements.map((req) => (
                                    <div key={req.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                        {req.isValid ? (
                                            <Check
                                                style={{ width: 12, height: 12, color: 'var(--status-ready)', flexShrink: 0 }}
                                                strokeWidth={3}
                                            />
                                        ) : (
                                            <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid var(--border)', display: 'inline-block', flexShrink: 0 }} />
                                        )}
                                        <span style={{
                                            fontSize: 10, fontWeight: 600,
                                            letterSpacing: '2px', textTransform: 'uppercase',
                                            color: req.isValid ? 'var(--status-ready)' : 'var(--text-muted)',
                                        }}>
                                            {req.text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Terms */}
                        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                            <input
                                type="checkbox"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                style={{ accentColor: 'var(--sky)', marginTop: 3, width: 14, height: 14 }}
                                required
                            />
                            <span>
                                I agree to Van-Vert&apos;s{' '}
                                <Link href="/terms" style={{ color: 'var(--sky)' }}>Terms of Service</Link>
                                {' '}and{' '}
                                <Link href="/privacy" style={{ color: 'var(--sky)' }}>Privacy Policy</Link>.
                            </span>
                        </label>

                        <VvButton
                            type="submit"
                            size="lg"
                            loading={isSubmitting}
                            disabled={isSubmitting || (password.length > 0 && !allRequirementsMet) || !agreedToTerms}
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            Create account <ArrowRight className="h-4 w-4" />
                        </VvButton>
                    </form>

                    {/* Divider */}
                    <div style={{ position: 'relative', textAlign: 'center', margin: '8px 0' }}>
                        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'var(--border)' }} />
                        <span style={{ position: 'relative', background: 'white', padding: '0 12px', fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                            or
                        </span>
                    </div>

                    {/* Google */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isSubmitting}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                            padding: '13px 18px', background: 'white',
                            border: '1.5px solid var(--border)', borderRadius: 8,
                            color: 'var(--text-primary)', fontSize: 14, fontWeight: 500,
                            fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                    >
                        <GoogleIcon className="h-[18px] w-[18px]" />
                        Sign up with Google
                    </button>
                </div>
            </main>
        </div>
    );
}
