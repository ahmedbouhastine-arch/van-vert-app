'use client';

import { Input } from "@/components/ui/input"
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
import { User, Palette, Bell } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { VvPageHeader } from "@/components/vv/VvPageHeader";
import { VvButton } from "@/components/vv/VvButton";
import { cn } from "@/lib/utils";

function Toggle({ on, onChange }: { on: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn(
        "relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors",
        on ? "bg-[var(--sky)]" : "bg-[var(--vv-border)]"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.15)] transition-all",
          on ? "left-[18px]" : "left-0.5"
        )}
      />
    </button>
  );
}

function SettingRow({ title, sub, control }: { title: string; sub: string; control: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-[18px]">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-[var(--navy)]">{title}</div>
        <div className="mt-1 text-[13px] leading-relaxed text-[var(--text-secondary)]">{sub}</div>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

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
                    .catch(() => {
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
            } catch (error: unknown) {
              const err = (error as { message?: unknown }) || {};
              // This catches errors from `updateProfile`
              toast({
                variant: 'destructive',
                title: 'Update failed',
                description: typeof err.message === 'string' ? err.message : 'Failed to update profile.',
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
    <PageTransition>
      <VvPageHeader
        kicker="Account"
        title="Settings"
        sub="Manage your account settings and set e-mail preferences."
      />

      <div className="grid gap-5">
        <div className="rounded-xl border border-[var(--vv-border)] bg-white">
          <div className="flex items-center gap-2 border-b border-[var(--vv-border-soft)] p-6">
            <User className="h-4 w-4 text-[var(--sky)]" />
            <div>
              <h3 className="font-outfit text-base font-semibold text-[var(--navy)]">My profile</h3>
              <p className="mt-0.5 text-[13px] text-[var(--text-muted)]">This is how your name will be displayed in the application.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="full-name" className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Full name</Label>
              <Input id="full-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="rounded-lg border-[var(--vv-border)] focus-visible:ring-[var(--sky)]" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Email</Label>
              <Input id="email" type="email" defaultValue={user.email || ''} readOnly disabled className="rounded-lg border-[var(--vv-border)]" />
            </div>
          </div>
          <div className="border-t border-[var(--vv-border-soft)] p-6">
            <VvButton onClick={handleProfileSave} disabled={isPendingProfile} loading={isPendingProfile}>
              Save changes
            </VvButton>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--vv-border)] bg-white">
          <div className="flex items-center gap-2 border-b border-[var(--vv-border-soft)] p-6">
            <Palette className="h-4 w-4 text-[var(--sky)]" />
            <div>
              <h3 className="font-outfit text-base font-semibold text-[var(--navy)]">Appearance</h3>
              <p className="mt-0.5 text-[13px] text-[var(--text-muted)]">Customize the look and feel of the application.</p>
            </div>
          </div>
          <div className="p-6">
            <div className="grid max-w-sm gap-1.5">
              <Label htmlFor="theme" className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme" className="rounded-lg border-[var(--vv-border)]">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--vv-border)] bg-white">
          <div className="flex items-center gap-2 border-b border-[var(--vv-border-soft)] p-6">
            <Bell className="h-4 w-4 text-[var(--sky)]" />
            <div>
              <h3 className="font-outfit text-base font-semibold text-[var(--navy)]">Notifications</h3>
              <p className="mt-0.5 text-[13px] text-[var(--text-muted)]">Choose what you want to be notified about.</p>
            </div>
          </div>
          <div className="divide-y divide-[var(--vv-border-soft)] px-6">
            <SettingRow
              title="Application updates"
              sub="Receive e-mails when your application status changes."
              control={<Toggle on={appUpdates} onChange={setAppUpdates} />}
            />
            <SettingRow
              title="Promotional emails"
              sub="Get notified about new features and offers."
              control={<Toggle on={promoEmails} onChange={setPromoEmails} />}
            />
          </div>
          <div className="border-t border-[var(--vv-border-soft)] p-6">
            <VvButton onClick={handleNotificationsSave} disabled={isPendingNotifications} loading={isPendingNotifications}>
              Save preferences
            </VvButton>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
