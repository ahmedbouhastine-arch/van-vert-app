'use client';
export const dynamic = 'force-dynamic';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, Eye, EyeOff, Loader2, User as UserIcon, Plane, AtSign, Lock, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuth, createUserWithEmailAndPassword, updateProfile, deleteUser } from "firebase/auth";
import { useFirebaseApp, useFirestore, useUser } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { GoogleIcon } from "@/components/GoogleIcon";
import { LoadingScreen } from "@/components/LoadingScreen";
import { signInWithGoogle } from "@/firebase/auth-actions";
import * as serverActions from "@/app/actions";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";

const passwordRequirements = [
    { id: "length", text: "8+ chars", regex: /.{8,}/ },
    { id: "uppercase", text: "Uppercase", regex: /[A-Z]/ },
    { id: "number", text: "Number", regex: /[0-9]/ },
];

export default function RegisterPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
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
            .catch((error: any) => {
              let description = 'An unexpected error occurred. Please try again.';
              if (error.code === 'auth/email-already-in-use') {
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
                     'https://van-vert-app--REDACTED_FIREBASE_PROJECT_ID.europe-west4.hosted.app/dashboard'
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
    <PageTransition className="min-h-screen flex flex-col relative overflow-hidden bg-slate-950">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px]" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 z-10 my-8">
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
        >
            <div className="mb-6 flex justify-center">
              <Link href="/" className="group flex items-center gap-2">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <Plane className="h-8 w-8" />
                </div>
              </Link>
            </div>

            <div className="glass-card p-8 rounded-3xl shadow-2xl space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-extrabold font-headline tracking-tight text-white">Create Account</h1>
                    <p className="text-muted-foreground">Join the future of aviation licensing</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-4">
                        <div className="relative group">
                            <UserIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input 
                                id="full-name" 
                                name="full-name" 
                                placeholder="Full Name" 
                                required 
                                disabled={isSubmitting}
                                className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl text-white" 
                            />
                        </div>
                        <div className="relative group">
                            <AtSign className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="pilot@example.com"
                                required
                                disabled={isSubmitting}
                                className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl text-white"
                            />
                        </div>
                        <div className="space-y-3">
                            <div className="relative group">
                               <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                               <Input 
                                  id="password" 
                                  type={showPassword ? "text" : "password"} 
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  placeholder="Secure Password"
                                  required
                                  disabled={isSubmitting}
                                  className="pl-10 pr-10 h-12 bg-white/5 border-white/10 rounded-xl text-white"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-muted-foreground hover:text-white transition-colors"
                              >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                            
                            <div className="flex gap-2 justify-between px-1">
                                {validatedRequirements.map(req => (
                                    <div key={req.id} className="flex items-center gap-1.5">
                                        {req.isValid ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                                        ) : (
                                            <div className="h-3.5 w-3.5 rounded-full border border-white/20" />
                                        )}
                                        <span className={`text-[10px] font-medium uppercase tracking-wider ${req.isValid ? 'text-green-400' : 'text-muted-foreground'}`}>
                                            {req.text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all bg-primary hover:bg-primary/90 mt-4" 
                      disabled={isSubmitting || (password.length > 0 && !allRequirementsMet)}
                    >
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign Up"}
                    </Button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-slate-900/50 backdrop-blur-md px-2 text-muted-foreground">Or join with</span>
                    </div>
                </div>

                <Button 
                  variant="outline" 
                  onClick={handleGoogleLogin} 
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 transition-all text-white flex gap-3"
                >
                    <GoogleIcon className="h-5 w-5" />
                    Google Account
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                   Already a member?{' '}
                   <Link href="/login" className="font-bold text-primary hover:text-primary/80 transition-colors">
                    Log in
                   </Link>
                </p>
            </div>
        </motion.div>
      </div>

      <Link href="/" className="absolute top-8 left-8 p-3 rounded-full glass-card hover:bg-white/5 transition-all text-white hidden md:flex items-center gap-2 group">
        <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Home</span>
      </Link>
    </PageTransition>
  );
}
