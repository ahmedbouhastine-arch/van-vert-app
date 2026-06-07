import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

const footerColumns = [
  {
    title: "Platform",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
      { label: "Sign In", href: "/login" },
    ],
  },
  {
    title: "Authority",
    links: [
      { label: "About VAA", href: "#" },
      { label: "Compliance", href: "#" },
      { label: "Security", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
];

function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="font-outfit text-2xl font-bold tracking-tight">
      <span className={light ? "text-white" : "text-navy"}>Van-</span>
      <span className="text-sky">Vert</span>
    </span>
  );
}

export interface VvLegalShellProps {
  activeHref: "/privacy" | "/terms";
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export interface VvLegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

export function VvLegalContent({ sections }: { sections: VvLegalSection[] }) {
  return (
    <div className="grid gap-12 md:grid-cols-[220px_1fr]">
      <nav className="hidden md:block">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">Contents</p>
        <ul className="mt-4 flex flex-col gap-1">
          {sections.map((section, idx) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={
                  idx === 0
                    ? "block rounded-md border-l-2 border-sky bg-sky-pale px-3 py-2 text-sm font-semibold text-sky"
                    : "block rounded-md border-l-2 border-transparent px-3 py-2 text-sm text-text-secondary transition-colors hover:text-navy"
                }
              >
                <span className="mr-2 text-xs text-text-muted">{String(idx + 1).padStart(2, "0")}</span>
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex flex-col gap-12">
        {sections.map((section, idx) => (
          <div key={section.id} id={section.id} className="scroll-mt-24">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
              Section {String(idx + 1).padStart(2, "0")}
            </p>
            <h2 className="mt-2 font-outfit text-2xl font-bold tracking-tight text-navy">{section.title}</h2>
            <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-text-secondary">{section.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VvLegalShell({ activeHref, title, lastUpdated, children }: VvLegalShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-vv-border bg-white/90 px-6 backdrop-blur md:px-10">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={
                link.href === activeHref
                  ? "rounded-md bg-sky-pale px-2.5 py-1 text-sky"
                  : "text-text-secondary transition-colors hover:text-navy"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-text-secondary transition-colors hover:text-navy">
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-navy px-[22px] py-3 text-sm font-medium text-white transition-colors hover:bg-navy-deep"
          >
            Get started
          </Link>
        </div>
      </header>

      <section className="bg-navy px-6 pb-16 pt-12 text-white md:px-10">
        <div className="mx-auto max-w-5xl">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-sky-pale/50">Legal</p>
          <h1 className="mt-2 font-outfit text-5xl font-bold tracking-tight">{title}</h1>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-sky-pale/50">
            Last updated · {lastUpdated}
          </p>
        </div>
      </section>

      <main className="flex-1 px-6 py-16 md:px-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>

      <footer className="bg-navy-deep px-6 pb-8 pt-16 text-white md:px-10">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-sky-pale/50">
              The digital home for pilot license conversion. Built by aviators, for aviators.
            </p>
          </div>
          {footerColumns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-pale/40">{col.title}</p>
              <ul className="mt-4 flex flex-col gap-2.5 text-sm text-sky-pale/60">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-16 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-sky-pale/40 md:flex-row">
          <p>&copy; {new Date().getFullYear()} Vanguard Aviation Academy. All rights reserved.</p>
          <p className="uppercase tracking-[0.2em]">Where excellence takes flight</p>
        </div>
      </footer>
    </div>
  );
}
