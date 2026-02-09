
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
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useFirebaseApp, useUser, useFirestore } from "@/firebase";
import { GoogleIcon } from "@/components/GoogleIcon";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signInWithGoogle } from "@/firebase/auth-actions";

export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const app = useFirebaseApp();
    const auth = getAuth(app);
    const firestore = useFirestore();
    const { user, loading, claims } = useUser();
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!loading && user && claims) {
            const isAdmin = ['reviewer', 'admin', 'head-admin'].includes(claims.role);
            const homePath = isAdmin ? '/admin' : '/dashboard';
            router.push(homePath);
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
            // On success, the useEffect hook will handle the redirect.
        } catch (error: any) {
            let description = error.message;
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                description = "Invalid email or password. Please try again.";
            }
            toast({
                variant: 'destructive',
                title: 'Login Failed',
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

    if (loading || (user && !claims)) {
      return <LoadingScreen text="Authenticating..." />;
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Login</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="grid gap-4">
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
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="ml-auto inline-block text-sm underline"
              >
                Forgot your password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
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
          <Button type="submit" className="w-full" disabled={isSubmitting}>
             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </Button>
        </form>
         <Separator className="my-6" />
        <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isSubmitting}>
            <GoogleIcon className="mr-2 h-4 w-4" />
          Login with Google
        </Button>
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
