'use client';

import { useUser } from "@/firebase";
import { useFirestore } from "@/firebase";
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useMemo } from 'react';
import { PageTransition } from "@/components/PageTransition";
import Link from "next/link";
import type { Application, UserProfile } from "@/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';

import {
  FileText,
  LineChart,
  ChevronRight,
  Lock,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";

import { LoadingScreen } from "@/components/LoadingScreen";
import { VvPageHeader } from "@/components/vv/VvPageHeader";
import { VvStatusBadge, type VvStatusBadgeProps } from "@/components/vv/VvStatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/* ── Status mapping ────────────────────────────────────────────────── */

type VvBadgeStatus = NonNullable<VvStatusBadgeProps["status"]>;

const APP_STATUS_TO_BADGE: Record<Application["status"], VvBadgeStatus> = {
  draft: "draft",
  submitted: "submitted",
  in_review: "in-review",
  needs_attention: "needs-attention",
  approved: "ready",
  rejected: "missing",
};

const APP_STATUS_LABEL: Record<Application["status"], string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In review",
  needs_attention: "Needs attention",
  approved: "Approved",
  rejected: "Rejected",
};

/* ── KPI Card ──────────────────────────────────────────────────────── */

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  tone?: "attention" | "ready" | "default";
}) {
  return (
    <div className="rounded-xl border border-[var(--vv-border)] bg-white p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            tone === "attention" && "bg-[var(--status-attention)]/10 text-[var(--status-attention)]",
            tone === "ready" && "bg-[var(--status-ready)]/10 text-[var(--status-ready)]",
            tone === "default" && "bg-[var(--sky-pale)] text-[var(--sky)]"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="font-inter text-[10px] font-semibold uppercase tracking-[3px] text-[var(--text-muted)]">
          {label}
        </div>
      </div>
      <div className="font-outfit text-3xl font-bold tracking-[-0.02em] text-[var(--navy)]">
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-[var(--text-muted)]">{sub}</div>}
    </div>
  );
}

/* ── Dash Card (navigation tile) ───────────────────────────────────── */

