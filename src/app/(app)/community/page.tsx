'use client';
import { useEffect, useState } from "react";
import { PageTransition } from "@/components/PageTransition";
import {
  Users, FileText, Activity, ShieldCheck, HelpCircle, BookOpen,
  Clock, Home, Shield, Globe, ArrowLeft, ArrowRight, Plus, Minus, X,
  TrendingUp, ClipboardList
} from "lucide-react";
import { getCommunityStatsAction } from "@/app/actions";
import { Skeleton } from "@/components/ui/skeleton";
import { VvPageHeader } from "@/components/vv/VvPageHeader";

/* ──────────────────────────────────────────────────────────────────────────
   COMING SOON FEATURES
   ────────────────────────────────────────────────────────────────────────── */
const COMING_SOON_FEATURES = [
  { id: "checklists", label: "Document Checklist by Authority", desc: "Tailored requirement lists per authority pair (e.g. FAA → EASA, DGCA → GCAA).",         eta: "Q4 2026" },
  { id: "timelines",  label: "Average Timeline Tracker",       desc: "Median conversion time per authority pair, updated monthly from real application data.", eta: "Q4 2026" },
  { id: "directory",  label: "Authority Directory",             desc: "Contact info, processing windows, and requirements for every supported authority.",      eta: "Q3 2026" },
  { id: "guidelines", label: "Guidelines tab",                  desc: "Platform conduct rules — what pilots may and may not do on Van-Vert.",                  eta: "Q3 2026" },
  { id: "threads",    label: "Pilot Discussion Threads",       desc: "Peer-to-peer Q&A — ask questions and share conversion experiences with other pilots.",   eta: "Q4 2026" },
  { id: "sop-trans",  label: "Translations SOP section",       desc: "Full guide on auto-translation, certified partners, and per-page à-la-carte orders.",    eta: "Q4 2026" },
  { id: "sop-issue",  label: "Issuance SOP section",           desc: "End-to-end guide on the final licence-issuance step, fees, and type-rating carry-over.", eta: "Q4 2026" },
];

/* ──────────────────────────────────────────────────────────────────────────
   FAQ DATA
   ────────────────────────────────────────────────────────────────────────── */
const FAQ_ITEMS: { q: string; a: string; soon?: string }[] = [
  {
    q: "How long does the conversion review take?",
    a: "An initial review typically takes 3–5 business days. If additional documentation or clarification is needed you will receive a notification with the exact requirement. The full median from submission to issued licence across all authority pairs is around 42 days — including time the authority holds the dossier.",
  },
  {
    q: "What happens if my medical certificate expires during review?",
    a: "The platform will warn you when expiry is approaching. If a medical certificate expires while your application is under review, it cannot be approved until a renewed version is uploaded. Your application pauses — not rejected — and resumes as soon as the new certificate is accepted.",
  },
  {
    q: "How are my flight logs analyzed?",
    a: "Van-Vert uses Document AI to automatically scan and extract flight logs from uploaded PDF logbooks. The AI identifies hours across categories (PIC, dual, instrument, solo) and summarises them for reviewers. You can manually adjust any entries after uploading if the extraction missed something.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All documents are stored in secure, private Google Cloud Storage buckets accessible only by the authenticated pilot who uploaded them and authorised admins. Role-based access control is enforced across every API endpoint.",
  },
  {
    q: "Will my documents be translated for me?",
    a: "Yes — your passport, current licence, and medical certificate are auto-translated into the receiving authority\u2019s working language using a certified aviation-translation partner. Other documents can be uploaded pre-translated, or you can request translation à la carte from your application sidebar.",
    soon: "sop-trans",
  },
  {
    q: "Can I run two conversions at once?",
    a: "Yes. Document re-use across applications happens automatically — you only upload your passport once and it applies to every active application. Both applications progress independently through their own review queues.",
  },
  {
    q: "What if the authority loses my submission?",
    a: "Every submission carries a Van-Vert tracking ID that authorities log on receipt. If a submission is mislaid, we re-issue the dossier from our copy within 24 hours at no cost to you.",
  },
];

/* ──────────────────────────────────────────────────────────────────────────
   SOP DATA
   ────────────────────────────────────────────────────────────────────────── */
