'use client';
export const dynamic = 'force-dynamic';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, Eye, EyeOff, Loader2, User as UserIcon, Plane, AtSign, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuth, createUserWithEmailAndPassword, updateProfile, deleteUser, sendEmailVerification } from "firebase/auth";
import { useFirebaseApp, useFirestore, useUser } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { GoogleIcon } from "@/components/GoogleIcon";
import { LoadingScreen } from "@/components/LoadingScreen";
import { signInWithGoogle } from "@/firebase/auth-actions";
import * as serverActions from "@/app/actions";
import { motion } from "framer-motion";

const passwordRequirements = [
    { id: "length", text: "At least 8 characters", regex: /.{8,}/ },
    { id: "uppercase", text: "One uppercase letter", regex: /[A-Z]/ },
    { id: "number", text: "One number", regex: /[0-9]/ },
];

export default function RegisterPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

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
                title: 'Invalid Password',
                description: 'Please ensure your password meets all requirements.',
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
                let photoURL: string | null = null;
                
                try {
                    if (avatarFile) {
                      const uploadFormData = new FormData();
                      uploadFormData.append('userId', user.uid);
                      uploadFormData.append('file', avatarFile);
                      const idToken = await user.getIdToken();
                      uploadFormData.append('idToken', idToken);
                      
                      const uploadResult = await serverActions.uploadProfilePictureAction(uploadFormData);
                      photoURL = uploadResult.photoURL;
                    }

                    await Promise.all([
                        updateProfile(user, { displayName: fullName, photoURL }),
                        firestore ? setDoc(doc(firestore, "users", user.uid), {
                            displayName: fullName,
                            email: user.email,
                            photoURL: photoURL,
                            role: email === 'head-admin@test.va' ? 'head-admin' : 'user',
                            createdAt: serverTimestamp(),
                        }) : Promise.reject("Firestore not available"),
                        sendEmailVerification(user),
                    ]);
                    
                    router.push('/verify-email');

                } catch (dbError) {
                    await deleteUser(user).catch(deleteError => {
                        console.error("Failed to clean up orphaned user:", deleteError);
                    });
                    throw dbError;
                }
            })
            .catch((error: unknown) => {
              const err = (error as { code?: unknown; message?: unknown }) || {};
              let description = 'An unexpected error occurred during sign-up. Please try again.';
              if (typeof err.code === 'string' && err.code === 'auth/email-already-in-use') {
                description = 'An account with this email already exists. Please log in.';
              } else {
                console.error('Registration Error: ', error);
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
                description: 'Cannot connect to the database. Please try again later.',
            });
            return;
        }
        setIsSubmitting(true);
        const result = await signInWithGoogle(auth, firestore);
        
        if (result.error) {
            toast({ variant: 'destructive', title: 'Sign up Failed', description: result.error });
            setIsSubmitting(false);
        } else {
             router.push('/dashboard');
        }
    }

    if (loading || user) {
        return <LoadingScreen text="Finalizing account setup..."/>;
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
                    <div className="flex justify-center items-center mb-4">
                        <Plane className="h-12 w-12 text-blue-400" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-white font-headline tracking-tight">
                        Create Your Account
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Join AeroLog and start your aviation journey.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister} className="grid gap-4">
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input id="full-name" name="full-name" placeholder="John Pilot" required disabled={isSubmitting}
                            className="pl-10 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 transition-all" />
                        </div>
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
                        <div className="relative">
                           <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                           <Input 
                              id="password" 
                              type={showPassword ? "text" : "password"} 
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Password"
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
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-400">
                              {validatedRequirements.map(req => (
                                  <div key={req.id} className="flex items-center gap-1.5">
                                      {req.isValid ? (
                                          <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                                      ) : (
                                          <XCircle className="h-3.5 w-3.5 text-red-400" />
                                      )}
                                      <span>{req.text}</span>
                                  </div>
                              ))}
                          </div>

                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-base transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg shadow-blue-600/20" disabled={isSubmitting || (password.length > 0 && !allRequirementsMet)}>
                            {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                            Create Account
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
                    <Button variant="outline" className="w-full bg-slate-800/60 border-slate-700 text-white hover:bg-slate-700/60 hover:text-white font-semibold py-3 rounded-lg transition-all" onClick={handleGoogleLogin} disabled={isSubmitting}>
                        <GoogleIcon className="mr-3 h-5 w-5" />
                        Sign up with Google
                    </Button>
                    <div className="mt-6 text-center text-sm">
                        <p className="text-slate-400">
                           Already have an account?{' '}
                           <Link href="/login" className="font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-2">
                            Login
                           </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    </div>
  );
}
