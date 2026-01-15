"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/applications", icon: FileText, label: "Applications" },
  { href: "/admin", icon: Users, label: "Admin" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map(({ href, icon: Icon, label }) => {
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
      })}
    </>
  );
}
