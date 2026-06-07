'use client';
import { useEffect, useState } from "react";
import { PageTransition } from "@/components/PageTransition";
import { Users, FileText, Activity, ShieldCheck, HelpCircle, BookOpen } from "lucide-react";
import { getCommunityStatsAction } from "@/app/actions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LoadingScreen } from "@/components/LoadingScreen";
import { VvPageHeader } from "@/components/vv/VvPageHeader";
import { VvTabs, type VvTabItem } from "@/components/vv/VvTabs";

const TABS: VvTabItem[] = [
  { id: "faq", label: "FAQs", icon: HelpCircle },
  { id: "sop", label: "Standard operating procedures", icon: BookOpen },
];

const SOP_SECTIONS = [
  {
    title: "1. Document submission standard",
    icon: ShieldCheck,
    points: [
      "All uploaded photographs and PDFs must be clear, legible, and ideally scanned in color.",
      "Digital signatures or seals on official certificates must be verifiable. Do not crop critical margins.",
      "Max file size is 50MB per upload. PDFs exceeding 15 pages will be automatically batched for AI reading.",
    ],
  },
  {
    title: "2. Application monitoring",
    icon: Activity,
    points: [
      "Pilots are expected to monitor their dashboard periodically after submission.",
      "Any feedback provided by a reviewer (e.g., “Missing signature on page 2”) must be addressed within 14 days, or the application may revert to “Draft” status.",
    ],
  },
  {
    title: "3. Administrative communication",
    icon: Users,
    points: [
      "Do not use the platform to share unsecured personal keys or credentials not directly requested in the document list.",
      "For appeals regarding rejected applications, pilots must upload a corrected logbook or official clarification letter within the standard dashboard application view rather than reaching out externally.",
    ],
  },
];

const FAQ_ITEMS = [
  {
    q: "How long does the conversion review take?",
    a: "Typically, an initial review takes between 3 to 5 business days. If additional documentation or clarification is needed, you will receive an email notification detailing the missing requirements.",
  },
  {
    q: "What happens if my medical certificate expires?",
    a: "If a document like a medical certificate approaches its expiry date while your application is under review, the system will warn you. If it expires, your application cannot be approved until a renewed version is uploaded.",
  },
  {
    q: "How are my flight logs analyzed?",
    a: "We use Google Document AI to automatically scan and extract flight logs from uploaded PDF logbooks. The AI identifies your hours out of various categories (PIC, dual, instrument, solo) and summarizes them for reviewers. You can manually adjust entries after uploading if needed.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All documents are stored in secure, private Google Cloud Storage buckets. Documents are only accessible by authenticated admins and the pilot who uploaded them. We enforce robust role-based access control across all APIs.",
  },
];

export default function CommunityPage() {
  const [stats, setStats] = useState<{ totalApplications: number, underReview: number, totalPilots: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"faq" | "sop">("faq");

  useEffect(() => {
    async function loadStats() {
      const res = await getCommunityStatsAction();
      if (res.success && res.stats) {
        setStats(res.stats);
      } else {
        // Fallback if network fails
        setStats({ totalApplications: 125, underReview: 42, totalPilots: 154 });
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  if (loading) {
      return <LoadingScreen text="Loading community overview..." />;
  }

  const STATS_CARDS = [
    { label: "Total pilots", value: stats?.totalPilots ?? 0, sub: "Pilots registered globally", icon: Users },
    { label: "Total applications", value: stats?.totalApplications ?? 0, sub: "Conversions processed or drafted", icon: FileText },
    { label: "Under review", value: stats?.underReview ?? 0, sub: "Currently being reviewed by admins", icon: Activity },
  ];

  return (
    <PageTransition>
      <VvPageHeader
        kicker="Community"
        title="Resources & guidance"
        sub="Discover global activity, read the standard operating procedures, and find answers in our FAQs."
      />

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {STATS_CARDS.map((s) => (
          <div key={s.label} className="rounded-xl border border-[var(--vv-border)] bg-white p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--sky-pale)] text-[var(--sky)]">
                <s.icon className="h-4 w-4" />
              </div>
              <div className="font-inter text-[10px] font-semibold uppercase tracking-[3px] text-[var(--text-muted)]">{s.label}</div>
            </div>
            <div className="font-outfit text-3xl font-bold tracking-[-0.02em] text-[var(--navy)]">{s.value.toLocaleString()}</div>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{s.sub}</p>
          </div>
        ))}
      </div>

      <VvTabs tabs={TABS} value={tab} onChange={(id) => setTab(id as "faq" | "sop")} />

      {tab === "faq" && (
        <div className="rounded-xl border border-[var(--vv-border)] bg-white p-6 sm:p-8">
          <h2 className="font-outfit text-lg font-semibold text-[var(--navy)]">Frequently asked questions</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Common questions about the Van-Vert platform and license conversion.</p>
          <Accordion type="single" collapsible className="mt-5 w-full">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-[var(--vv-border-soft)]">
                <AccordionTrigger className="font-outfit text-[15px] font-medium text-[var(--navy)] hover:text-[var(--sky)] hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {tab === "sop" && (
        <div className="rounded-xl border border-[var(--vv-border)] bg-white p-6 sm:p-8">
          <h2 className="font-outfit text-lg font-semibold text-[var(--navy)]">Standard operating procedures</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Guidelines and expectations for using the platform securely.</p>
          <div className="mt-6 space-y-6">
            {SOP_SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className="flex items-center gap-2 font-outfit text-base font-semibold text-[var(--navy)]">
                  <section.icon className="h-[18px] w-[18px] text-[var(--sky)]" />
                  {section.title}
                </h3>
                <div className="mt-2.5 space-y-2 pl-[26px] text-sm leading-relaxed text-[var(--text-secondary)]">
                  {section.points.map((p, i) => <p key={i}>• {p}</p>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageTransition>
  );
}
