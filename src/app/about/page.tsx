// Van-Vert — /about
// About Vanguard Aviation Academy: mission, stats, values, HQ.

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { VvButton } from "@/components/vv/VvButton";
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

const STATS = [
  { metric: "500+", label: "Pilots converted" },
  { metric: "42", label: "Avg. days to issue" },
  { metric: "6", label: "Authority pairs" },
  { metric: "99.9%", label: "Platform uptime" },
] as const;

const VALUES = [
  {
    title: "Pilot-first trust",
    body: "Your documents are yours. We encrypt everything, share with the authority and your case officer only, and never train models on your data.",
  },
  {
    title: "No wasted time",
    body: "Every feature exists to shorten the conversion timeline. If it doesn't help you fly sooner, it doesn't ship.",
  },
  {
    title: "Authority expertise",
    body: "We maintain direct relationships with each issuing authority so we know exactly what they need — before you upload the wrong format.",
  },
] as const;

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
  { label: "Instagram", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg> },
  { label: "WhatsApp", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20.4 3.6A9.9 9.9 0 0 0 4.9 19.1L3.7 20.9l1.9-1.1a9.8 9.8 0 0 0 14.8-16.2Z"/><path d="M14.8 13.4c-.3-.1-.6-.2-.9-.4-.3-.2-.5-.5-.6-.8-.1-.3 0-.7.2-1 .2-.3.5-.5.9-.6.3-.1.7-.1 1 .1.3.2.5.5.6.8.1.3.1.6 0 .9-.1.3-.3.5-.6.7-.2.1-.5.2-.7.3-.2.1-.4.2-.5.5-.1.3-.1.6 0 .9"/></svg> },
  { label: "LinkedIn", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> },
];

export default function AboutPage() {
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

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <section
          style={{
            background: "var(--navy)",
            color: "white",
            paddingTop: 72,
            paddingBottom: 80,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* decorative rings */}
          <svg
            aria-hidden="true"
            style={{
              position: "absolute",
              top: -80,
              right: -120,
              opacity: 0.06,
              pointerEvents: "none",
            }}
            width="500"
            height="500"
            viewBox="0 0 500 500"
          >
            {([220, 170, 120, 70] as const).map((r) => (
              <circle
                key={r}
                cx="250"
                cy="250"
                r={r}
                fill="none"
                stroke="white"
                strokeWidth="1"
              />
            ))}
          </svg>

          <div
            style={{
              maxWidth: 1080,
              margin: "0 auto",
              padding: "0 32px",
              position: "relative",
            }}
          >
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
              About us
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
                maxWidth: 700,
              }}
            >
              Vanguard Aviation Academy
            </h1>
            <p
              style={{
                marginTop: 20,
                fontSize: 18,
                color: "rgba(255,255,255,0.65)",
                maxWidth: 600,
                lineHeight: 1.6,
              }}
            >
              We built Van-Vert because we&apos;ve lived the problem. Licensed
              aviators who spent months converting paperwork instead of
              flying.
            </p>
          </div>
        </section>

        {/* ── Mission + stats ───────────────────────────────────────────────── */}
        <section style={{ paddingTop: 80, paddingBottom: 80 }}>
          <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 32px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 64,
                alignItems: "start",
              }}
            >
              <div>
                <div className="vv-label">Our mission</div>
                <h2 className="vv-h1" style={{ fontSize: 32, marginTop: 12 }}>
                  Make license conversion as routine as a pre-flight check.
                </h2>
                <p
                  style={{
                    marginTop: 20,
                    fontSize: 15,
                    lineHeight: 1.7,
                    color: "var(--text-secondary)",
                  }}
                >
                  Vanguard Aviation Academy was founded by flight instructors
                  and airline pilots who saw firsthand how broken
                  cross-border license conversion is. Pilots with thousands
                  of hours spend six months chasing stamps, translations and
                  email threads — just to keep flying.
                </p>
                <p
                  style={{
                    marginTop: 14,
                    fontSize: 15,
                    lineHeight: 1.7,
                    color: "var(--text-secondary)",
                  }}
                >
                  Van-Vert is the platform we wished existed. A single
                  timeline, a single document hub, and a direct line to the
                  reviewing authority. No guesswork.
                </p>
              </div>

              {/* Stat cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                {STATS.map((s) => (
                  <div
                    key={s.label}
                    className="vv-card"
                    style={{ padding: 24, textAlign: "center" }}
                  >
                    <div
                      style={{
                        fontFamily: "Outfit",
                        fontSize: 32,
                        fontWeight: 700,
                        color: "var(--navy)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {s.metric}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        marginTop: 4,
                        fontWeight: 500,
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Values ─────────────────────────────────────────────────────────── */}
        <section
          style={{
            background: "var(--sky-mist)",
            paddingTop: 80,
            paddingBottom: 80,
          }}
        >
          <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 32px" }}>
            <div className="vv-label" style={{ textAlign: "center" }}>
              What we stand for
            </div>
            <h2
              className="vv-h1"
              style={{ fontSize: 32, marginTop: 12, textAlign: "center" }}
            >
              Built around three principles.
            </h2>
            <div
              style={{
                marginTop: 48,
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 20,
              }}
            >
              {VALUES.map((v) => (
                <div key={v.title} className="vv-card" style={{ padding: 32 }}>
                  <h3
                    className="vv-h3"
                    style={{ fontSize: 18, color: "var(--navy)" }}
                  >
                    {v.title}
                  </h3>
                  <p
                    style={{
                      marginTop: 10,
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {v.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HQ + CTA ───────────────────────────────────────────────────────── */}
        <section style={{ paddingTop: 80, paddingBottom: 80 }}>
          <div
            style={{
              maxWidth: 1080,
              margin: "0 auto",
              padding: "0 32px",
              textAlign: "center",
            }}
          >
            <div className="vv-label">Headquarters</div>
            <h2 className="vv-h1" style={{ fontSize: 28, marginTop: 12 }}>
              Lisbon, Portugal
            </h2>
            <p
              style={{
                marginTop: 12,
                fontSize: 15,
                color: "var(--text-secondary)",
                maxWidth: 520,
                margin: "12px auto 0",
              }}
            >
              Vanguard Aviation Academy · Rua do Aeroporto 1 · 1700-008
              Lisbon · Portugal
            </p>
            <div
              style={{
                marginTop: 32,
                display: "flex",
                gap: 12,
                justifyContent: "center",
              }}
            >
              <a href="mailto:hello@vanvert.co" className="vv-btn vv-btn-navy">
                Get in touch <ArrowRight className="h-4 w-4" />
              </a>
              <Link href="/" className="vv-btn vv-btn-outline">
                See the platform
              </Link>
            </div>
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
                  href="#"
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
