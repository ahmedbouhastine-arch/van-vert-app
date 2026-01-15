"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { users } from "@/lib/data";

// In a real app, you'd get this from an auth context
const currentUser = users.find(u => u.id === 'user1'); // Mock: assuming user1 is logged in
const isAdmin = currentUser?.role === 'admin';

const mainLinks = [
  { href: "/dashboard", icon: Home, label: "Dashboard", for: "all" },
  { href: "/applications", icon: FileText, label: "Applications", for: "applicant" },
  { href: "/admin", icon: Users, label: "Admin", for: "admin" },
];

const secondaryLinks = [
    { href: "/settings", icon: Settings, label: "Settings", for: "all" },
]

function createLinks(links: {href: string, icon: React.ElementType, label: string, for: string}[]) {
    const pathname = usePathname();

    const filteredLinks = links.filter(link => {
        if (link.for === 'all') return true;
        if (isAdmin) return link.for === 'admin';
        return link.for === 'applicant';
    })

    return filteredLinks.map(({ href, icon: Icon, label }) => {
        // Handle nested routes for highlighting
        const isActive =
          href === "/dashboard"
            ? pathname === href
            : pathname.startsWith(href);

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

export function NavLinks() {
  return <>{createLinks(mainLinks)}</>;
}

export function SettingsLink() {
    return <>{createLinks(secondaryLinks)}</>;
}
