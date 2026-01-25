
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
import { useUser, useFirestore } from "@/firebase"
import { LoadingScreen } from "@/components/LoadingScreen";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
    const { user, claims, loading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    if (loading) {
      return <LoadingScreen text="Loading settings..." />
    }

    if (!user || !claims) {
      // This should be caught by the layout and redirected, but as a fallback:
      return <LoadingScreen text="User not found." />;
    }

    const handleRoleChange = async (newRole: 'applicant' | 'admin' | 'head-admin' | 'reviewer') => {
      if (!user || !firestore) return;
      const userRef = doc(firestore, "users", user.uid);
      try {
          await updateDoc(userRef, { role: newRole });
          toast({
              title: "Success",
              description: `Your role has been updated to ${newRole}.`,
          });
      } catch (error: any) {
          toast({
              variant: 'destructive',
              title: 'Update failed',
              description: error.message,
          });
      }
    };

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
          <CardTitle>My Profile</CardTitle>
          <CardDescription>
            Update your personal information here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input id="full-name" defaultValue={user.displayName || ''} />
                </div>
                <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user.email || ''} readOnly />
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={claims.role} onValueChange={(value) => handleRoleChange(value as any)}>
                    <SelectTrigger id="role" className="w-full max-w-sm">
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="applicant">Applicant</SelectItem>
                        <SelectItem value="reviewer">Reviewer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="head-admin">Head Admin</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </form>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button>Save</Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize the look and feel of the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
        <form className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="theme">Theme</Label>
                 <Select defaultValue="system">
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
        <CardFooter className="border-t px-6 py-4">
          <Button>Save</Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
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
             <Checkbox defaultChecked />
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
             <Checkbox />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button>Save</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
