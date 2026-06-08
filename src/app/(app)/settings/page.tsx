'use client';

import { useUser } from "@/firebase"
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition, useMemo } from "react";
import { Bell, Lock, Monitor, LogOut, Trash2 } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { VvPageHeader } from "@/components/vv/VvPageHeader";
import { VvButton } from "@/components/vv/VvButton";
import { cn } from "@/lib/utils";
import { deleteUserAccountAction, signOutOtherSessionsAction } from "@/app/actions";
import { getAuth, signOut } from "firebase/auth";

/* ──────────────────────────────────────────────────────────────────────────
   Friendly "browser on OS" label from the user agent string
   ────────────────────────────────────────────────────────────────────────── */
function describeDevice(ua: string): string {
  const os =
    /iPhone|iPad|iPod/.test(ua) ? 'iOS' :
    /Android/.test(ua) ? 'Android' :
    /Mac OS X/.test(ua) ? 'macOS' :
    /Windows/.test(ua) ? 'Windows' :
    /Linux/.test(ua) ? 'Linux' : 'Unknown OS';

  const browser =
    /Edg\//.test(ua) ? 'Edge' :
    /OPR\//.test(ua) ? 'Opera' :
    /Chrome\//.test(ua) ? 'Chrome' :
    /CriOS\//.test(ua) ? 'Chrome' :
    /Firefox\//.test(ua) ? 'Firefox' :
    /Safari\//.test(ua) ? 'Safari' : 'Unknown browser';

  return `${browser} on ${os}`;
}

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
    const { toast } = useToast();

    const [appUpdates, setAppUpdates] = useState(true);
    const [promoEmails, setPromoEmails] = useState(true);

    const [isPendingNotifications, startTransitionNotifications] = useTransition();

    /* ── Sessions ────────────────────────────────────────────────────────── */
    const [isSigningOutOthers, setIsSigningOutOthers] = useState(false);
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
    const currentDevice = useMemo(
      () => (typeof navigator !== 'undefined' ? describeDevice(navigator.userAgent) : 'This device'),
      []
    );

    /* ── Delete account state ────────────────────────────────────────────── */
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    /* ── Sign out ─────────────────────────────────────────────────────────── */
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    if (loading || !user || !claims) {
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
                <Skeleton className="h-4 w-4 rounded" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
              <div className="divide-y divide-[var(--vv-border-soft)] px-6">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-6 py-[18px]">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-3 w-full max-w-xs" />
                    </div>
                    <Skeleton className="h-[22px] w-[38px] rounded-full" />
                  </div>
                ))}
              </div>
              <div className="border-t border-[var(--vv-border-soft)] p-6">
                <Skeleton className="h-9 w-36 rounded-lg" />
              </div>
            </div>
          </div>
        </PageTransition>
      );
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

    /* ── Sign out of other sessions ──────────────────────────────────────── */
    const handleSignOutOtherSessions = async () => {
        setIsSigningOutOthers(true);
        try {
            const idToken = await user!.getIdToken();
            const { success } = await signOutOtherSessionsAction(idToken);
            if (success) {
                toast({ title: "Signed out of other sessions", description: "Any other devices will be asked to log in again." });
                setShowSignOutConfirm(false);
            } else {
                throw new Error("Failed to revoke sessions");
            }
        } catch {
            toast({ variant: 'destructive', title: "Couldn't sign out other sessions", description: "Please try again." });
        } finally {
            setIsSigningOutOthers(false);
        }
    };

    /* ── Sign out ─────────────────────────────────────────────────────────── */
    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        try {
            await fetch('/api/auth/session/logout', { method: 'POST' });
            await signOut(getAuth());
            toast({ title: "Signed out successfully", description: "You have been securely logged out." });
            window.location.href = '/login';
        } catch (error: unknown) {
            const err = (error as { message?: unknown }) || {};
            toast({
                variant: 'destructive',
                title: 'Logout failed',
                description: typeof err.message === 'string' ? err.message : 'Failed to logout.',
            });
            setIsLoggingOut(false);
        }
    };

    /* ── Delete account ──────────────────────────────────────────────────── */
    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const idToken = await user!.getIdToken();
            await deleteUserAccountAction(idToken);
            toast({ title: "Account Deleted", description: "Your account has been successfully deleted." });
            await fetch('/api/auth/session/logout', { method: 'POST' });
            await signOut(getAuth());
            window.location.href = '/login';
        } catch {
            toast({ variant: 'destructive', title: "Deletion Failed", description: "Could not delete your account." });
        } finally {
            setIsDeleting(false);
        }
    };

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

        {/* ── Security card ──────────────────────────────────────────────── */}
        <div className="rounded-xl border border-[var(--vv-border)] bg-white">
          <div className="flex items-center gap-2 border-b border-[var(--vv-border-soft)] p-6">
            <Lock className="h-4 w-4 text-[var(--sky)]" />
            <h3 className="font-outfit text-base font-semibold text-[var(--navy)]">Security</h3>
          </div>
          <div className="space-y-0 px-6">
            <div className="flex items-center justify-between border-b border-[var(--vv-border-soft)] py-4 text-sm">
              <span className="text-[var(--text-muted)]">Last login</span>
              <span className="font-medium text-[var(--text-primary)]">
                {user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between py-4 text-sm">
              <span className="text-[var(--text-muted)]">Account created</span>
              <span className="font-medium text-[var(--text-primary)]">
                {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
          <div className="border-t border-[var(--vv-border-soft)] p-6">
            <VvButton variant="outline" size="sm">Change password</VvButton>
          </div>
        </div>

        {/* ── Active sessions card ───────────────────────────────────────── */}
        <div className="rounded-xl border border-[var(--vv-border)] bg-white">
          <div className="flex items-center justify-between border-b border-[var(--vv-border-soft)] p-6">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-[var(--sky)]" />
              <h3 className="font-outfit text-base font-semibold text-[var(--navy)]">Active sessions</h3>
            </div>
            <VvButton variant="outline" size="sm" onClick={() => setShowSignOutConfirm(true)}>
              <LogOut className="h-3.5 w-3.5" />
              Sign out of other devices
            </VvButton>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between rounded-[10px] border border-[var(--vv-border-soft)] bg-[var(--surface)] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[var(--vv-border)] bg-white text-[var(--sky)]">
                  <Monitor className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--navy)]">{currentDevice}</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Active now &middot; signed in {user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'recently'}
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-2.5 py-1 text-xs font-medium text-[var(--status-ready)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-ready)]"></span>
                This device
              </span>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">
              Firebase doesn&apos;t expose a list of individual devices, so &quot;Sign out of other devices&quot;
              invalidates every other active session at once — this device stays signed in, and any others
              will be asked to log in again next time they refresh.
            </p>
          </div>
        </div>

        {/* ── Danger zone ────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-[#fecdd3] bg-white">
          <div className="flex items-center gap-2 border-b border-[#fecdd3]/50 p-6">
            <Trash2 className="h-4 w-4 text-[var(--status-missing)]" />
            <h3 className="font-outfit text-base font-semibold text-[var(--status-missing)]">Danger zone</h3>
          </div>
          <div className="divide-y divide-[#fecdd3]/50 px-6">
            <div className="flex items-center justify-between gap-6 py-5">
              <div>
                <div className="text-sm font-semibold text-[var(--navy)]">Sign out</div>
                <div className="mt-1 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                  Sign out of your account on this device.
                </div>
              </div>
              <VvButton
                variant="outline"
                size="sm"
                className="flex-shrink-0"
                onClick={handleLogout}
                loading={isLoggingOut}
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </VvButton>
            </div>
            <div className="flex items-center justify-between gap-6 py-5">
              <div>
                <div className="text-sm font-semibold text-[var(--navy)]">Delete account</div>
                <div className="mt-1 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                  Permanently delete your account and all application data. This cannot be undone.
                </div>
              </div>
              <VvButton
                variant="danger"
                size="sm"
                className="flex-shrink-0"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete account
              </VvButton>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sign out other sessions confirmation modal ──────────────────── */}
      {showSignOutConfirm && (
        <Dialog open onOpenChange={setShowSignOutConfirm}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-outfit text-xl font-semibold text-[var(--navy)]">
                Sign out of other devices?
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              This signs the account out everywhere except <span className="font-semibold text-[var(--text-primary)]">{currentDevice}</span>.
              Anyone using your account on another device or browser will need to log in again.
            </p>
            <DialogFooter>
              <VvButton variant="ghost" onClick={() => setShowSignOutConfirm(false)}>Cancel</VvButton>
              <VvButton onClick={handleSignOutOtherSessions} loading={isSigningOutOthers}>
                <LogOut className="h-3.5 w-3.5" />
                Sign out other devices
              </VvButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Delete confirmation modal ──────────────────────────────────── */}
      {showDeleteConfirm && (
        <Dialog open onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-outfit text-xl font-semibold text-[var(--navy)]">
                Are you sure?
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              This action is permanent and cannot be undone. All your applications and uploaded documents will be permanently removed.
            </p>
            <DialogFooter>
              <VvButton variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</VvButton>
              <VvButton variant="danger" onClick={handleDeleteAccount} loading={isDeleting}>
                Yes, delete my account
              </VvButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </PageTransition>
  )
}
