"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAuth, signOut } from "firebase/auth";

import { useUser } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { VvAppShell } from "@/components/vv/VvAppShell";

function AppShellSkeleton() {
  const [showForceSignOut, setShowForceSignOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowForceSignOut(true), 12000);
    return () => clearTimeout(timer);
  }, []);

  const handleForceReset = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      await fetch("/api/auth/session/logout", { method: "POST" });
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[var(--sky-mist)]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden lg:block">
        <div className="flex h-full w-60 flex-col bg-[var(--navy)]">
          <div className="border-b border-white/[0.06] px-5 py-5">
            <Skeleton className="h-6 w-24 bg-white/15" />
          </div>
          <nav className="flex flex-col gap-0.5 px-3 pb-2 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <Skeleton className="h-[18px] w-[18px] shrink-0 rounded bg-white/15" />
                <Skeleton className="h-3.5 w-20 bg-white/15" />
              </div>
            ))}
          </nav>
          <div className="flex-1" />
          <div className="flex items-center gap-2.5 border-t border-white/[0.06] px-4 py-4">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full bg-white/15" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton className="h-3 w-24 bg-white/15" />
              <Skeleton className="h-2.5 w-16 bg-white/15" />
            </div>
          </div>
        </div>
      </aside>

      <div className="flex w-full flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex h-[68px] shrink-0 items-center gap-6 border-b border-[var(--vv-border)] bg-white px-6 lg:px-8">
          <div className="hidden flex-1 md:block">
            <Skeleton className="mx-auto h-9 w-full max-w-[440px]" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Skeleton className="h-[38px] w-[38px] rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-full" />
          </div>
        </header>

        <main className="flex-1 px-6 py-10 lg:px-10 lg:pb-16 lg:pt-10">
          <div className="mx-auto w-full max-w-[1200px]">
            <div className="mb-8">
              <Skeleton className="mb-2 h-3 w-24" />
              <Skeleton className="mb-3 h-9 w-56" />
              <Skeleton className="h-4 w-[480px] max-w-full" />
            </div>
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-[var(--vv-border)] bg-white p-5">
                  <Skeleton className="mb-2.5 h-3 w-28" />
                  <Skeleton className="mb-2 h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
          </div>
        </main>
      </div>

      {showForceSignOut && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <button
            onClick={handleForceReset}
            className="flex items-center gap-2 rounded-full border border-[var(--vv-border)] bg-white px-4 py-2 text-xs font-medium text-[var(--status-missing)] shadow-lg transition-colors hover:bg-red-50"
          >
            Taking too long? Force Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

const formatSegment = (s: string) => {
  const decoded = decodeURIComponent(s);
  if (/^[A-Za-z0-9_-]{8,}$/.test(decoded) && /[0-9]/.test(decoded)) return decoded;
  return decoded.charAt(0).toUpperCase() + decoded.slice(1).replace(/-/g, " ");
};

function deriveCrumbs(pathname: string): string[] | undefined {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return undefined;

  // Drop the role-prefix segment for admin routes — the shell already shows "Admin · VAA"
  const trail = segments[0] === "admin" ? segments.slice(1) : segments;
  if (trail.length === 0) return undefined;

  return trail.map(formatSegment);
}

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
    } else if (!user.emailVerified) {
      router.push("/verify-email");
    }
  }, [user, loading, router]);

  if (loading || !user || !user.emailVerified) {
    return <AppShellSkeleton />;
  }

  return <VvAppShell crumbs={deriveCrumbs(pathname)}>{children}</VvAppShell>;
}
