'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function VerifiedPage() {
  return (
    <Card>
      <CardHeader className="items-center text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
        <CardTitle className="text-2xl font-headline">Email Verified!</CardTitle>
        <CardDescription>
            Your email address has been successfully verified. You can now log in to your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/login" className="w-full">
            <Button className="w-full">Proceed to Login</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