function DashCard({
  icon: Icon,
  kicker,
  title,
  body,
  cta,
  href,
  accent,
}: {
  icon: React.ElementType;
  kicker: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col justify-between overflow-hidden rounded-xl border border-[var(--vv-border)] bg-white p-7 transition-colors hover:border-[var(--sky)]"
    >
      <div>
        <div
          className="mb-5 flex h-11 w-11 items-center justify-center rounded-[12px] bg-[var(--sky-pale)]"
          style={{ color: accent }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="font-inter text-[10px] font-semibold uppercase tracking-[3px] text-[var(--text-muted)]">
          {kicker}
        </div>
        <h3 className="mt-1.5 font-outfit text-[20px] font-bold text-[var(--navy)]">{title}</h3>
        <p className="mt-2 max-w-[90%] text-sm leading-relaxed text-[var(--text-secondary)]">
          {body}
        </p>
      </div>
      <div
        className="mt-6 flex items-center gap-1.5 text-sm font-semibold"
        style={{ color: accent }}
      >
        {cta}
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

/* ── Application Row (queue list item) ─────────────────────────────── */

function ApplicationRow({
  application,
  user,
}: {
  application: Application;
  user?: UserProfile;
}) {
  const lastUpdated = application.updatedAt?.toDate?.()
    ? formatDistanceToNow(application.updatedAt.toDate(), { addSuffix: true })
    : "N/A";
  const totalHours =
    application.flightLogs?.reduce((sum, log) => sum + log.duration, 0) || 0;

  return (
    <Link href={`/admin/applications/${application.id}`}>
      <div className="group flex items-center gap-4 border-b border-[var(--vv-border-soft)] px-6 py-4 transition-colors last:border-b-0 hover:bg-[var(--sky-pale)]/30">
        <Avatar className="h-9 w-9 shrink-0 border border-[var(--vv-border)]">
          <AvatarImage
            src={user?.photoURL}
            alt={user?.displayName || "User"}
          />
          <AvatarFallback className="bg-[var(--sky-pale)] text-xs text-[var(--sky)]">
            {user?.displayName?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="truncate font-outfit text-sm font-semibold text-[var(--navy)]">
            {user?.displayName || "Unknown Applicant"}
          </div>
          <div className="truncate text-xs text-[var(--text-muted)]">
            {user?.email}
          </div>
        </div>

        <div className="hidden flex-col items-end text-right sm:flex">
          <div className="text-xs font-semibold text-[var(--navy)]">
            {application.licenseType || "—"}
          </div>
          <div className="mt-0.5 text-xs text-[var(--text-muted)]">
            {totalHours.toFixed(0)} hrs
          </div>
        </div>

        <div className="w-[130px] text-right">
          <VvStatusBadge status={APP_STATUS_TO_BADGE[application.status]}>
            {APP_STATUS_LABEL[application.status]}
          </VvStatusBadge>
        </div>

        <div className="hidden w-[100px] text-right text-xs text-[var(--text-muted)] lg:block">
          {lastUpdated}
        </div>

        <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */

export default function AdminDashboardPage() {
  const { claims, loading } = useUser();
  const firestore = useFirestore();
  const isAdmin = claims?.role === "admin" || claims?.role === "head-admin";

  /* Firestore queries — same pattern as /admin/applications */
  const applicationsRef = collection(firestore, "applications");
  const [applicationsSnapshot, appsLoading] = useCollection(
    query(applicationsRef, orderBy("updatedAt", "desc"))
  );
  const [usersSnapshot] = useCollection(collection(firestore, "users"));

  /* User lookup map */
  const usersMap = useMemo(() => {
    if (!usersSnapshot) return new Map<string, UserProfile>();
    const map = new Map<string, UserProfile>();
    usersSnapshot.docs.forEach((d) =>
      map.set(d.id, d.data() as UserProfile)
    );
    return map;
  }, [usersSnapshot]);

  /* Compute KPIs from live data */
  const { inReview, needsAttention, approved, totalActive, queueApps } =
    useMemo(() => {
      if (!applicationsSnapshot)
        return {
          inReview: 0,
          needsAttention: 0,
          approved: 0,
          totalActive: 0,
          queueApps: [] as Application[],
        };

      const allApps = applicationsSnapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Application)
      );

      const nonDraft = allApps.filter((a) => a.status !== "draft");

      return {
        inReview: allApps.filter(
          (a) => a.status === "in_review" || a.status === "submitted"
        ).length,
        needsAttention: allApps.filter(
          (a) => a.status === "needs_attention"
        ).length,
        approved: allApps.filter((a) => a.status === "approved").length,
        totalActive: nonDraft.length,
        queueApps: nonDraft.slice(0, 5),
      };
    }, [applicationsSnapshot]);

  if (loading) return <LoadingScreen text="Loading admin dashboard..." />;

  return (
    <PageTransition>
      <VvPageHeader
        kicker="Operations"
        title="Admin Dashboard"
        sub="Manage ongoing applications and review system analytics globally."
      />

      {/* ── KPI strip ──────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard
          label="In review"
          value={inReview}
          sub={`${inReview} in queue`}
          icon={FileText}
        />
        <KpiCard
          label="Needs attention"
          value={needsAttention}
          sub={`${needsAttention} flagged`}
          icon={AlertCircle}
          tone="attention"
        />
        <KpiCard
          label="Approved"
          value={approved}
          sub="All time"
          icon={CheckCircle2}
          tone="ready"
        />
        <KpiCard
          label="Total active"
          value={totalActive}
          sub="Excl. drafts"
          icon={Clock}
        />
      </div>

      {/* ── Navigation cards ───────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <DashCard
          icon={FileText}
          kicker="Workflow"
          title="Application Management"
          body="Access the full list of submitted and draft applications. Filter by applicant name or email to quickly find an application that needs attention."
          cta="Manage all applications"
          href="/admin/applications"
          accent="var(--sky)"
        />

        {isAdmin ? (
          <DashCard
            icon={LineChart}
            kicker="Insights"
            title="System Analytics"
            body="Track application processing times, approval rates, and total global volume to ensure the platform is functioning efficiently."
            cta="View global analytics"
            href="/admin/analytics"
            accent="var(--status-attention)"
          />
        ) : (
          <div className="flex h-full flex-col gap-3 rounded-xl border border-dashed border-[var(--vv-border)] bg-white p-9">
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--text-muted)]">
              <Lock className="h-[22px] w-[22px]" />
            </div>
            <div>
              <div className="font-inter text-[10px] font-semibold uppercase tracking-[3px] text-[var(--text-muted)]">
                Restricted
              </div>
              <div className="mt-1 font-outfit text-[22px] font-bold text-[var(--navy)]">
                System Analytics
              </div>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Reviewer role doesn&apos;t have analytics access. Ask your admin
              if you need this view.
            </p>
          </div>
        )}
      </div>

      {/* ── Live queue ─────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-[var(--vv-border)] bg-white">
        <div className="flex items-center justify-between border-b border-[var(--vv-border-soft)] px-6 py-5">
          <div>
            <h2 className="font-outfit text-lg font-semibold text-[var(--navy)]">
              Newest in your queue
            </h2>
            <div className="mt-0.5 text-xs text-[var(--text-muted)]">
              Most recent applications · auto-refreshing
            </div>
          </div>
          <Link
            href="/admin/applications"
            className="flex items-center gap-1.5 text-sm font-semibold text-[var(--sky)] transition-colors hover:text-[var(--sky-bright)]"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {appsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--sky)] border-t-transparent" />
          </div>
        ) : queueApps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-[var(--text-muted)]">
            <FileText className="mb-2 h-8 w-8 opacity-40" />
            <p className="text-sm">No applications in queue yet.</p>
          </div>
        ) : (
          queueApps.map((app) => (
            <ApplicationRow
              key={app.id}
              application={app}
              user={usersMap.get(app.userId)}
            />
          ))
        )}
      </div>
    </PageTransition>
  );
}
