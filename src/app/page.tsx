'use client';
export const dynamic = 'force-dynamic';

import Link from "next/link";
import { ArrowRight, FileText, Clock, MessageSquare, Plus } from "lucide-react";
import { VvButton } from "@/components/vv/VvButton";
import { VvCard } from "@/components/vv/VvCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
    icon: Clock,
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
  },
];

const faqs = [
  {
    question: "Which license conversions does Van-Vert support?",
    answer:
      "We support PPL, CPL and ATPL conversions across FAA, EASA, UK CAA, Transport Canada, GCAA and DGCA. Type ratings ride along with the main licence. If your authority pair isn't listed yet, we add the next one our pilots ask for — and it's usually fast.",
    open: true,
  },
  { question: "How long does a typical conversion take?" },
  { question: "What if my medical or background check expires mid-process?" },
  { question: "Are my documents secure?" },
  { question: "Can my flight school manage conversions for a whole cohort?" },
  { question: "What happens if my application is rejected?" },
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

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[var(--vv-border)] bg-white/90 px-6 backdrop-blur md:px-10">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-[var(--text-secondary)] md:flex">
          {navLinks.map((link) => (
            <Link key={link.label} href={link.href} className="transition-colors hover:text-navy">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-navy">
            Sign in
          </Link>
          <Link href="/register">
            <VvButton size="sm">Get started</VvButton>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-navy px-6 pb-24 pt-20 text-white md:px-10 md:pb-32 md:pt-28">
          <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
            <div className="absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full border border-white/20" />
            <div className="absolute -right-10 top-10 h-72 w-72 rounded-full border border-white/20" />
          </div>

          <div className="relative mx-auto max-w-6xl">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-sky-pale/60">
              Now boarding — Van-Vert v1.0
            </p>
            <h1 className="max-w-2xl font-outfit text-5xl font-bold leading-[1.08] tracking-tight md:text-6xl">
              Pilot license conversion is{" "}
              <span className="text-sky-bright">broken.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-sky-pale/70 md:text-lg">
              We&apos;ve shipped your license file across three time zones, four authorities and one
              rogue PDF compressor. Then we fixed it.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
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

            <div className="mt-14 grid max-w-xl gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/15 bg-white/5 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-sky-pale/50">
                  The old way
                </p>
                <p className="mt-2 font-outfit text-4xl font-bold">
                  184 <span className="text-base font-medium text-sky-pale/60">days</span>
                </p>
                <ul className="mt-3 space-y-1 text-sm text-sky-pale/60">
                  <li>Paper checklists</li>
                  <li>Email threads</li>
                  <li>Lost translations</li>
                  <li>No status</li>
                </ul>
              </div>
              <div className="rounded-xl border border-sky-bright/40 bg-white/5 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-sky-pale/50">
                  On Van-Vert
                </p>
                <p className="mt-2 font-outfit text-4xl font-bold">
                  42 <span className="text-base font-medium text-sky-pale/60">days</span>
                </p>
                <ul className="mt-3 space-y-1 text-sm text-sky-pale/60">
                  <li>One checklist</li>
                  <li>Live status</li>
                  <li>Auto-translation</li>
                  <li>Direct review</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-6 py-24 md:px-10">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky">The platform</p>
            <h2 className="mt-3 max-w-xl font-outfit text-3xl font-bold tracking-tight text-navy md:text-4xl">
              Everything between you and your new license. Nothing else.
            </h2>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <VvCard key={feature.title} className="flex flex-col gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-pale text-sky">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-outfit text-lg font-semibold text-navy">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{feature.description}</p>
                    </div>
                    <p className="mt-auto pt-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      {feature.tags.join(" · ")}
                    </p>
                  </VvCard>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-sky-mist px-6 py-24 md:px-10">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky">Pilots flying with us</p>
            <h2 className="mt-3 max-w-xl font-outfit text-3xl font-bold tracking-tight text-navy md:text-4xl">
              Built on real conversions. Not stock photos.
            </h2>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <div className="flex flex-col justify-between rounded-xl bg-navy p-8 text-white">
                <p className="font-outfit text-3xl text-sky-bright">&ldquo;</p>
                <p className="mt-2 text-lg leading-relaxed text-white/90">{testimonials[0].quote}</p>
                <div className="mt-8">
                  <p className="font-semibold text-white">{testimonials[0].name}</p>
                  <p className="text-sm text-sky-pale/60">{testimonials[0].role}</p>
                </div>
              </div>
              <div className="flex flex-col gap-6">
                {testimonials.slice(1).map((t) => (
                  <VvCard key={t.name}>
                    <p className="font-outfit text-2xl text-sky">&ldquo;</p>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">{t.quote}</p>
                    <div className="mt-5">
                      <p className="text-sm font-semibold text-navy">{t.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{t.role}</p>
                    </div>
                  </VvCard>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="px-6 py-24 md:px-10">
          <div className="mx-auto max-w-6xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky">Pricing</p>
            <h2 className="mt-3 font-outfit text-3xl font-bold tracking-tight text-navy md:text-4xl">
              Pay once your license is issued.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
              No subscription wall in front of getting your conversion done. We make money when you fly.
            </p>

            <div className="mt-12 grid gap-6 text-left md:grid-cols-3">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.name}
                  className={
                    tier.featured
                      ? "relative flex flex-col rounded-xl bg-navy p-7 text-white shadow-xl"
                      : "relative flex flex-col rounded-xl border border-[var(--vv-border)] bg-white p-7"
                  }
                >
                  {tier.badge && (
                    <span className="absolute -top-3 right-7 rounded-full bg-sky-bright px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                      {tier.badge}
                    </span>
                  )}
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.15em] ${tier.featured ? "text-sky-pale/60" : "text-[var(--text-muted)]"}`}>
                    {tier.name}
                  </p>
                  <p className={`mt-1 text-sm ${tier.featured ? "text-sky-pale/70" : "text-[var(--text-secondary)]"}`}>
                    {tier.description}
                  </p>
                  <p className={`mt-6 font-outfit text-4xl font-bold ${tier.featured ? "text-white" : "text-navy"}`}>
                    {tier.price}
                  </p>
                  <p className={`text-xs ${tier.featured ? "text-sky-pale/60" : "text-[var(--text-muted)]"}`}>{tier.priceNote}</p>

                  <ul className="mt-6 flex flex-col gap-2.5 text-sm">
                    {tier.features.map((f) => (
                      <li key={f} className={`flex items-start gap-2 ${tier.featured ? "text-white/85" : "text-[var(--text-secondary)]"}`}>
                        <Plus className={`mt-0.5 h-3.5 w-3.5 shrink-0 rotate-45 ${tier.featured ? "text-sky-bright" : "text-sky"}`} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    {tier.featured ? (
                      <VvButton variant="sky" className="w-full">{tier.cta}</VvButton>
                    ) : (
                      <VvButton variant="outline" className="w-full">{tier.cta}</VvButton>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p className="mx-auto mt-8 max-w-md text-xs text-[var(--text-muted)]">
              If your license isn&apos;t issued, you don&apos;t pay. Full refund guarantee on Solo tier.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-sky-mist px-6 py-24 md:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky">Questions</p>
            <h2 className="mt-3 font-outfit text-3xl font-bold tracking-tight text-navy md:text-4xl">
              Things pilots ask before signing up.
            </h2>

            <div className="mt-10 text-left">
              <Accordion type="single" collapsible defaultValue="item-0" className="flex flex-col gap-3">
                {faqs.map((faq, idx) => (
                  <AccordionItem
                    key={faq.question}
                    value={`item-${idx}`}
                    className="rounded-xl border border-[var(--vv-border)] bg-white px-5 data-[state=open]:border-sky"
                  >
                    <AccordionTrigger className="text-sm font-semibold text-navy hover:no-underline [&>svg]:text-sky">
                      {faq.question}
                    </AccordionTrigger>
                    {faq.answer && (
                      <AccordionContent className="text-sm leading-relaxed text-[var(--text-secondary)]">
                        {faq.answer}
                      </AccordionContent>
                    )}
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="bg-navy px-6 py-24 text-center text-white md:px-10">
          <h2 className="font-outfit text-5xl font-bold tracking-tight md:text-6xl">
            <span className="text-white">Van-</span>
            <span className="text-sky-bright">Vert.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-sky-pale/60">
            Where excellence takes flight. And paperwork takes a back seat.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
              <VvButton variant="sky">
                Start your conversion <ArrowRight className="h-4 w-4" />
              </VvButton>
            </Link>
            <Link href="/login">
              <VvButton variant="outline" className="border-white/30 text-white hover:bg-white hover:text-navy">
                Sign in
              </VvButton>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
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
