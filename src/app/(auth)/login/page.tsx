"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const handleLoginAsUser = () => {
    router.push("/dashboard");
  };

  const handleLoginAsAdmin = () => {
    router.push("/admin");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Login</CardTitle>
        <CardDescription>
          Sign in to your PilotPack account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <Button onClick={handleLoginAsUser} className="w-full">
            <User className="mr-2" />
            Sign in as User
          </Button>
          <Button onClick={handleLoginAsAdmin} variant="secondary" className="w-full">
             <Shield className="mr-2" />
            Sign in as Admin
          </Button>
        </div>
        <Separator className="my-6" />
        <Button variant="outline" className="w-full">
            <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.84-4.25 1.84-5.18 0-9.4-4.22-9.4-9.4s4.22-9.4 9.4-9.4c2.6 0 4.38 1.02 5.7 2.23l2.42-2.34C18.57.45 15.82 0 12.48 0 5.6 0 0 5.6 0 12.48s5.6 12.48 12.48 12.48c7.28 0 12.1-5.13 12.1-12.48 0-.8-.08-1.55-.25-2.25z"></path></svg>
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
