'use client';
export const dynamic = 'force-dynamic';

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Activity,
  MessageSquare,
  Plus,
  Minus,
  Shield,
  Quote,
  Check,
} from "lucide-react";
import { VvButton } from "@/components/vv/VvButton";
import { VvCard } from "@/components/vv/VvCard";
import { PageTransition } from "@/components/PageTransition";

// ─── Data (unchanged) ─────────────────────────────────────────────────────────

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

const features = [
  {
    icon: FileText,
    title: "Centralized documents",
    description:
      "Upload, version and label every document once. ID, medical, logbook, translations — one secure hub indexed by the authority you're converting to.",
    tags: ["8 doc types", "OCR-ready", "Auto-translation"],
  },
  {
    icon: Activity,
    title: "Real-time status",
    description:
      "See exactly where your application is at every step. From draft to issued — no more refreshing inboxes or chasing case officers.",
    tags: ["Live timeline", "SMS alerts", "ETA per stage"],
  },
  {
    icon: MessageSquare,
    title: "Direct review",
    description:
      "Reviewers leave inline comments on the exact document field. You fix it once, resubmit, and it's gone — instead of a 4-week email loop.",
    tags: ["Inline comments", "1-tap fixes", "Audit trail"],
  },
];

const testimonials = [
  {
    quote:
      "I converted my FAA ATPL to a GCAA licence while flying full-time. Van-Vert kept the whole pack moving in the background — I just signed things on my phone between sectors.",
    name: "Ana Maria Pereira",
    role: "Captain · A350 · Lisbon → Dubai",
    featured: true,
  },
  {
    quote:
      "The reviewer flagged my medical was missing a page on a Tuesday. By Thursday it was approved. That used to take a month of emails.",
    name: "Karim Idris",
    role: "First Officer · 737NG · Cairo → London",
  },
  {
    quote:
      "I've done three conversions in my career. The first two were nightmares. This one was a timeline.",
    name: "Sarah Whitfield",
    role: "Training Captain · EASA / FAA / TC",
  },
];

const pricingTiers = [
  {
    name: "Solo",
    description: "For the pilot doing a single conversion.",
    price: "€0",
    priceNote: "Free during your conversion",
    features: [
      "1 active application",
      "Document hub & OCR",
      "Live status timeline",
      "Email reviewer feedback",
      "Pay only when issued — €189",
    ],
    cta: "Start free",
    variant: "outline" as const,
    featured: false,
  },
  {
    name: "Pro",
    badge: "MOST PILOTS",
    description: "For pilots juggling more than one rating.",
    price: "€24",
    priceNote: "per month",
    features: [
      "Up to 4 active applications",
      "Translation packs included",
      "SMS status alerts",
      "Priority review queue",
      "Cross-authority document re-use",
    ],
    cta: "Start 14-day trial",
    variant: "sky" as const,
    featured: true,
  },
  {
    name: "Academy",
    description: "For flight schools converting cohorts.",
    price: "Custom",
    priceNote: "Volume pricing",
    features: [
      "Unlimited applications",
      "Multi-pilot dashboard",
      "Bulk document upload",
      "Dedicated case manager",
      "SAML SSO + audit log",
    ],
    cta: "Talk to us",
    variant: "outline" as const,
    featured: false,
  },
];