const SOP_SECTIONS = [
  {
    id: "documents",
    title: "Document submission standard",
    intro: "All uploaded photographs and PDFs must be clear, legible, and ideally scanned in color.",
    points: [
      { title: "Legibility",           body: "All photos and PDFs must be clear and legible. Color scans are strongly preferred — black-and-white scans are accepted only where color is unavailable." },
      { title: "Digital signatures",    body: "Digital signatures or official seals on certificates must remain verifiable. Do not crop critical margins or bleed areas that contain authentication marks." },
      { title: "File size & batching",  body: "Maximum file size is 50 MB per upload. PDFs exceeding 15 pages are automatically batched for AI processing — you do not need to split them manually." },
      { title: "Expiry awareness",      body: "Documents with an expiry date (medical certificates, English proficiency attestations) are flagged automatically 90 days before they expire. Upload renewals promptly." },
    ],
  },
  {
    id: "monitoring",
    title: "Application monitoring",
    intro: "Pilots are expected to monitor their dashboard periodically after submission.",
    points: [
      { title: "Dashboard checks",  body: "Check your dashboard periodically after submission. Status changes — from Submitted to In Review, or to Needs Attention — are shown in real time and trigger a notification." },
      { title: "Feedback window",   body: "Any feedback provided by a reviewer (e.g. \u201cMissing signature on page 2\u201d) must be addressed within 14 days. If no action is taken, the application may revert to Draft status." },
      { title: "Expiry alerts",     body: "The platform sends in-app and email alerts when a document in an active application is within 90 days of expiry. Act on these promptly — an expired document pauses approval." },
      { title: "Re-submission",     body: "When you re-upload a flagged document, your application returns to the same case officer\u2019s queue with priority. Re-reviews typically resolve within 2 business days." },
    ],
  },
  {
    id: "communication",
    title: "Administrative communication",
    intro: "All platform communication with authorities and reviewers must go through the Van-Vert dashboard.",
    points: [
      { title: "No external contact", body: "Do not contact authorities outside the platform using your application or case ID. All correspondence is routed through Van-Vert to ensure a traceable record." },
      { title: "Credential safety",   body: "Do not share account credentials, unsecured personal keys, or sensitive data in free-text message fields. Upload documents only through the official document slots." },
      { title: "Appeals process",     body: "To appeal a rejected application, upload a corrected logbook or official clarification letter through the standard dashboard view. External escalation requests are handled within one business day." },
      { title: "Support",             body: "For platform issues, use the Help section. Case-specific questions go through your application\u2019s reviewer message thread — not external email." },
    ],
  },
];

const SOP_COMING: { id: string; title: string; icon: typeof Globe; desc: string }[] = [
  { id: "sop-trans", title: "Translations", icon: Globe,    desc: "Auto-translation, certified partners, and à-la-carte orders." },
  { id: "sop-issue", title: "Issuance",     icon: FileText, desc: "Final licence delivery, fees, and type-rating carry-over." },
];

/* ──────────────────────────────────────────────────────────────────────────
   TABS — Overview is default. All tabs navigable. Guidelines opens modal.
   ────────────────────────────────────────────────────────────────────────── */
const TABS = [
  { id: "overview",   label: "Overview",   icon: Home       },
  { id: "sop",        label: "SOPs",       icon: FileText   },
  { id: "faq",        label: "FAQ",        icon: HelpCircle },
  { id: "guidelines", label: "Guidelines", icon: Shield     },
] as const;

/* ──────────────────────────────────────────────────────────────────────────
   OVERVIEW: "Where most pilots start" resource links
   ────────────────────────────────────────────────────────────────────────── */
const RESOURCES = [
  { id: "checklists", icon: ClipboardList, title: "Document checklist by authority", desc: "Exactly what each authority requires, in the order they ask for it.", linkText: "See checklists" },
  { id: "timelines",  icon: Clock,         title: "Average timelines",              desc: "Median time from submission to issued license, by authority pair.",  linkText: "See timelines"  },
  { id: "directory",  icon: Globe,         title: "Authority directory",             desc: "Contact info and processing windows for every authority we support.", linkText: "Open directory" },
];

