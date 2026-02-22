"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
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
import { CheckCircle2, XCircle, Eye, EyeOff, Loader2, User as UserIcon, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuth, createUserWithEmailAndPassword, updateProfile, deleteUser, type UserCredential } from "firebase/auth";
import { useFirebaseApp, useFirestore, useUser } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { GoogleIcon } from "@/components/GoogleIcon";
import { LoadingScreen } from "@/components/LoadingScreen";
import { signInWithGoogle } from "@/firebase/auth-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import * as serverActions from "@/app/actions";


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
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

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

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

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
                        }) : Promise.reject("Firestore not available")
                    ]);
                    
                    toast({
                        title: "Registration successful!",
                        description: "You are now logged in and will be redirected.",
                    });
                    // The useEffect will handle the redirect, keep submitting true
                } catch (dbError) {
                    // If DB write fails after auth user creation, delete the auth user for consistency
                    await deleteUser(user).catch(deleteError => {
                        console.error("Failed to clean up orphaned user:", deleteError);
                    });
                    // Rethrow to be caught by the outer .catch
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
              setIsSubmitting(false); // Only re-enable form on failure
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
      const result = await signInWithGoogle(auth, firestore);
      if (result.success) return;
      if (result.error) {
        toast({ variant: 'destructive', title: 'Login Failed', description: result.error });
      }
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
            <div className="flex justify-center mb-4">
                <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={handleAvatarChange}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                />
                <div className="relative">
                    <Avatar className="h-24 w-24 cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                        <AvatarImage src={avatarPreview || undefined} alt="User avatar" />
                        <AvatarFallback className="text-4xl">
                           <UserIcon />
                        </AvatarFallback>
                    </Avatar>
                     <div 
                        className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground cursor-pointer border-2 border-background"
                        onClick={() => avatarInputRef.current?.click()}
                     >
                        <Camera className="h-4 w-4" />
                    </div>
                </div>
            </div>
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
