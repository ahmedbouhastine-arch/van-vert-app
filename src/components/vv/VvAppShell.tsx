"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Menu,
  Search,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Upload,
  FileText,
  Mailbox,
} from "lucide-react";
import { signOut } from "firebase/auth";
import {
  collection,
  doc,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";

import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@/types";
import { VvAvatar } from "./VvAvatar";
import { ROLE_LABEL, navConfigForRole, type VvNavItem } from "./nav-config";

const NOTIF_ICON: Record<string, React.ElementType> = {
  approved: CheckCircle2,
  rejected: AlertCircle,
  needs_attention: AlertCircle,
  upload: Upload,
  default: FileText,
};

function notifIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes("approved") || t.includes("verified")) return { Icon: CheckCircle2, tone: "ready" as const };
  if (t.includes("attention") || t.includes("feedback") || t.includes("reject")) return { Icon: AlertCircle, tone: "attention" as const };
  if (t.includes("upload")) return { Icon: Upload, tone: "default" as const };
  return { Icon: FileText, tone: "default" as const };
}

function isActiveHref(href: string, pathname: string) {
  if (href === "/dashboard" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({ item, pathname }: { item: VvNavItem; pathname: string }) {
  const active = isActiveHref(item.href, pathname);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm transition-colors",
        active
          ? "border-l-[var(--sky-bright)] bg-[rgba(0,135,165,0.12)] font-medium text-white"
          : "border-l-transparent text-white/65 hover:text-white"
      )}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
      {item.label}
    </Link>
  );
}

function SidebarContent({
  role,
  pathname,
  me,
}: {
  role: string;
  pathname: string;
  me: { name: string; role: string };
}) {
  const cfg = navConfigForRole(role);
  return (
    <div className="flex h-full w-60 flex-col bg-[var(--navy)]">
      <div className="border-b border-white/[0.06] px-5 py-5">
        <Link href="/" className="font-outfit text-lg font-bold tracking-tight">
          <span className="text-white">Van-</span>
          <span className="text-[var(--sky-bright)]">Vert</span>
        </Link>
      </div>

      <nav className="flex flex-col gap-0.5 px-3 pb-2 pt-4">
        {cfg.primary.map((item) => (
          <NavLink key={item.id} item={item} pathname={pathname} />
        ))}
      </nav>

      <div className="flex-1" />

      <div className="border-t border-white/[0.06] px-3 py-3">
        <div className="px-3 pb-1 pt-1.5 font-inter text-[10px] font-semibold uppercase tracking-[3px] text-white/35">
          You
        </div>
        <nav className="flex flex-col gap-0.5">
          {cfg.secondary.map((item) => (
            <NavLink key={item.id} item={item} pathname={pathname} />
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2.5 border-t border-white/[0.06] px-4 py-4">
        <VvAvatar name={me.name} size={32} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-white">{me.name}</div>
          <div className="font-inter text-[10px] font-semibold uppercase tracking-[2px] text-[var(--sky-bright)]">
            {me.role}
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationsDropdown() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const notifsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "notifications"), orderBy("createdAt", "desc"));
  }, [firestore, user]);

  const { data: notifications } = useCollection<Notification>(notifsQuery);
  const items = notifications?.slice(0, 6) ?? [];
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  const handleOpenChange = async (next: boolean) => {
    setOpen(next);
    if (next && firestore && user && notifications?.length) {
      const unread = notifications.filter((n) => !n.isRead);
      if (unread.length) {
        const batch = writeBatch(firestore);
        unread.forEach((n) => batch.update(doc(firestore, `users/${user.uid}/notifications/${n.id}`), { isRead: true }));
        await batch.commit();
      }
    }
  };

  const handleItemClick = async (n: Notification) => {
    if (!n.isRead && firestore && user) {
      await updateDoc(doc(firestore, `users/${user.uid}/notifications/${n.id}`), { isRead: true });
    }
    setOpen(false);
    if (n.href) router.push(n.href);
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "relative flex h-[38px] w-[38px] items-center justify-center rounded-lg border transition-colors",
            open
              ? "border-[var(--sky)] bg-[var(--sky-pale)] text-[var(--sky)]"
              : "border-[var(--vv-border)] bg-white text-[var(--text-secondary)] hover:text-[var(--sky)]"
          )}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-[var(--status-missing)] px-[3px] text-[9px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] rounded-xl border-[var(--vv-border)] p-0 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between border-b border-[var(--vv-border)] px-5 py-4">
          <span className="font-outfit text-[15px] font-semibold text-[var(--navy)]">Notifications</span>
          {unreadCount > 0 && <span className="text-[11px] text-[var(--text-muted)]">{unreadCount} new</span>}
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {items.length > 0 ? (
            items.map((n, i) => {
              const { Icon, tone } = notifIcon(n.title);
              return (
                <DropdownMenuItem
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-none border-b border-[var(--vv-border-soft)] px-5 py-3.5 last:border-b-0",
                    !n.isRead && "bg-[var(--sky-pale)]"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      tone === "ready" && "bg-[#f0fdf4] text-[var(--status-ready)]",
                      tone === "attention" && "bg-[#fffbeb] text-[var(--status-attention)]",
                      tone === "default" && "bg-[var(--sky-pale)] text-[var(--sky)]"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] leading-snug text-[var(--text-primary)]">{n.title}</div>
                    <div className="mt-1 text-[11px] text-[var(--text-muted)]">
                      {formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true })}
                    </div>
                  </div>
                  {!n.isRead && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--sky)]" />}
                </DropdownMenuItem>
              );
            })
          ) : (
            <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
              <Mailbox className="h-10 w-10 text-[var(--text-muted)]" />
              <p className="text-sm font-medium text-[var(--text-primary)]">You&apos;re all caught up!</p>
              <p className="text-xs text-[var(--text-muted)]">You have no new notifications.</p>
            </div>
          )}
        </div>
        <div className="border-t border-[var(--vv-border)] px-5 py-3 text-center">
          <button
            onClick={() => {
              setOpen(false);
              router.push("/notifications");
            }}
            className="text-xs font-medium text-[var(--sky)] hover:underline"
          >
            View all notifications
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AvatarMenu({ name, email, role }: { name: string; email?: string | null; role: string }) {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/session/logout", { method: "POST" });
      await signOut(auth);
      toast({ title: "Signed out successfully", description: "You have been securely logged out." });
      window.location.href = "/login";
    } catch (error: unknown) {
      const err = (error as { message?: unknown }) || {};
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: typeof err.message === "string" ? err.message : "Failed to logout.",
      });
      setIsLoggingOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 rounded-full border border-[var(--vv-border)] bg-white py-1 pl-1 pr-3 transition-colors hover:border-[var(--sky)]">
          <VvAvatar name={name} email={email} size={30} />
          <div className="text-left leading-tight">
            <div className="text-xs font-medium text-[var(--text-primary)]">{name}</div>
            <div className="text-[10px] text-[var(--text-muted)]">{role}</div>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl border-[var(--vv-border)]">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-[var(--text-primary)]">{name}</p>
            <p className="text-xs leading-none text-[var(--text-muted)]">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/settings">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface VvAppShellProps {
  /** Trail of page-name segments shown after the role crumb, e.g. ["Applications", "APP-2026-00412"] */
  crumbs?: string[];
  children: React.ReactNode;
}

