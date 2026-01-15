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
import { users } from "@/lib/data";
import Link from "next/link";

export default function ProfilePage() {
  const user = users[0]; // Mock user

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
              <AvatarImage
                src={user.avatarUrl}
                alt={user.name}
                data-ai-hint="person portrait"
              />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl font-bold font-headline">
                {user.name}
              </CardTitle>
              <CardDescription className="text-lg">{user.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="mt-4">
          <div className="grid gap-2">
            <div className="text-sm text-muted-foreground">Role</div>
            <div className="font-medium capitalize">{user.role}</div>
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
