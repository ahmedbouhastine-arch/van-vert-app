"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const passwordRequirements = [
    { id: "length", text: "At least 8 characters long", regex: /.{8,}/ },
    { id: "uppercase", text: "Contains an uppercase letter", regex: /[A-Z]/ },
    { id: "lowercase", text: "Contains a lowercase letter", regex: /[a-z]/ },
    { id: "number", text: "Contains a number", regex: /[0-9]/ },
];

export default function RegisterPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const validatedRequirements = passwordRequirements.map(req => ({
        ...req,
        isValid: req.regex.test(password),
    }));

    const allRequirementsMet = validatedRequirements.every(req => req.isValid);

    const handleRegister = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!allRequirementsMet) {
            setPasswordError("Please ensure your password meets all requirements.");
            return;
        }
        setPasswordError("");
        // Mock registration logic
        router.push("/dashboard");
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
            <Input id="full-name" placeholder="John Pilot" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
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
            {passwordError && <p className="text-sm font-medium text-destructive">{passwordError}</p>}
          <Button type="submit" className="w-full" disabled={!allRequirementsMet && password.length > 0}>
            Create an account
          </Button>
        </form>
         <Separator className="my-6" />
        <Button variant="outline" className="w-full">
             <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.84-4.25 1.84-5.18 0-9.4-4.22-9.4-9.4s4.22-9.4 9.4-9.4c2.6 0 4.38 1.02 5.7 2.23l2.42-2.34C18.57.45 15.82 0 12.48 0 5.6 0 0 5.6 0 12.48s5.6 12.48 12.48 12.48c7.28 0 12.1-5.13 12.1-12.48 0-.8-.08-1.55-.25-2.25z"></path></svg>
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
