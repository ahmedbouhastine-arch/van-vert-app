
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Users, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";

type NavLinkItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  for: "applicant" | "admin" | "all";
};

const mainLinks: NavLinkItem[] = [
  { href: "/dashboard", icon: Home, label: "Dashboard", for: "applicant" },
  { href: "/applications", icon: FileText, label: "Applications", for: "applicant" },
  { href: "/admin", icon: Users, label: "Admin", for: "admin" },
];

const secondaryLinks: NavLinkItem[] = [
  { href: "/profile", icon: User, label: "Profile", for: "all" },
  { href: "/settings", icon: Settings, label: "Settings", for: "all" },
];

const createLinks = (links: NavLinkItem[], isAdmin: boolean, isMobile: boolean = false) => {
    const pathname = usePathname();

    const filteredLinks = links.filter(link => {
        if (link.for === 'all') return true;
        if (isAdmin) return link.for === 'admin';
        return link.for === 'applicant';
    });

    return filteredLinks.map(({ href, icon: Icon, label }) => {
        const isActive = href === "/" ? pathname === href : pathname.startsWith(href);
        
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

export function MainNavLinks({ isAdmin }: { isAdmin: boolean }) {
  return <>{createLinks(mainLinks, isAdmin)}</>;
}

export function SecondaryNavLinks({ isAdmin }: { isAdmin: boolean }) {
    return <>{createLinks(secondaryLinks, isAdmin)}</>;
}

export function MobileNavLinks({ isAdmin }: { isAdmin: boolean }) {
    const allLinks = [...mainLinks, ...secondaryLinks];
    return <>{createLinks(allLinks, isAdmin, true)}</>
}
