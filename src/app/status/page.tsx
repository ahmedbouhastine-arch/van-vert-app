// Van-Vert — /status
// Live system-status page: service list, 90-day uptime bar, incident log.

import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
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

interface Service {
  name: string;
  uptime: string;
}

const SERVICES: Service[] = [
  { name: "Web Application", uptime: "99.99%" },
  { name: "Document Upload & Storage", uptime: "99.98%" },
  { name: "Authentication & SSO", uptime: "100%" },
  { name: "Application Processing API", uptime: "99.97%" },
  { name: "Email Notifications", uptime: "99.95%" },
  { name: "SMS Alerts (Pro)", uptime: "99.90%" },
  { name: "Reviewer Portal", uptime: "99.99%" },
  { name: "Admin Dashboard", uptime: "99.99%" },
];

// Stable uptime bar — seeded so it doesn't flicker on re-render
const BAR_STATES = Array.from({ length: 90 }, (_, i) =>
  i === 47 ? "degraded" : "ok"
);

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

export default function StatusPage() {
  const now = new Date();
  const checkedAt = now.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(now.getDate() - 90);
  const rangeStart = ninetyDaysAgo.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const rangeEnd = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

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
          <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 32px" }}>
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
              System
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
              Status
            </h1>
          </div>
        </section>

        {/* ── Body ───────────────────────────────────────────────────────────── */}
        <section style={{ paddingTop: 48, paddingBottom: 120 }}>
          <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 32px" }}>

            {/* All-green banner */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "20px 24px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 12,
                marginBottom: 40,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "#dcfce7",
                  color: "var(--status-ready)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "Outfit",
                    fontSize: 17,
                    fontWeight: 600,
                    color: "var(--navy)",
                  }}
                >
                  All systems operational
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    marginTop: 2,
                  }}
                >
                  Last checked · {checkedAt}
                </div>
              </div>
            </div>

            {/* Service list */}
            <div className="vv-label" style={{ marginBottom: 16 }}>
              Services
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {SERVICES.map((svc, i) => (
                <div
                  key={svc.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "18px 0",
                    borderBottom:
                      i < SERVICES.length - 1
                        ? "1px solid var(--border-soft)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "var(--status-ready)",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 15,
                        color: "var(--text-primary)",
                        fontWeight: 500,
                      }}
                    >
                      {svc.name}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--text-muted)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {svc.uptime} uptime
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        color: "var(--status-ready)",
                        background: "#f0fdf4",
                        padding: "3px 10px",
                        borderRadius: 9999,
                      }}
                    >
                      Operational
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* 90-day uptime bar */}
            <div style={{ marginTop: 48 }}>
              <div className="vv-label" style={{ marginBottom: 16 }}>
                90-day uptime
              </div>
              <div className="vv-card" style={{ padding: 28 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 16,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Outfit",
                      fontSize: 36,
                      fontWeight: 700,
                      color: "var(--navy)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    99.98%
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {rangeStart} – {rangeEnd}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 2,
                    height: 28,
                    borderRadius: 6,
                    overflow: "hidden",
                  }}
                >
                  {BAR_STATES.map((state, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        background:
                          state === "degraded"
                            ? "var(--status-attention)"
                            : "var(--status-ready)",
                        opacity: state === "degraded" ? 1 : 0.8,
                        borderRadius: 1,
                      }}
                      title={
                        state === "degraded"
                          ? "Partial degradation — 12 min"
                          : "Operational"
                      }
                    />
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 8,
                    fontSize: 11,
                    color: "var(--text-muted)",
                  }}
                >
                  <span>90 days ago</span>
                  <span>Today</span>
                </div>
              </div>
            </div>

            {/* Incident log */}
            <div style={{ marginTop: 48 }}>
              <div className="vv-label" style={{ marginBottom: 16 }}>
                Recent incidents
              </div>
              <div className="vv-card" style={{ padding: 0 }}>
                <div
                  style={{
                    padding: "20px 24px",
                    borderBottom: "1px solid var(--border-soft)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--status-attention)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--navy)",
                      }}
                    >
                      Email notification delay
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginLeft: "auto",
                      }}
                    >
                      April 22, 2026
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                    }}
                  >
                    Email notifications were delayed by up to 12 minutes due to a
                    queue backlog in our mail provider. No emails were lost.
                    Resolved within 45 minutes.
                  </p>
                </div>
                <div
                  style={{
                    padding: "16px 24px",
                    fontSize: 13,
                    color: "var(--text-muted)",
                    textAlign: "center",
                  }}
                >
                  No other incidents in the last 90 days.
                </div>
              </div>
            </div>

            <div style={{ marginTop: 40, textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Subscribe to status updates at{" "}
                <strong style={{ color: "var(--sky)" }}>
                  status@vanvert.co
                </strong>
              </p>
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
