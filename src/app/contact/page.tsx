"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { VvButton } from "@/components/vv/VvButton";
import { VvInput } from "@/components/vv/VvInput";
import { PageTransition } from "@/components/PageTransition";

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

interface ContactEntry {
  label: string;
  value: string;
}

const CONTACTS: ContactEntry[] = [
  { label: "General inquiries", value: "hello@vanvert.co" },
  { label: "Security issues", value: "security@vanvert.co" },
  { label: "Privacy & data", value: "privacy@vanvert.co" },
  { label: "Academy partnerships", value: "partnerships@vanvert.co" },
];

function Logo({ light = false }: { light?: boolean }) {
  return (
    <span
      className="font-outfit text-[22px] font-bold"
      style={{ letterSpacing: "-0.02em" }}
    >
      <span style={{ color: light ? "white" : "var(--navy)" }}>Van-</span>
      <span style={{ color: "var(--sky)" }}>Vert</span>
    </span>
  );
}

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/vanguard_aviation/", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg> },
  { label: "WhatsApp", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20.4 3.6A9.9 9.9 0 0 0 4.9 19.1L3.7 20.9l1.9-1.1a9.8 9.8 0 0 0 14.8-16.2Z"/><path d="M14.8 13.4c-.3-.1-.6-.2-.9-.4-.3-.2-.5-.5-.6-.8-.1-.3 0-.7.2-1 .2-.3.5-.5.9-.6.3-.1.7-.1 1 .1.3.2.5.5.6.8.1.3.1.6 0 .9-.1.3-.3.5-.6.7-.2.1-.5.2-.7.3-.2.1-.4.2-.5.5-.1.3-.1.6 0 .9"/></svg> },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/vanguardaviation/", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> },
];

export default function ContactPage() {
  const [sent, setSent] = React.useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <PageTransition>
    <div className="flex min-h-screen flex-col bg-white">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 flex h-[68px] items-center justify-between px-8"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Link href="/">
          <Logo />
        </Link>
        <nav
          className="hidden items-center gap-7 text-sm font-medium md:flex"
          style={{ color: "var(--text-secondary)" }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="transition-colors hover:text-navy"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium transition-colors hover:text-navy"
            style={{ color: "var(--text-secondary)" }}
          >
            Sign in
          </Link>
          <Link href="/register">
            <VvButton size="sm">Get started</VvButton>
          </Link>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <section
          style={{
            background: "var(--navy)",
            color: "white",
            paddingTop: 72,
            paddingBottom: 56,
          }}
        >
          <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 32px" }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: "rgba(255,255,255,0.6)",
                fontSize: 13,
                marginBottom: 28,
              }}
            >
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
            <div className="vv-label" style={{ color: "var(--sky-bright)" }}>
              Get in touch
            </div>
            <h1
              style={{
                fontFamily: "Outfit",
                fontWeight: 700,
                fontSize: "clamp(40px, 5vw, 60px)",
                color: "white",
                marginTop: 12,
                letterSpacing: "-0.025em",
                lineHeight: 1.05,
              }}
            >
              Contact
            </h1>
            <p
              style={{
                marginTop: 16,
                fontSize: 16,
                color: "rgba(255,255,255,0.6)",
                maxWidth: 520,
              }}
            >
              Questions about your conversion, the platform, or partnership?
              We&apos;re here.
            </p>
          </div>
        </section>

        {/* ── Body ───────────────────────────────────────────────────────────── */}
        <section style={{ paddingTop: 64, paddingBottom: 120 }}>
          <div
            className="grid grid-cols-1 lg:grid-cols-[1fr_380px]"
            style={{ maxWidth: 1080, margin: "0 auto", padding: "0 32px", gap: 64 }}
          >
            {/* Form */}
            <div>
              <h2 className="vv-h2" style={{ fontSize: 24, marginBottom: 8 }}>
                Send us a message
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  marginBottom: 32,
                }}
              >
                We respond to all inquiries within one business day.
              </p>

              {sent ? (
                <div
                  className="vv-card"
                  style={{ padding: 48, textAlign: "center" }}
                >
                  <h3 className="vv-h2" style={{ fontSize: 22 }}>
                    Message sent
                  </h3>
                  <p
                    style={{
                      marginTop: 10,
                      fontSize: 14,
                      color: "var(--text-secondary)",
                      maxWidth: 340,
                      margin: "10px auto 0",
                    }}
                  >
                    Thank you for reaching out. A member of our team will respond
                    within one business day.
                  </p>
                  <VvButton
                    variant="outline"
                    style={{ marginTop: 24 }}
                    onClick={() => setSent(false)}
                  >
                    Send another message
                  </VvButton>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-5"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <VvInput
                      label="Full name"
                      placeholder="Captain Ana Pereira"
                      required
                    />
                    <VvInput
                      label="Email"
                      type="email"
                      placeholder="pilot@vanvert.co"
                      required
                    />
                  </div>

                  <VvInput
                    label="Subject"
                    placeholder="License conversion inquiry"
                    required
                  />

                  <div className="vv-input-group flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">
                      Message
                    </label>
                    <textarea
                      required
                      placeholder="Tell us how we can help…"
                      className="min-h-[160px] w-full resize-y rounded-lg border-[1.5px] border-[var(--vv-border)] bg-white px-4 py-3.5 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--sky)] focus:shadow-[0_0_0_4px_rgba(0,120,165,0.08)]"
                    />
                  </div>

                  <VvButton
                    type="submit"
                    size="lg"
                    className="self-start"
                  >
                    Send message <ArrowRight className="h-4 w-4" />
                  </VvButton>
                </form>
              )}
            </div>

            {/* Sidebar */}
            <aside className="flex flex-col gap-5">
              {CONTACTS.map((c) => (
                <div
                  key={c.label}
                  className="vv-card"
                  style={{
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--navy)",
                    }}
                  >
                    {c.label}
                  </div>
                  <a
                    href={`mailto:${c.value}`}
                    style={{ fontSize: 14, color: "var(--sky)" }}
                  >
                    {c.value}
                  </a>
                </div>
              ))}

              <div
                className="vv-card"
                style={{ padding: 24, background: "var(--sky-mist)" }}
              >
                <div className="vv-label" style={{ marginBottom: 10 }}>
                  Office
                </div>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--text-primary)",
                    lineHeight: 1.5,
                    fontWeight: 500,
                  }}
                >
                  Vanguard Aviation Academy
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                    marginTop: 4,
                  }}
                >
                  Rua do Aeroporto 1<br />
                  1700-008 Lisbon<br />
                  Portugal
                </p>
              </div>

              <div className="vv-card" style={{ padding: 20 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--navy)",
                  }}
                >
                  WhatsApp support
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    marginTop: 4,
                  }}
                >
                  Available Mon–Fri, 09:00–18:00 CET
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────────── */}
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