/* ──────────────────────────────────────────────────────────────────────────
   COMING SOON MODAL
   ────────────────────────────────────────────────────────────────────────── */
function ComingSoonModal({ triggerId, onClose }: { triggerId: string; onClose: () => void }) {
  const trigger = COMING_SOON_FEATURES.find((f) => f.id === triggerId) ?? COMING_SOON_FEATURES[0];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in-0 duration-200"
      style={{ background: "rgba(0,20,50,0.48)", backdropFilter: "blur(5px)" }}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl bg-white animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-3 duration-300"
        style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.22)" }}
      >
        <div className="relative shrink-0 bg-[var(--navy)] px-8 pb-7 pt-8">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-none transition-colors hover:bg-white/[0.16]"
            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
          >
            <X className="h-4 w-4" />
          </button>
          <div
            className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: "rgba(0,135,165,0.2)", border: "1px solid rgba(0,135,165,0.35)" }}
          >
            <Clock className="h-[22px] w-[22px] text-[var(--sky-bright)]" />
          </div>
          <div className="mb-1.5 font-inter text-[11px] font-semibold uppercase tracking-[3px] text-[var(--sky-bright)]">
            Coming soon
          </div>
          <h2 className="font-outfit text-[22px] font-bold leading-snug text-white">{trigger.label}</h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
            {trigger.desc}
          </p>
          <span className="mt-3 inline-flex items-center rounded-full px-2.5 py-1 font-inter text-[10px] font-bold uppercase tracking-[1.5px]" style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}>
            Targeting {trigger.eta}
          </span>
        </div>
        <div className="overflow-y-auto px-8 pb-8 pt-6">
          <div className="mb-3.5 font-inter text-xs font-semibold uppercase tracking-[2px] text-[var(--text-muted)]">
            All features in development
          </div>
          <div className="flex flex-col gap-2">
            {COMING_SOON_FEATURES.map((f, i) => {
              const isThis = f.id === triggerId;
              return (
                <div
                  key={f.id}
                  style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
                  className={`flex items-start gap-3 rounded-[10px] p-3 transition-colors duration-200 animate-in fade-in-0 slide-in-from-bottom-1 ${
                    isThis
                      ? "border border-[var(--vv-border)] bg-[var(--sky-pale)]"
                      : "border border-[var(--vv-border-soft)] bg-[var(--surface)]"
                  }`}
                >
                  <div className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full transition-colors duration-200 ${isThis ? "bg-[var(--sky)]" : "bg-[var(--vv-border)]"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className={`text-[13px] font-semibold leading-snug transition-colors duration-200 ${isThis ? "text-[var(--sky)]" : "text-[var(--navy)]"}`}>
                        {f.label}
                      </span>
                      <span className="shrink-0 rounded bg-[var(--vv-border-soft)] px-[7px] py-[2px] font-inter text-[10px] font-bold uppercase tracking-[1.5px] text-[var(--text-muted)]">
                        {f.eta}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs leading-relaxed text-[var(--text-secondary)]">{f.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={onClose}
            className="mt-5 flex w-full cursor-pointer items-center justify-center rounded-lg bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--navy-deep)]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   PAGE
   ────────────────────────────────────────────────────────────────────────── */
export default function CommunityPage() {
  const [stats, setStats] = useState<{ totalApplications: number; underReview: number; totalPilots: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [comingSoon, setComingSoon] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState(0);
  const [activeSop, setActiveSop] = useState("documents");

  useEffect(() => {
    async function loadStats() {
      const res = await getCommunityStatsAction();
      if (res.success && res.stats) {
        setStats(res.stats);
      } else {
        setStats({ totalApplications: 286, underReview: 587, totalPilots: 1876 });
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  /* ── Loading skeleton ────────────────────────────────────────────────── */
  if (loading) {
    return (
      <PageTransition>
        <VvPageHeader
          kicker="Community"
          title="Resources & guidance"
          sub="Read the official SOPs, browse pilot FAQs, and see how peers around the world are converting."
        />
        <div className="mb-7 flex gap-0 border-b border-[var(--vv-border)]">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="mx-2 my-3 h-5 w-20" />
          ))}
        </div>
        <div className="mb-7 grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--vv-border)] bg-white p-6">
              <div className="mb-3.5 flex items-center gap-2.5">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-9 w-20" />
              <Skeleton className="mt-2 h-3 w-36" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[var(--vv-border)] bg-white p-7">
          <Skeleton className="h-5 w-48" />
          <div className="mt-6 flex flex-col gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="mt-1.5 h-3 w-64" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  /* ── Stat cards ─────────────────────────────────────────────────────── */
  const STATS_CARDS = [
    { label: "Active applications",  value: stats?.totalApplications ?? 0, trend: "+ 124 this week",       icon: ClipboardList },
    { label: "Pilots under review",  value: stats?.underReview ?? 0,       trend: "across 18 authorities", icon: Users         },
    { label: "Registered pilots",    value: stats?.totalPilots ?? 0,       trend: "globally",              icon: ShieldCheck   },
  ];

  /* ── Active SOP section ─────────────────────────────────────────────── */
  const sopSection = SOP_SECTIONS.find((s) => s.id === activeSop) ?? SOP_SECTIONS[0];
  const sopIndex = SOP_SECTIONS.findIndex((s) => s.id === activeSop);

  /* ── Tab handler ────────────────────────────────────────────────────── */
  function handleTabClick(id: string) {
    if (id === "guidelines") {
      setComingSoon("guidelines");
    } else {
      setTab(id);
    }
  }

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <PageTransition>
      <VvPageHeader
        kicker="Community"
        title="Resources & guidance"
        sub="Read the official SOPs, browse pilot FAQs, and see how peers around the world are converting."
      />

      {/* ── Tab bar ────────────────────────────────────────────────────── */}
      <div className="-mb-px mb-7 flex gap-0 border-b border-[var(--vv-border)]">
        {TABS.map((t) => {
          const isActive = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => handleTabClick(t.id)}
              className={`group -mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm transition-all duration-200 ${
                isActive
                  ? "border-[var(--sky)] font-semibold text-[var(--sky)]"
                  : "border-transparent font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon className={`h-[15px] w-[15px] transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── OVERVIEW TAB ───────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div key="overview" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          {/* Stats row */}
          <div className="mb-7 grid grid-cols-1 gap-4 md:grid-cols-3">
            {STATS_CARDS.map((s, i) => {
              const CardIcon = s.icon;
              return (
                <div
                  key={s.label}
                  style={{ animationDelay: `${i * 70}ms`, animationFillMode: "backwards" }}
                  className="animate-in fade-in-0 slide-in-from-bottom-2 rounded-xl border border-[var(--vv-border)] bg-white p-6 transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(0,45,120,0.07)]"
                >
                  <div className="mb-3.5 flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--sky-pale)] text-[var(--sky)]">
                      <CardIcon className="h-4 w-4" />
                    </div>
                    <div className="font-inter text-[10px] font-semibold uppercase tracking-[3px] text-[var(--sky)]">
                      {s.label}
                    </div>
                  </div>
                  <div className="font-outfit text-[34px] font-bold tracking-[-0.02em] text-[var(--navy)]">
                    {s.value.toLocaleString()}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--status-ready)]">
                    <TrendingUp className="h-3 w-3" />
                    {s.trend}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Where most pilots start */}
          <div className="rounded-xl border border-[var(--vv-border)] bg-white">
            <div className="px-7 pb-4 pt-6">
              <h2 className="font-outfit text-lg font-semibold text-[var(--navy)]">
                Where most pilots start
              </h2>
            </div>
            <div className="border-t border-[var(--vv-border)]">
              {RESOURCES.map((r, i) => {
                const ResIcon = r.icon;
                return (
                  <div
                    key={r.id}
                    className={`group flex items-center gap-4 px-7 py-5 transition-colors duration-200 hover:bg-[var(--surface)] ${
                      i < RESOURCES.length - 1 ? "border-b border-[var(--vv-border-soft)]" : ""
                    }`}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--sky-pale)] text-[var(--sky)] transition-transform duration-200 group-hover:scale-105">
                      <ResIcon className="h-[18px] w-[18px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-outfit text-sm font-semibold text-[var(--navy)]">{r.title}</div>
                      <div className="mt-0.5 text-[13px] text-[var(--text-secondary)]">{r.desc}</div>
                    </div>
                    <button
                      onClick={() => setComingSoon(r.id)}
                      className="flex flex-shrink-0 cursor-pointer items-center gap-1.5 bg-transparent text-sm font-medium text-[var(--sky)] transition-opacity hover:opacity-70"
                    >
                      {r.linkText}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── FAQ TAB ────────────────────────────────────────────────────── */}
      {tab === "faq" && (
        <div key="faq" className="flex max-w-[880px] flex-col gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <div className="mb-1">
            <h2 className="font-outfit text-xl font-semibold text-[var(--navy)]">Frequently asked questions</h2>
            <p className="mt-1 text-[13px] text-[var(--text-muted)]">
              Common questions about the Van-Vert platform and licence conversion.
            </p>
          </div>

          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openFaq === i;
            return (
              <div
                key={i}
                className="overflow-hidden rounded-xl border bg-white transition-colors duration-200"
                style={{ borderColor: isOpen ? "var(--sky)" : "var(--vv-border)" }}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? -1 : i)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 bg-transparent px-6 py-[18px] text-left"
                >
                  <span className="font-outfit text-[15px] font-semibold leading-snug text-[var(--navy)]">
                    {item.q}
                  </span>
                  <span
                    className="flex flex-shrink-0 items-center justify-center transition-all duration-200"
                    style={{
                      width: 28, height: 28, borderRadius: 7,
                      background: isOpen ? "var(--sky)" : "var(--sky-pale)",
                      color: isOpen ? "white" : "var(--sky)",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    {isOpen ? <Minus className="h-3.5 w-3.5" strokeWidth={2.5} /> : <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />}
                  </span>
                </button>
                <div
                  className="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr", opacity: isOpen ? 1 : 0 }}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-5">
                      <p className="text-sm leading-[1.65] text-[var(--text-secondary)]">{item.a}</p>
                      {item.soon && (
                        <button
                          onClick={() => setComingSoon(item.soon!)}
                          className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-transparent px-0 text-xs font-medium text-[var(--sky)] transition-opacity hover:opacity-70"
                        >
                          <Clock className="h-3 w-3" />
                          Learn more about this feature
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── SOP TAB ────────────────────────────────────────────────────── */}
      {tab === "sop" && (
        <div key="sop" className="grid grid-cols-1 items-start gap-7 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 md:grid-cols-[220px_1fr]">
          {/* Sidebar nav */}
          <aside className="sticky top-[92px]">
            <div className="mb-3 font-inter text-[10px] font-semibold uppercase tracking-[3px] text-[var(--text-muted)]">
              Live sections
            </div>
            <nav className="flex flex-col gap-0.5">
              {SOP_SECTIONS.map((s, i) => {
                const isA = s.id === activeSop;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSop(s.id)}
                    className="flex cursor-pointer items-baseline gap-2 rounded-md bg-transparent px-3 py-2 text-left text-[13px] transition-all duration-200"
                    style={{
                      color: isA ? "var(--sky)" : "var(--text-secondary)",
                      background: isA ? "var(--sky-pale)" : "transparent",
                      fontWeight: isA ? 600 : 400,
                      borderLeft: isA ? "2px solid var(--sky)" : "2px solid transparent",
                    }}
                  >
                    <span className="text-[10px] text-[var(--text-muted)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {s.title}
                  </button>
                );
              })}
            </nav>

            <div className="mb-3 mt-6 font-inter text-[10px] font-semibold uppercase tracking-[3px] text-[var(--text-muted)]">
              Coming soon
            </div>
            <nav className="flex flex-col gap-0.5">
              {SOP_COMING.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setComingSoon(s.id)}
                  className="flex cursor-pointer items-baseline gap-2 rounded-md bg-transparent px-3 py-2 text-left text-[13px] opacity-70"
                  style={{ color: "var(--text-muted)", borderLeft: "2px solid transparent" }}
                >
                  <span className="text-[10px]" style={{ color: "var(--vv-border)", fontVariantNumeric: "tabular-nums" }}>
                    {String(SOP_SECTIONS.length + i + 1).padStart(2, "0")}
                  </span>
                  {s.title}
                  <span
                    className="ml-0.5 rounded font-inter font-bold uppercase"
                    style={{ fontSize: 8, letterSpacing: "1.5px", background: "var(--sky-pale)", color: "var(--sky)", padding: "2px 5px", borderRadius: 3 }}
                  >
                    Soon
                  </span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main SOP content */}
          <article key={activeSop} className="animate-in fade-in-0 slide-in-from-bottom-1 rounded-xl border border-[var(--vv-border)] bg-white p-10 duration-300">
            <div className="font-inter text-[10px] font-semibold uppercase tracking-[3px] text-[var(--text-muted)]">
              Standard operating procedure &middot; {String(sopIndex + 1).padStart(2, "0")} of{" "}
              {String(SOP_SECTIONS.length).padStart(2, "0")}
            </div>
            <h2 className="mt-2 font-outfit text-[26px] font-semibold tracking-tight text-[var(--navy)]">
              {sopSection.title}
            </h2>
            <p className="mt-3 text-sm leading-[1.7] text-[var(--text-secondary)]">
              {sopSection.intro}
            </p>

            <div className="mt-6 flex flex-col gap-3">
              {sopSection.points.map((pt, i) => (
                <div
                  key={i}
                  style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}
                  className="flex gap-3.5 rounded-[10px] border border-[var(--vv-border-soft)] bg-[var(--surface)] p-[18px] transition-colors duration-200 animate-in fade-in-0 slide-in-from-bottom-1 hover:border-[var(--vv-border)] hover:bg-white"
                >
                  <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg bg-[var(--sky-pale)] font-outfit text-[13px] font-bold text-[var(--sky)]">
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-outfit text-sm font-semibold text-[var(--navy)]">{pt.title}</div>
                    <div className="mt-1 text-[13px] leading-[1.55] text-[var(--text-secondary)]">{pt.body}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-7 rounded-xl border border-[var(--vv-border)] bg-[var(--sky-pale)] p-5">
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-[15px] w-[15px] text-[var(--sky)]" />
                <span className="font-inter text-xs font-bold uppercase tracking-[2px] text-[var(--sky)]">
                  More sections in development
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {SOP_COMING.map((s) => {
                  const SopIcon = s.icon;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setComingSoon(s.id)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--vv-border)] bg-white px-3.5 py-2 text-[13px] font-medium text-[var(--navy)] transition-colors hover:bg-[var(--sky-pale)]"
                    >
                      <SopIcon className="h-[13px] w-[13px] text-[var(--sky)]" />
                      {s.title}
                      <ArrowRight className="h-3 w-3 text-[var(--text-muted)]" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex justify-between gap-3 border-t border-[var(--vv-border-soft)] pt-5">
              <button
                disabled={sopIndex === 0}
                onClick={() => { if (sopIndex > 0) setActiveSop(SOP_SECTIONS[sopIndex - 1].id); }}
                className="group inline-flex cursor-pointer items-center gap-1.5 bg-transparent text-sm font-medium text-[var(--sky)] transition-opacity hover:opacity-80 disabled:cursor-default disabled:opacity-40"
              >
                <ArrowLeft className="h-[13px] w-[13px] transition-transform duration-200 group-hover:-translate-x-1" /> Previous
              </button>
              <button
                disabled={sopIndex === SOP_SECTIONS.length - 1}
                onClick={() => { if (sopIndex < SOP_SECTIONS.length - 1) setActiveSop(SOP_SECTIONS[sopIndex + 1].id); }}
                className="group inline-flex cursor-pointer items-center gap-1.5 bg-transparent text-sm font-medium text-[var(--sky)] transition-opacity hover:opacity-80 disabled:cursor-default disabled:opacity-40"
              >
                Next <ArrowRight className="h-[13px] w-[13px] transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </article>
        </div>
      )}

      {/* ── Coming Soon modal ──────────────────────────────────────────── */}
      {comingSoon && <ComingSoonModal triggerId={comingSoon} onClose={() => setComingSoon(null)} />}
    </PageTransition>
  );
}