const faqs = [
  {
    question: "Which license conversions does Van-Vert support?",
    answer:
      "We support PPL, CPL and ATPL conversions across FAA, EASA, UK CAA, Transport Canada, GCAA and DGCA. Type ratings ride along with the main licence. If your authority pair isn't listed yet, we add the next one our pilots ask for — and it's usually fast.",
    open: true,
  },
  {
    question: "How long does a typical conversion take?",
    answer:
      "It depends on the authority pair and the state of your documents. Pilots completing the document checklist in one sitting average 42 days from submission to issued license, versus the 6-month industry baseline.",
  },
  {
    question: "What if my medical or background check expires mid-process?",
    answer:
      "Van-Vert tracks expiry dates on every uploaded document and warns you 30 days before any of them lapse. You can re-upload from your phone without resubmitting the rest of the pack.",
  },
  {
    question: "Are my documents secure?",
    answer:
      "All uploads are encrypted at rest and only shared with the reviewing authority and your assigned case officer. We are SOC 2 Type II audited and never train models on your documents.",
  },
  {
    question: "Can my flight school manage conversions for a whole cohort?",
    answer:
      "Yes — the Academy plan gives you a single dashboard across every pilot in your program, bulk upload, document re-use across applications, and a dedicated case manager.",
  },
  {
    question: "What happens if my application is rejected?",
    answer:
      "Rejection on Van-Vert is rare because reviewers leave inline feedback during the process, not after. If it does happen, we cover the resubmission fee and our team works with you to fix what the authority flagged.",
  },
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

// ─── Shared components ────────────────────────────────────────────────────────

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

function SectionHeader({
  eyebrow,
  title,
  sub,
  align = "center",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  sub?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      style={{
        textAlign: align,
        maxWidth: align === "center" ? 720 : "none",
        margin: align === "center" ? "0 auto" : "0",
      }}
    >
      {eyebrow && (
        <p
          className="text-[11px] font-semibold uppercase tracking-[3px]"
          style={{ color: "var(--sky)" }}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className="font-outfit font-bold"
        style={{
          fontSize: "clamp(32px, 4vw, 48px)",
          marginTop: 12,
          letterSpacing: "-0.02em",
          color: "var(--navy)",
        }}
      >
        {title}
      </h2>
      {sub && (
        <p
          className="mt-4 text-[17px] leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number>(0);

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
          className="relative overflow-hidden text-white"
          style={{ background: "var(--navy)", paddingTop: 72, paddingBottom: 100 }}
        >
          {/* Decorative compass rose */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute"
            style={{ top: -120, right: -160, opacity: 0.08 }}
            width="640"
            height="640"
            viewBox="0 0 640 640"
          >
            {[280, 220, 160, 100].map((r) => (
              <circle key={r} cx="320" cy="320" r={r} fill="none" stroke="white" strokeWidth="1" />
            ))}
            {Array.from({ length: 24 }).map((_, i) => {
              const a = (i / 24) * Math.PI * 2;
              return (
                <line
                  key={i}
                  x1={320 + Math.cos(a) * 290}
                  y1={320 + Math.sin(a) * 290}
                  x2={320 + Math.cos(a) * 310}
                  y2={320 + Math.sin(a) * 310}
                  stroke="white"
                  strokeWidth="1"
                />
              );
            })}
          </svg>

          <div className="relative mx-auto max-w-[1280px] px-8">
            {/* Eyebrow */}
            <div
              className="mb-10 flex items-center gap-3 text-[11px] font-medium uppercase"
              style={{ letterSpacing: "4px", color: "var(--sky-bright)" }}
            >
              <span className="block h-px w-8" style={{ background: "rgba(0,135,165,0.4)" }} />
              Now boarding — Van-Vert v1.0
            </div>

            {/* Headline */}
            <h1
              className="font-outfit font-bold leading-[0.95]"
              style={{
                fontSize: "clamp(56px, 8.2vw, 132px)",
                letterSpacing: "-0.04em",
                maxWidth: 1100,
              }}
            >
              Pilot license
              <br />
              conversion is{" "}
              <span
                style={{
                  color: "var(--sky-bright)",
                  position: "relative",
                  display: "inline-block",
                  paddingBottom: 8,
                }}
              >
                broken.
                <svg
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: 0,
                    width: "100%",
                    height: 10,
                  }}
                  viewBox="0 0 200 10"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 5 Q 50 0, 100 5 T 200 5"
                    stroke="var(--sky-bright)"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </span>
            </h1>

            {/* Two-col: copy + comparison */}
            <div className="mt-14 grid items-start gap-16 md:grid-cols-2">
              {/* Copy + CTAs */}
              <div>
                <p
                  className="text-[20px] leading-[1.55]"
                  style={{ color: "rgba(255,255,255,0.75)", maxWidth: 520, marginBottom: 36 }}
                >
                  We&apos;ve shipped your license file across three time zones, four authorities
                  and one rogue PDF compressor. Then we fixed it.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/register">
                    <VvButton variant="sky" size="lg">
                      Start your conversion <ArrowRight className="h-4 w-4" />
                    </VvButton>
                  </Link>
                  <Link href="/login">
                    <VvButton
                      variant="outline"
                      size="lg"
                      className="border-white/30 text-white hover:bg-white hover:text-navy"
                    >
                      Sign in
                    </VvButton>
                  </Link>
                </div>
              </div>

              {/* Pain vs Fix */}
              <div
                className="grid items-stretch gap-5"
                style={{ gridTemplateColumns: "1fr auto 1fr" }}
              >
                {/* Old way */}
                <div
                  className="rounded-xl p-6"
                  style={{ border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  <p
                    className="mb-4 text-[10px] font-semibold uppercase"
                    style={{ letterSpacing: "3px", color: "rgba(255,255,255,0.4)" }}
                  >
                    The old way
                  </p>
                  <p className="font-outfit font-bold leading-none" style={{ fontSize: 48 }}>
                    184
                    <span
                      className="ml-1.5 text-[22px] font-medium"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      days
                    </span>
                  </p>
                  <ul className="mt-5 flex flex-col gap-2.5">
                    {["Paper checklists", "Email threads", "Lost translations", "No status"].map(
                      (t) => (
                        <li
                          key={t}
                          className="flex items-center gap-2 text-[13px]"
                          style={{ color: "rgba(255,255,255,0.55)" }}
                        >
                          <span
                            className="block h-[5px] w-[5px] shrink-0 rounded-full"
                            style={{ background: "rgba(255,255,255,0.3)" }}
                          />
                          {t}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                {/* Arrow divider */}
                <div
                  className="flex items-center justify-center"
                  style={{ color: "var(--sky-bright)" }}
                >
                  <ArrowRight className="h-7 w-7" />
                </div>

                {/* Van-Vert */}
                <div
                  className="rounded-xl p-6"
                  style={{
                    border: "1px solid var(--sky-bright)",
                    background: "rgba(0,135,165,0.04)",
                  }}
                >
                  <p
                    className="mb-4 text-[10px] font-semibold uppercase"
                    style={{ letterSpacing: "3px", color: "var(--sky-bright)" }}
                  >
                    On Van-Vert
                  </p>
                  <p className="font-outfit font-bold leading-none" style={{ fontSize: 48 }}>
                    42
                    <span
                      className="ml-1.5 text-[22px] font-medium"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      days
                    </span>
                  </p>
                  <ul className="mt-5 flex flex-col gap-2.5">
                    {["One checklist", "Live status", "Auto-translation", "Direct review"].map(
                      (t) => (
                        <li
                          key={t}
                          className="flex items-center gap-2 text-[13px]"
                          style={{ color: "rgba(255,255,255,0.8)" }}
                        >
                          <Check
                            className="h-3 w-3 shrink-0"
                            style={{ color: "var(--sky-bright)" }}
                            strokeWidth={2.5}
                          />
                          {t}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ───────────────────────────────────────────────────────── */}
        <section
          id="features"
          className="px-8"
          style={{
            scrollMarginTop: 68,
            background: "var(--white)",
            paddingTop: "var(--space-section)",
            paddingBottom: "var(--space-section)",
          }}
        >
          <div className="mx-auto max-w-[1200px]">
            <SectionHeader
              eyebrow="The platform"
              title={
                <>
                  Everything between you and your
                  <br />
                  new license. Nothing else.
                </>
              }
              align="left"
            />

            <div className="mt-16 grid gap-5 md:grid-cols-3">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <VvCard
                    key={feature.title}
                    className="relative flex flex-col gap-4 overflow-hidden p-8"
                  >
                    {/* Number marker */}
                    <span
                      className="absolute right-6 top-5 font-outfit text-sm font-semibold"
                      style={{
                        color: "var(--text-muted)",
                        opacity: 0.5,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      0{i + 1}
                    </span>

                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-[10px]"
                      style={{ background: "var(--sky-pale)", color: "var(--sky)" }}
                    >
                      <Icon className="h-[22px] w-[22px]" />
                    </span>

                    <div>
                      <h3
                        className="font-outfit text-[20px] font-semibold"
                        style={{ color: "var(--navy)" }}
                      >
                        {feature.title}
                      </h3>
                      <p
                        className="mt-2 text-sm leading-relaxed"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {feature.description}
                      </p>
                    </div>

                    <div
                      className="mt-auto border-t pt-4 text-[11px] font-semibold uppercase tracking-[2px]"
                      style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}
                    >
                      {feature.tags.join(" · ")}
                    </div>
                  </VvCard>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Testimonials ───────────────────────────────────────────────────── */}
        <section
          className="px-8"
          style={{
            background: "var(--sky-mist)",
            paddingTop: "var(--space-section)",
            paddingBottom: "var(--space-section)",
          }}
        >
          <div className="mx-auto max-w-[1200px]">
            <SectionHeader
              eyebrow="Pilots flying with us"
              title={
                <>
                  Built on real conversions.
                  <br />
                  Not stock photos.
                </>
              }
              align="left"
            />

            <div className="mt-14 grid gap-7 lg:grid-cols-[1.4fr_1fr]">
              {/* Featured quote */}
              <div
                className="flex min-h-[360px] flex-col gap-6 rounded-2xl p-12"
                style={{ background: "var(--navy)", color: "white" }}
              >
                <Quote className="h-10 w-10" style={{ color: "var(--sky-bright)" }} strokeWidth={1.5} />
                <p
                  className="flex-1 font-outfit font-medium leading-[1.3]"
                  style={{
                    fontSize: "clamp(22px, 2.2vw, 30px)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  &ldquo;{testimonials[0].quote}&rdquo;
                </p>
                <div className="border-t pt-6" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  <p className="font-outfit text-[17px] font-semibold">{testimonials[0].name}</p>
                  <p className="mt-1 text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {testimonials[0].role}
                  </p>
                </div>
              </div>

              {/* Two stacked */}
              <div className="flex flex-col gap-5">
                {testimonials.slice(1).map((t) => (
                  <VvCard key={t.name} className="flex flex-col gap-5 p-7">
                    <Quote className="h-7 w-7" style={{ color: "var(--sky)" }} strokeWidth={1.5} />
                    <p
                      className="flex-1 text-[15px] leading-relaxed"
                      style={{ color: "var(--text-primary)" }}
                    >
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="border-t pt-4" style={{ borderColor: "var(--border-soft)" }}>
                      <p
                        className="font-outfit text-[15px] font-semibold"
                        style={{ color: "var(--navy)" }}
                      >
                        {t.name}
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                        {t.role}
                      </p>
                    </div>
                  </VvCard>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ────────────────────────────────────────────────────────── */}
        <section
          id="pricing"
          className="px-8"
          style={{
            scrollMarginTop: 68,
            background: "var(--white)",
            paddingTop: "var(--space-section)",
            paddingBottom: "var(--space-section)",
          }}
        >
          <div className="mx-auto max-w-[1200px]">
            <SectionHeader
              eyebrow="Pricing"
              title="Pay once your license is issued."
              sub="No subscription wall in front of getting your conversion done. We make money when you fly."
            />

            <div className="mt-14 grid items-stretch gap-5 md:grid-cols-3">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.name}
                  className="relative flex flex-col rounded-2xl p-8"
                  style={{
                    background: tier.featured ? "var(--navy)" : "var(--white)",
                    border: tier.featured
                      ? "1px solid var(--navy)"
                      : "1px solid var(--border)",
                    color: tier.featured ? "white" : "inherit",
                  }}
                >
                  {tier.badge && (
                    <span
                      className="absolute right-6 rounded-full text-[10px] font-bold uppercase tracking-[2px]"
                      style={{ top: -1, transform: 'translateY(-50%)', padding: '5px 11px', background: "var(--sky-bright)", color: "var(--navy)" }}
                    >
                      {tier.badge}
                    </span>
                  )}

                  <p
                    className="font-outfit text-sm font-semibold uppercase"
                    style={{
                      letterSpacing: "0.3px",
                      color: tier.featured ? "var(--sky-bright)" : "var(--sky)",
                    }}
                  >
                    {tier.name}
                  </p>
                  <p
                    className="mt-2 min-h-[38px] text-sm"
                    style={{
                      color: tier.featured
                        ? "rgba(255,255,255,0.7)"
                        : "var(--text-secondary)",
                    }}
                  >
                    {tier.description}
                  </p>

                  <div className="mt-6 flex items-baseline gap-2">
                    <span
                      className="font-outfit font-bold leading-none"
                      style={{
                        fontSize: 48,
                        letterSpacing: "-0.03em",
                        color: tier.featured ? "white" : "var(--navy)",
                      }}
                    >
                      {tier.price}
                    </span>
                    <span
                      className="text-xs"
                      style={{
                        color: tier.featured
                          ? "rgba(255,255,255,0.55)"
                          : "var(--text-muted)",
                      }}
                    >
                      {tier.priceNote}
                    </span>
                  </div>

                  <ul className="mt-7 flex flex-1 flex-col gap-3">
                    {tier.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2.5 text-sm"
                        style={{
                          color: tier.featured
                            ? "rgba(255,255,255,0.85)"
                            : "var(--text-primary)",
                        }}
                      >
                        <Check
                          className="mt-[3px] h-3.5 w-3.5 shrink-0"
                          style={{
                            color: tier.featured ? "var(--sky-bright)" : "var(--sky)",
                          }}
                          strokeWidth={2.5}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    {tier.featured ? (
                      <VvButton variant="sky" className="w-full justify-center">
                        {tier.cta}
                      </VvButton>
                    ) : (
                      <VvButton variant="outline" className="w-full justify-center">
                        {tier.cta}
                      </VvButton>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Guarantee strip */}
            <div
              className="mx-auto mt-9 flex max-w-xl items-center justify-center gap-3 rounded-[10px] border px-6 py-4 text-sm"
              style={{
                background: "var(--sky-mist)",
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              <Shield className="h-4 w-4 shrink-0" style={{ color: "var(--sky)" }} />
              <span>
                If your license isn&apos;t issued, you don&apos;t pay. Full refund guarantee on Solo tier.
              </span>
            </div>
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────────────────── */}
        <section
          id="faq"
          className="px-8"
          style={{
            scrollMarginTop: 68,
            background: "var(--sky-mist)",
            paddingTop: "var(--space-section)",
            paddingBottom: "var(--space-section)",
          }}
        >
          <div className="mx-auto max-w-[920px]">
            <SectionHeader eyebrow="Questions" title="Things pilots ask before signing up." />

            <div className="mt-12 flex flex-col gap-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={faq.question}
                    className="overflow-hidden rounded-xl bg-white"
                    style={{
                      border: `1px solid ${isOpen ? "var(--sky)" : "var(--border)"}`,
                      transition: "border-color 0.15s",
                    }}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                      className="flex w-full items-center justify-between px-7 py-[22px] text-left"
                    >
                      <span
                        className="font-outfit text-[17px] font-semibold"
                        style={{ color: "var(--navy)" }}
                      >
                        {faq.question}
                      </span>
                      <span
                        className="relative ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200"
                        style={{
                          background: isOpen ? "var(--sky)" : "var(--sky-pale)",
                          color: isOpen ? "white" : "var(--sky)",
                        }}
                      >
                        <Plus
                          className="absolute h-4 w-4 transition-all duration-200 ease-out"
                          strokeWidth={2.5}
                          style={{
                            opacity: isOpen ? 0 : 1,
                            transform: isOpen ? "rotate(90deg) scale(0.6)" : "rotate(0deg) scale(1)",
                          }}
                        />
                        <Minus
                          className="absolute h-4 w-4 transition-all duration-200 ease-out"
                          strokeWidth={2.5}
                          style={{
                            opacity: isOpen ? 1 : 0,
                            transform: isOpen ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.6)",
                          }}
                        />
                      </span>
                    </button>
                    {faq.answer && (
                      <div
                        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                      >
                        <div className="overflow-hidden">
                          <div
                            className="px-7 pb-[26px] text-[15px] leading-[1.65]"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {faq.answer}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Final CTA ──────────────────────────────────────────────────────── */}
        <section
          className="px-8"
          style={{
            paddingTop: "var(--space-section)",
            paddingBottom: "var(--space-section)",
          }}
        >
          <div className="mx-auto max-w-[1080px]">
            <div
              className="relative grid items-center gap-12 overflow-hidden rounded-[20px] px-14 py-[64px] text-white md:grid-cols-[1.6fr_1fr]"
              style={{ background: "var(--navy)" }}
            >
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-[3px]"
                  style={{ color: "var(--sky-bright)" }}
                >
                  Ready to take off?
                </p>
                <h2
                  className="mt-3 font-outfit font-bold leading-[1.1]"
                  style={{ fontSize: "clamp(32px, 4vw, 44px)", letterSpacing: "-0.02em" }}
                >
                  Your next license is
                  <br /> 42 days away.
                </h2>
                <p
                  className="mt-4 text-[16px]"
                  style={{ color: "rgba(255,255,255,0.65)", maxWidth: 440 }}
                >
                  Free to start. Pay only when your conversion is issued. No corporate sales calls
                  required.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Link href="/register">
                  <VvButton variant="sky" className="w-full justify-center">
                    Start your conversion <ArrowRight className="h-4 w-4" />
                  </VvButton>
                </Link>
                <Link href="/login">
                  <VvButton
                    variant="outline"
                    className="w-full justify-center border-white/30 text-white hover:bg-white hover:text-navy"
                  >
                    I already have an account
                  </VvButton>
                </Link>
              </div>
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
            {/* Social icons */}
            <div className="mt-6 flex gap-4">
              {[
                { label: "Instagram", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg> },
                { label: "WhatsApp", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> },
                { label: "LinkedIn", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> },
              ].map((s) => (
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
