'use client';

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, limit, orderBy, query, where } from "firebase/firestore";
import { CheckCircle2, AlertCircle, FileText, MessageSquare, Upload, ArrowRight } from "lucide-react";

import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import type { Application, Notification } from "@/types";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PageTransition } from "@/components/PageTransition";
import { VvPageHeader } from "@/components/vv/VvPageHeader";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const ACTIVITY_ICON: Record<string, { Icon: React.ElementType; tone: "ready" | "attention" | "default" }> = {
  approved: { Icon: CheckCircle2, tone: "ready" },
  attention: { Icon: AlertCircle, tone: "attention" },
  upload: { Icon: Upload, tone: "default" },
  default: { Icon: FileText, tone: "default" },
};

function activityVisual(title: string) {
  const t = title.toLowerCase();
  if (t.includes("approved") || t.includes("verified")) return ACTIVITY_ICON.approved;
  if (t.includes("attention") || t.includes("feedback") || t.includes("reject")) return ACTIVITY_ICON.attention;
  if (t.includes("upload")) return ACTIVITY_ICON.upload;
  return ACTIVITY_ICON.default;
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const units: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.345, "week"],
    [12, "month"],
    [Infinity, "year"],
  ];
  let value = seconds;
  for (const [size, name] of units) {
    if (value < size) {
      const rounded = Math.max(1, Math.round(value));
      return `${rounded} ${name}${rounded === 1 ? "" : "s"} ago`;
    }
    value /= size;
  }
  return "just now";
}

export default function DashboardPage() {
  const { user, claims, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && claims && ['reviewer', 'admin', 'head-admin'].includes(claims.role)) {
      router.push('/admin');
    }
  }, [userLoading, claims, router]);

  const userApplicationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "applications"), where("userId", "==", user.uid), orderBy("updatedAt", "desc"));
  }, [firestore, user]);

  const { data: applications, isLoading: appsLoading } = useCollection<Application>(userApplicationsQuery);

  const recentActivityQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "notifications"), orderBy("createdAt", "desc"), limit(4));
  }, [firestore, user]);

  const { data: recentActivity } = useCollection<Notification>(recentActivityQuery);

  const isLoading = userLoading || appsLoading;

  if (userLoading || (claims && ['reviewer', 'admin', 'head-admin'].includes(claims.role))) {
    return <LoadingScreen text="Loading dashboard..." />;
  }

  const apps = applications ?? [];
  const activeApps = apps.filter((a) => a.status !== 'approved' && a.status !== 'rejected');
  const needsAttention = apps.filter((a) => a.status === 'needs_attention').length;
  const docsOnFile = apps.reduce(
    (sum, a) => sum + (a.documents?.filter((d) => d.status === 'uploaded' || d.status === 'approved').length ?? 0),
    0
  );
  const flightHours = apps.reduce(
    (sum, a) => sum + (a.flightLogs?.reduce((s, l) => s + (l.duration || 0), 0) ?? 0),
    0
  );

  const displayName = (claims?.displayName as string | undefined) || user?.displayName || "there";
  const firstName = displayName.split(" ")[0];

  const stats = [
    {
      label: "Active applications",
      value: String(activeApps.length),
      sub: needsAttention > 0 ? `${needsAttention} need${needsAttention === 1 ? 's' : ''} attention` : "all on track",
      tone: needsAttention > 0 ? ("attention" as const) : undefined,
    },
    { label: "Documents on file", value: String(docsOnFile), sub: "across all applications" },
    { label: "Flight hours logged", value: flightHours.toFixed(1), sub: "from your flight logs" },
    { label: "Total applications", value: String(apps.length), sub: "lifetime" },
  ];

  return (
    <PageTransition>
      <VvPageHeader
        kicker="Welcome aboard"
        title={`${greeting()}, ${firstName}.`}
        sub={
          needsAttention > 0
            ? `You have ${needsAttention} application${needsAttention === 1 ? '' : 's'} needing attention and ${activeApps.length} in active review. Pick up where you left off.`
            : "Here's where your conversion stands today. Pick up where you left off."
        }
      />

      {/* Quick stats strip */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-[var(--vv-border)] bg-white p-5">
            <div className="font-inter text-[10px] font-semibold uppercase tracking-[3px] text-[var(--text-muted)]">
              {s.label}
            </div>
            <div className="mt-1.5 font-outfit text-[30px] font-bold tracking-[-0.02em] text-[var(--navy)]">
              {isLoading ? "—" : s.value}
            </div>
            <div className={`mt-1 text-xs ${s.tone === "attention" ? "text-[var(--status-attention)]" : "text-[var(--text-muted)]"}`}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* 2-up primary cards */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <DashCard
          icon={FileText}
          kicker="Your conversions"
          title="My Applications"
          body="View status, upload missing documents, and respond to reviewer feedback across your active conversions."
          cta="View applications"
          href="/applications"
        />
        <DashCard
          icon={MessageSquare}
          kicker="Resources"
          title="Community & Resources"
          body="Read SOPs, browse FAQs and see how other pilots are converting across authorities."
          cta="Open community"
          href="/community"
        />
      </div>

      {/* Recent activity */}
      <div className="mt-10">
        <div className="mb-4 font-inter text-[11px] font-semibold uppercase tracking-[3px] text-[var(--sky)]">
          Recent activity
        </div>
        <div className="overflow-hidden rounded-xl border border-[var(--vv-border)] bg-white">
          {recentActivity && recentActivity.length > 0 ? (
            recentActivity.map((row, i, arr) => {
              const { Icon, tone } = activityVisual(row.title);
              return (
                <div
                  key={row.id}
                  className={`flex items-center gap-4 px-6 py-[18px] ${i < arr.length - 1 ? "border-b border-[var(--vv-border-soft)]" : ""}`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      tone === "ready"
                        ? "bg-[#dcfce7] text-[var(--status-ready)]"
                        : tone === "attention"
                        ? "bg-[#fef3c7] text-[var(--status-attention)]"
                        : "bg-[var(--sky-pale)] text-[var(--sky)]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-sm text-[var(--text-primary)]">{row.title}</div>
                  <div className="shrink-0 text-xs text-[var(--text-muted)]">{timeAgo(row.createdAt.toDate())}</div>
                </div>
              );
            })
          ) : (
            <div className="px-6 py-10 text-center text-sm text-[var(--text-muted)]">No recent activity yet.</div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

function DashCard({
  icon: Icon,
  kicker,
  title,
  body,
  cta,
  href,
}: {
  icon: React.ElementType;
  kicker: string;
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-start gap-4 rounded-xl border border-[var(--vv-border)] bg-white p-9 text-left transition-all hover:border-[var(--sky)] hover:shadow-[0_8px_24px_rgba(0,45,120,0.06)]"
    >
      <div className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-[var(--sky-pale)] text-[var(--sky)]">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <div className="font-inter text-[11px] font-semibold uppercase tracking-[3px] text-[var(--sky)]">{kicker}</div>
        <div className="mt-1 font-outfit text-2xl font-semibold text-[var(--navy)]">{title}</div>
      </div>
      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{body}</p>
      <div className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--sky)]">
        {cta} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
