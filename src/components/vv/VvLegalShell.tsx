"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/vanguard_aviation/", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg> },
  { label: "WhatsApp", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20.4 3.6A9.9 9.9 0 0 0 4.9 19.1L3.7 20.9l1.9-1.1a9.8 9.8 0 0 0 14.8-16.2Z"/><path d="M14.8 13.4c-.3-.1-.6-.2-.9-.4-.3-.2-.5-.5-.6-.8-.1-.3 0-.7.2-1 .2-.3.5-.5.9-.6.3-.1.7-.1 1 .1.3.2.5.5.6.8.1.3.1.6 0 .9-.1.3-.3.5-.6.7-.2.1-.5.2-.7.3-.2.1-.4.2-.5.5-.1.3-.1.6 0 .9"/></svg> },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/vanguardaviation/", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> },
];

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
      { label: "About VAA", href: "/about" },
      { label: "Compliance", href: "/compliance" },
      { label: "Security", href: "/security" },
      { label: "Status", href: "/status" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Contact", href: "/contact" },
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
  activeHref: "/privacy" | "/terms" | "/security" | "/cookies" | "/compliance";
  title: string;
  lastUpdated: string;
  kicker?: string;
  children: React.ReactNode;
}

export interface VvLegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

export function VvLegalContent({ sections }: { sections: VvLegalSection[] }) {
  const [activeId, setActiveId] = React.useState(sections[0]?.id);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-96px 0px -65% 0px", threshold: 0 }
    );

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="grid gap-12 md:grid-cols-[260px_1fr]">
      <nav className="hidden md:block">
        <div className="sticky top-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">Contents</p>
          <ul className="mt-4 flex flex-col gap-1">
            {sections.map((section, idx) => {
              const isActive = activeId === section.id;
              return (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className={
                      isActive
                        ? "block rounded-md border-l-2 border-sky bg-sky-pale px-3 py-2 text-sm font-semibold text-sky transition-colors duration-200"
                        : "block rounded-md border-l-2 border-transparent px-3 py-2 text-sm text-text-secondary transition-colors duration-200 hover:text-navy"
                    }
                  >
                    <span className="mr-2 text-xs text-text-muted">{String(idx + 1).padStart(2, "0")}</span>
                    {section.title}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <div className="flex flex-col gap-14">
        {sections.map((section, idx) => (
          <div key={section.id} id={section.id} className="scroll-mt-24">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
              Section {String(idx + 1).padStart(2, "0")}
            </p>
            <h2 className="mt-2 font-outfit text-[28px] font-bold tracking-tight text-navy">{section.title}</h2>
            <div className="mt-4 flex flex-col gap-3.5 text-[15px] leading-[1.7] text-text-secondary">{section.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VvLegalShell({ activeHref, title, lastUpdated, kicker = "Legal", children }: VvLegalShellProps) {
  return (
    <PageTransition>
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
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-sky-pale/50">{kicker}</p>
          <h1 className="mt-2 font-outfit text-5xl font-bold tracking-tight">{title}</h1>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-sky-pale/50">
            Last updated · {lastUpdated}
          </p>
        </div>
      </section>

      <main className="flex-1 px-6 py-16 md:px-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>

      <footer className="px-8 pb-8 pt-16" style={{ background: "var(--navy)", color: "rgba(255,255,255,0.7)" }}>
        <div
          className="mx-auto grid max-w-[1200px] gap-12 pb-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
        >
          <div>
            <Logo light />
            <p
              className="mt-2 text-[14px] leading-[1.5]"
              style={{ color: "rgba(255,255,255,0.5)", maxWidth: 260 }}
            >
              The digital home for pilot license<br />conversion. Built by aviators, for aviators.
            </p>
            {/* Social icons */}
            <div className="mt-6 flex gap-4">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href ?? "#"}
                  {...(s.href ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg transition-all"
                  style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
          {footerColumns.map((col) => (
            <div key={col.title}>
              <p
                className="text-[11px] font-semibold uppercase tracking-[3px]"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                {col.title}
              </p>
              <ul
                className="mt-4 flex flex-col gap-2.5 text-[13px]"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
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
        <div
          className="mx-auto mt-0 flex max-w-[1200px] flex-col items-center justify-between gap-3 pt-6 text-xs md:flex-row"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          <p>&copy; {new Date().getFullYear()} Vanguard Aviation Academy. All rights reserved.</p>
          <p className="uppercase tracking-[3px]">Where excellence takes flight</p>
        </div>
      </footer>
    </div>
    </PageTransition>
  );
}
