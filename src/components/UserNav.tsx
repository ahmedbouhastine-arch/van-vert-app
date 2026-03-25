"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export function UserNav() {
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      // 1. Explicitly clear the server session cookie first before client auth state changes
      await fetch('/api/auth/session/logout', { method: 'POST' });
      
      // 2. Sign out of Firebase client
      await signOut(auth);
      
      toast({
        title: "Signed out successfully",
        description: "You have been securely logged out.",
      });
      
      // 3. Navigate smoothly
      router.push('/login');
      router.refresh(); // Clear any cached server components
    } catch (error: unknown) {
      const err = (error as { message?: unknown }) || {};
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: typeof err.message === 'string' ? err.message : 'Failed to logout.',
      });
      setIsLoggingOut(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            {user.photoURL && <AvatarImage
              src={user.photoURL}
              alt={user.displayName || "User"}
              data-ai-hint="person portrait"
            />}
            <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">Settings</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
