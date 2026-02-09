
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
import { getAuth, createUserWithEmailAndPassword, updateProfile, deleteUser } from "firebase/auth";
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
        if (!loading && user && claims) {
            const isAdmin = claims?.role === 'admin' || claims?.role === 'head-admin' || claims?.role === 'reviewer';
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

        let userCredential;
        try {
            // 1. Create the user in Firebase Auth
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            try {
                // 2. Update their Auth profile
                await updateProfile(user, { displayName: fullName });

                // 3. Create their user document in Firestore
                if (firestore) {
                    const userRef = doc(firestore, "users", user.uid);
                    await setDoc(userRef, {
                        displayName: fullName,
                        email: user.email,
                        photoURL: user.photoURL, // Initially null, can be updated later
                        role: email === 'head-admin@test.va' ? 'head-admin' : 'user', // Special role for demo purposes
                        createdAt: serverTimestamp(),
                    });
                }
            } catch (innerError) {
                // If creating the profile or Firestore doc fails, delete the Auth user
                // to prevent an inconsistent state.
                await deleteUser(user);
                throw innerError; // Rethrow to be caught by the outer catch block
            }

            toast({
                title: "Registration successful!",
                description: "You are now logged in and will be redirected.",
            });
              
            // After registration, the onAuthStateChanged listener in the provider
            // will detect the new user and claims, and the useEffect hook will redirect.

        } catch (error: any) {
            let description = error.message;
            if (error.code === 'auth/email-already-in-use') {
                description = "An account with this email already exists. Please log in.";
            } else {
                console.error("Registration Error: ", error); 
                description = "An unexpected error occurred. Please try again.";
            }
            toast({
                variant: 'destructive',
                title: 'Registration Failed',
                description: description,
            });
        } finally {
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
        await signInWithGoogle(auth, firestore);
    }

    if (loading || user) {
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
