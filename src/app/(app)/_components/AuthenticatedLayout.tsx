"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

import { useUser } from "@/firebase";
import { LoadingScreen } from "@/components/LoadingScreen";
import { VvAppShell } from "@/components/vv/VvAppShell";

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
    return <LoadingScreen text="Authenticating..." />;
  }

  return <VvAppShell crumbs={deriveCrumbs(pathname)}>{children}</VvAppShell>;
}
