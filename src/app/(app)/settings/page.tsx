'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase"
import { LoadingScreen } from "@/components/LoadingScreen";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { useState, useTransition } from "react";
import { Loader2, User, Palette, Bell } from "lucide-react";

export default function SettingsPage() {
    const { user, claims, loading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { theme, setTheme } = useTheme();

    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [appUpdates, setAppUpdates] = useState(true);
    const [promoEmails, setPromoEmails] = useState(true);
    
    const [isPendingProfile, startTransitionProfile] = useTransition();
    const [isPendingNotifications, startTransitionNotifications] = useTransition();

    if (loading) {
      return <LoadingScreen text="Loading settings..." />
    }

    if (!user || !claims) {
      // This should be caught by the layout and redirected, but as a fallback:
      return <LoadingScreen text="User not found." />;
    }
    
    const handleProfileSave = () => {
        startTransitionProfile(async () => {
            if (!user || !firestore) return;
            
            const userRef = doc(firestore, "users", user.uid);
            try {
                // Auth profile update can fail, so we await it.
                await updateProfile(user, { displayName });

                // Firestore update uses the non-blocking pattern.
                updateDoc(userRef, { displayName })
                    .catch((error) => {
                        const permissionError = new FirestorePermissionError({
                            path: userRef.path,
                            operation: 'update',
                            requestResourceData: { displayName },
                        });
                        errorEmitter.emit('permission-error', permissionError);
                        toast({
                            variant: 'destructive',
                            title: 'Database update failed',
                            description: 'Your name was updated for login, but failed to save to your profile page.',
                        });
                    });

                toast({
                    title: "Profile Update Saved",
                    description: "Your changes will be reflected shortly.",
                });
            } catch (error: any) {
                // This catches errors from `updateProfile`
                toast({
                    variant: 'destructive',
                    title: 'Update failed',
                    description: error.message,
                });
            }
        });
    }

    const handleNotificationsSave = () => {
        startTransitionNotifications(() => {
            // In a real app, you would save these preferences to the user's document in Firestore.
            // For now, we'll just show a success toast.
            toast({
                title: "Preferences Saved",
                description: "Your notification settings have been updated.",
            });
        });
    }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account settings and set e-mail preferences.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User /> My Profile</CardTitle>
          <CardDescription>
            This is how your name will be displayed in the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input id="full-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user.email || ''} readOnly disabled />
                </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleProfileSave} disabled={isPendingProfile}>
             {isPendingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette /> Appearance</CardTitle>
          <CardDescription>
            Customize the look and feel of the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
        <form className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="theme">Theme</Label>
                 <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger id="theme" className="w-full max-w-sm">
                        <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell /> Notifications</CardTitle>
          <CardDescription>
            Choose what you want to be notified about.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center justify-between space-x-4 rounded-md border p-4">
            <div className="flex items-center space-x-4">
                 <div>
                    <p className="text-sm font-medium leading-none">
                        Application Updates
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Receive e-mails when your application status changes.
                    </p>
                </div>
            </div>
             <Checkbox checked={appUpdates} onCheckedChange={(checked) => setAppUpdates(!!checked)} />
          </div>
           <div className="flex items-center justify-between space-x-4 rounded-md border p-4">
            <div className="flex items-center space-x-4">
                 <div>
                    <p className="text-sm font-medium leading-none">
                        Promotional Emails
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Get notified about new features and offers.
                    </p>
                </div>
            </div>
             <Checkbox checked={promoEmails} onCheckedChange={(checked) => setPromoEmails(!!checked)} />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleNotificationsSave} disabled={isPendingNotifications}>
            {isPendingNotifications && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preferences
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
