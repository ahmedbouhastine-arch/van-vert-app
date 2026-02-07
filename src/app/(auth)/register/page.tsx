
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
import { CheckCircle2, XCircle, Eye, EyeOff, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile, sendEmailVerification } from "firebase/auth";
import { useFirebaseApp, useFirestore, useUser, useStorage } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { GoogleIcon } from "@/components/GoogleIcon";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";


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
    const [profilePic, setProfilePic] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const app = useFirebaseApp();
    const auth = getAuth(app);
    const firestore = useFirestore();
    const storage = useStorage();
    const { user, loading, claims } = useUser();

    useEffect(() => {
        if (!loading && user) {
            // If user is already logged in, redirect them.
            // If they are not verified, they should land on the verify-email page.
            if (user.emailVerified) {
                const isAdmin = claims?.role === 'admin' || claims?.role === 'head-admin' || claims?.role === 'reviewer';
                const homePath = isAdmin ? '/admin' : '/dashboard';
                router.push(homePath);
            } else {
                router.push('/verify-email');
            }
        }
    }, [user, loading, claims, router]);

    const validatedRequirements = passwordRequirements.map(req => ({
        ...req,
        isValid: req.regex.test(password),
    }));

    const allRequirementsMet = validatedRequirements.every(req => req.isValid);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setProfilePic(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

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
        if (!profilePic) {
            toast({
                variant: 'destructive',
                title: 'Profile Picture Required',
                description: 'Please upload a profile picture to continue.',
            });
            return;
        }
        
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        const email = formData.get("email") as string;
        const fullName = formData.get("full-name") as string;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 1. Upload profile picture to get the URL
            let photoURL = "";
            if (storage) {
                const storageRef = ref(storage, `profile-pictures/${user.uid}`);
                await uploadBytes(storageRef, profilePic);
                photoURL = await getDownloadURL(storageRef);
            }
            
            // 2. Update the Firebase Auth user profile with name and photo URL
            await updateProfile(user, { displayName: fullName, photoURL });

            // 3. Create the user document in Firestore
            if (firestore) {
              const userRef = doc(firestore, "users", user.uid);
              await setDoc(userRef, {
                displayName: fullName,
                email: user.email,
                role: "applicant",
                createdAt: serverTimestamp(),
                photoURL: photoURL
              });
            }

            // 4. Now that the profile is updated, send the verification email
            await sendEmailVerification(user);
            
            toast({
                title: "Registration successful!",
                description: "We've sent a verification link to your email address.",
              });
              
            router.push('/verify-email');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Registration Failed',
                description: error.message,
            });
        } finally {
            setIsSubmitting(false);
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
                photoURL: user.photoURL,
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
        return <LoadingScreen />;
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
          <div className="grid gap-4 justify-center">
            <Label htmlFor="profile-pic-input">
                <Avatar className="h-24 w-24 cursor-pointer">
                    <AvatarImage src={previewUrl || undefined} alt="Profile preview" />
                    <AvatarFallback className="bg-muted hover:bg-muted/80 transition-colors">
                        <Camera className="h-8 w-8 text-muted-foreground" />
                    </AvatarFallback>
                </Avatar>
            </Label>
            <Input 
                id="profile-pic-input" 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept="image/png, image/jpeg"
                onChange={handleFileChange}
            />
            <p className="text-center text-xs text-muted-foreground">
                Please upload a clear, forward-facing picture of the pilot.
            </p>
          </div>
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
            <div className="relative">
              <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
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
          <Button type="submit" className="w-full" disabled={(isSubmitting || (!allRequirementsMet && password.length > 0))}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