export function VvAppShell({ crumbs, children }: VvAppShellProps) {
  const { user, claims } = useUser();
  const pathname = usePathname();

  const role: string = claims?.role || "user";
  const name: string = claims?.displayName || user?.displayName || user?.email || "Pilot";
  const cfg = navConfigForRole(role);
  const me = { name, role: ROLE_LABEL[role as keyof typeof ROLE_LABEL] ?? "Pilot" };

  return (
    <div className="flex min-h-screen w-full bg-[var(--sky-mist)]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden lg:block">
        <SidebarContent role={role} pathname={pathname} me={me} />
      </aside>

      <div className="flex w-full flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex h-[68px] shrink-0 items-center gap-6 border-b border-[var(--vv-border)] bg-white px-6 lg:px-8">
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface)] lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 border-none p-0">
              <SidebarContent role={role} pathname={pathname} me={me} />
            </SheetContent>
          </Sheet>

          <nav className="hidden min-w-0 items-center gap-2 text-[13px] text-[var(--text-secondary)] md:flex">
            <span className="text-[var(--text-muted)]">{cfg.crumb}</span>
            {crumbs?.map((c, i) => (
              <React.Fragment key={i}>
                <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                <span className={cn(i === crumbs.length - 1 ? "font-medium text-[var(--text-primary)]" : "text-[var(--text-secondary)]")}>
                  {c}
                </span>
              </React.Fragment>
            ))}
          </nav>

          <div className="relative mx-auto hidden w-full max-w-[440px] flex-1 md:block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="search"
              placeholder="Search applications, pilots, documents…"
              className="w-full rounded-lg border border-[var(--vv-border)] bg-[var(--surface)] py-2.5 pl-10 pr-12 font-inter text-[13px] text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--sky)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,120,165,0.08)]"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-[var(--vv-border)] bg-white px-1.5 py-0.5 font-inter text-[10px] font-semibold tracking-wide text-[var(--text-muted)]">
              ⌘ K
            </kbd>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <NotificationsDropdown />
            <AvatarMenu name={name} email={user?.email} role={me.role} />
          </div>
        </header>

        <main className="flex-1 px-6 py-10 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-[1200px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
