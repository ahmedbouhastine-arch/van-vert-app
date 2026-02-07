"use client";

import Link from "next/link";
import { useState } from "react";
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
import { useAuth } from "@/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
    const { toast } = useToast();
    const auth = useAuth();
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handlePasswordReset = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        
        try {
            await sendPasswordResetEmail(auth, email);
            setEmailSent(true);
            toast({
                title: 'Reset Link Sent',
                description: `A password reset link has been sent to ${email}.`,
            });
        } catch (error: any) {
            let description = error.message;
            if (error.code === 'auth/user-not-found') {
                description = "No account found with this email address.";
            }
            toast({
                variant: 'destructive',
                title: 'Failed to Send',
                description: description,
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (emailSent) {
        return (
            <Card>
                <CardHeader className="items-center text-center">
                    <Mail className="h-12 w-12 text-primary mb-4" />
                    <CardTitle className="text-2xl font-headline">Check Your Inbox</CardTitle>
                    <CardDescription>
                        A password reset link has been sent to <span className="font-semibold text-foreground">{email}</span>. Please use the link to reset your password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/login" className="w-full">
                        <Button className="w-full">Back to Login</Button>
                    </Link>
                </CardContent>
            </Card>
        )
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Forgot Password</CardTitle>
        <CardDescription>
          Enter your email and we'll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordReset} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="pilot@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Link
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Remember your password?{" "}
          <Link href="/login" className="underline">
            Login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
