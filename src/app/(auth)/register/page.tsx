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
import { CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile, sendEmailVerification } from "firebase/auth";
import { useFirebaseApp, useFirestore, useUser } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { GoogleIcon } from "@/components/GoogleIcon";


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
    const app = useFirebaseApp();
    const auth = getAuth(app);
    const firestore = useFirestore();
    const { user, loading, claims } = useUser();

    useEffect(() => {
        if (!loading && user) {
            const isAdmin = claims?.role === 'admin';
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
        
        const formData = new FormData(event.currentTarget);
        const email = formData.get("email") as string;
        const fullName = formData.get("full-name") as string;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            await updateProfile(user, { displayName: fullName });
            await sendEmailVerification(user);

            if (firestore) {
              const userRef = doc(firestore, "users", user.uid);
              await setDoc(userRef, {
                displayName: fullName,
                email: user.email,
                role: "applicant",
                createdAt: serverTimestamp(),
              });
            }
            
            toast({
                title: "Registration successful!",
                description: "A verification email has been sent. Please check your inbox.",
              });
              
            // Redirection is handled by the useEffect hook
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Registration Failed',
                description: error.message,
            });
        }
    }

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            if (firestore) {
              const userRef = doc(firestore, "users", user.uid);
              await setDoc(userRef, {
                displayName: user.displayName,
                email: user.email,
                role: "applicant",
                createdAt: serverTimestamp(),
              }, { merge: true }); // Merge to not overwrite role if they already exist
            }

            // Redirection is handled by useEffect
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: error.message,
            });
        }
    }

    if (loading || user) {
        return <div>Loading...</div>;
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
            <Input id="full-name" name="full-name" placeholder="John Pilot" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="pilot@example.com"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
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
          <Button type="submit" className="w-full" disabled={!allRequirementsMet && password.length > 0}>
            Create an account
          </Button>
        </form>
         <Separator className="my-6" />
        <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
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
