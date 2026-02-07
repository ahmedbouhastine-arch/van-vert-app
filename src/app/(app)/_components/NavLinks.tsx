
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Settings, User, UserCog, LayoutDashboard, LineChart, History } from "lucide-react";
import { cn } from "@/lib/utils";

type NavLinkItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  for: "applicant" | "reviewer" | "admin" | "head-admin" | "all";
};

const mainLinks: NavLinkItem[] = [
  { href: "/dashboard", icon: Home, label: "Dashboard", for: "applicant" },
  { href: "/applications", icon: FileText, label: "Applications", for: "applicant" },
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", for: "reviewer" },
  { href: "/admin/applications", icon: FileText, label: "Applications", for: "reviewer" },
  { href: "/admin/analytics", icon: LineChart, label: "Analytics", for: "admin" },
  { href: "/admin/users", icon: UserCog, label: "User Management", for: "head-admin" },
  { href: "/admin/audit-log", icon: History, label: "Audit Log", for: "head-admin" },
];

const secondaryLinks: NavLinkItem[] = [
  { href: "/profile", icon: User, label: "Profile", for: "all" },
  { href: "/settings", icon: Settings, label: "Settings", for: "all" },
];

const createLinks = (links: NavLinkItem[], claims: any, isMobile: boolean = false) => {
    const pathname = usePathname();
    const role = claims?.role;

    const filteredLinks = links.filter(link => {
        if (link.for === 'all') return true;
        if (link.for === 'applicant' && role === 'user') return true;
        if (link.for === 'reviewer' && (role === 'reviewer' || role === 'admin' || role === 'head-admin')) return true;
        if (link.for === 'admin' && (role === 'admin' || role === 'head-admin')) return true;
        if (link.for === 'head-admin' && role === 'head-admin') return true;
        return false;
    });

    return filteredLinks.map(({ href, icon: Icon, label }) => {
        const isActive = (href === "/admin" || href === "/dashboard")
            ? pathname === href 
            : (href === "/" ? pathname === href : pathname.startsWith(href));
        
        if (isMobile) {
            return (
                <Link
                    key={href}
                    href={href}
                    className={cn(
                        "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
                        isActive && "text-foreground"
                    )}
                >
                    <Icon className="h-5 w-5" />
                    {label}
                </Link>
            )
        }

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:text-foreground md:h-8 md:w-8",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="sr-only">{label}</span>
          </Link>
        );
      });
}

export function MainNavLinks({ claims }: { claims: any }) {
  return <>{createLinks(mainLinks, claims)}</>;
}

export function SecondaryNavLinks({ claims }: { claims: any }) {
    return <>{createLinks(secondaryLinks, claims)}</>;
}

export function MobileNavLinks({ claims }: { claims: any }) {
    const allLinks = [...mainLinks, ...secondaryLinks];
    return <>{createLinks(allLinks, claims, true)}</>
}
