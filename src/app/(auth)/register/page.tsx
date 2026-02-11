
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuth, createUserWithEmailAndPassword, updateProfile, deleteUser, type UserCredential } from "firebase/auth";
import { useFirebaseApp, useFirestore, useUser } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { GoogleIcon } from "@/components/GoogleIcon";
import { LoadingScreen } from "@/components/LoadingScreen";
import { signInWithGoogle } from "@/firebase/auth-actions";


const passwordRequirements = [
    { id: "length", text: "At least 8 characters long", regex: /.{8,}/ },
    { id: "uppercase", text: "Contains an uppercase letter", regex: /[A-Z]/ },
    { id: "lowercase", text: "Contains a lowercase letter", regex: /[a-z]/ },
    { id: "number", text: "Contains a number", regex: /[0-9]/ },
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
    const { user, loading, claims } = useUser();

    useEffect(() => {
        // Wait until loading is complete and we have user and claims data.
        if (!loading && user && claims) {
            // Check user's role and redirect to the appropriate dashboard.
            const isAdmin = ['reviewer', 'admin', 'head-admin'].includes(claims.role);
            const homePath = isAdmin ? '/admin' : '/dashboard';
            router.push(homePath);
        }
    }, [user, loading, claims, router]);

    const validatedRequirements = passwordRequirements.map(req => ({
        ...req,
        isValid: req.regex.test(password),
    }));

    const allRequirementsMet = validatedRequirements.every(req => req.isValid);

    const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
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

        let userCredential: UserCredential | undefined;
        try {
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await Promise.all([
                updateProfile(user, { displayName: fullName }),
                firestore ? setDoc(doc(firestore, "users", user.uid), {
                    displayName: fullName,
                    email: user.email,
                    photoURL: user.photoURL,
                    role: email === 'head-admin@test.va' ? 'head-admin' : 'user',
                    createdAt: serverTimestamp(),
                }) : Promise.resolve()
            ]);
            
            toast({
                title: "Registration successful!",
                description: "You are now logged in and will be redirected.",
            });
            // The useEffect will handle the redirect, keep submitting true
        } catch (error: any) {
            // If the user was created in auth but the DB write failed, delete the auth user
            if (userCredential) {
                await deleteUser(userCredential.user).catch(deleteError => {
                    console.error("Failed to clean up orphaned user:", deleteError);
                });
            }

            let description = error.message;
            if (error.code === 'auth/email-already-in-use') {
                description = "An account with this email already exists. Please log in.";
            } else {
                console.error("Registration Error: ", error); 
                description = "An unexpected error occurred during sign-up. Please try again.";
            }
            toast({
                variant: 'destructive',
                title: 'Registration Failed',
                description: description,
            });
            setIsSubmitting(false); // Only re-enable form on failure
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
        await signInWithGoogle(auth, firestore);
    }

    // Show loading screen while auth state is loading OR if the user is logged in but claims are not yet loaded.
    if (loading || (user && !claims)) {
        return <LoadingScreen text="Finalizing account setup..."/>;
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Sign Up</CardTitle>
        <CardDescription>
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="full-name">Full Name</Label>
            <Input id="full-name" name="full-name" placeholder="John Pilot" required disabled={isSubmitting} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="pilot@example.com"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                  disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
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
          </div>
           <div className="grid gap-2 text-xs text-muted-foreground">
                {validatedRequirements.map(req => (
                    <div key={req.id} className="flex items-center gap-2">
                        {req.isValid ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                        )}
                        <span>{req.text}</span>
                    </div>
                ))}
            </div>
          <Button type="submit" className="w-full" disabled={isSubmitting || (password.length > 0 && !allRequirementsMet)}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create an account
          </Button>
        </form>
         <Separator className="my-6" />
        <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isSubmitting}>
             <GoogleIcon className="mr-2 h-4 w-4" />
          Sign up with Google
        </Button>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
