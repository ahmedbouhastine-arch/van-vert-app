
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@/firebase";
import Link from "next/link";

export default function ProfilePage() {
  const { user, claims } = useUser();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          My Profile
        </h1>
        <p className="text-muted-foreground">
          View and manage your profile information.
        </p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              {user.photoURL && <AvatarImage
                src={user.photoURL}
                alt={user.displayName || ''}
                data-ai-hint="person portrait"
              />}
              <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl font-bold font-headline">
                {user.displayName || "User"}
              </CardTitle>
              <CardDescription className="text-lg">{user.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="mt-4">
          <div className="grid gap-2">
            <div className="text-sm text-muted-foreground">Role</div>
            <div className="font-medium capitalize">{claims?.role}</div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Link href="/settings">
            <Button>Edit Profile</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
