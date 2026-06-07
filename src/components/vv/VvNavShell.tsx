"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Menu, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export interface VvNavLink {
  href: string;
  label: string;
  icon: React.ElementType;
}

export interface VvNavShellProps {
  navLinks: VvNavLink[];
  secondaryLinks?: VvNavLink[];
  activeHref: string;
  breadcrumbs?: React.ReactNode;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}

function VvNavLinkItem({ link, active }: { link: VvNavLink; active: boolean }) {
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center gap-3 rounded-r-lg border-l-2 border-transparent px-3 py-2.5 text-sm text-white/60 transition-colors",
        active
          ? "border-l-[var(--sky-bright)] bg-[var(--sky-pale)]/15 text-white"
          : "hover:bg-[var(--sky-pale)]/10 hover:text-white"
      )}
    >
      <Icon className="h-[18px] w-[18px]" />
      {link.label}
    </Link>
  );
}

function VvSidebarContent({
  navLinks,
  secondaryLinks,
  activeHref,
}: Pick<VvNavShellProps, "navLinks" | "secondaryLinks" | "activeHref">) {
  return (
    <div className="flex h-full w-60 flex-col bg-[var(--navy)] px-4 py-6">
      <div className="px-3 pb-8 font-outfit text-xl font-bold tracking-tight">
        <span className="text-white">Van-</span>
        <span className="text-[var(--sky-bright)]">Vert</span>
      </div>
      <nav className="flex flex-col gap-1">
        {navLinks.map((link) => (
          <VvNavLinkItem key={link.href} link={link} active={link.href === activeHref} />
        ))}
      </nav>
      {secondaryLinks && secondaryLinks.length > 0 && (
        <nav className="mt-auto flex flex-col gap-1 pt-6">
          {secondaryLinks.map((link) => (
            <VvNavLinkItem key={link.href} link={link} active={link.href === activeHref} />
          ))}
        </nav>
      )}
    </div>
  );
}

export function VvNavShell({
  navLinks,
  secondaryLinks,
  activeHref,
  breadcrumbs,
  rightSlot,
  children,
}: VvNavShellProps) {
  return (
    <div className="flex min-h-screen w-full bg-[var(--sky-mist)]">
      <aside className="fixed inset-y-0 left-0 hidden lg:flex">
        <VvSidebarContent navLinks={navLinks} secondaryLinks={secondaryLinks} activeHref={activeHref} />
      </aside>

      <div className="flex w-full flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-[var(--vv-border)] bg-white px-6">
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface)] lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 border-none bg-[var(--navy)] p-0">
              <VvSidebarContent navLinks={navLinks} secondaryLinks={secondaryLinks} activeHref={activeHref} />
            </SheetContent>
          </Sheet>

          {breadcrumbs && (
            <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">{breadcrumbs}</div>
          )}

          <div className="relative mx-auto hidden max-w-md flex-1 md:block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="search"
              placeholder="Search..."
              className="w-full rounded-lg border-[1.5px] border-[var(--vv-border)] bg-[var(--surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--sky)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,120,165,0.08)]"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--sky)]">
              <Bell className="h-[18px] w-[18px]" />
              <span className="sr-only">Notifications</span>
            </button>
            {rightSlot}
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
