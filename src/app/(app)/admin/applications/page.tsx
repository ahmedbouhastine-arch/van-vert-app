'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useFirestore } from "@/firebase";
import Link from 'next/link';
import { useState, useMemo } from 'react';
import type { Application, UserProfile } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Download, FileText, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { PageTransition } from "@/components/PageTransition";
import { VvPageHeader } from "@/components/vv/VvPageHeader";
import { VvButton } from "@/components/vv/VvButton";
import { VvStatusBadge, type VvStatusBadgeProps } from "@/components/vv/VvStatusBadge";

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

/* ── Application Row ───────────────────────────────────────────────── */

function ApplicationRow({
  application,
  user,
  isDraftSection,
}: {
  application: Application;
  user?: UserProfile;
  isDraftSection?: boolean;
}) {
  const isDraft = application.status === "draft";
  const lastUpdated = application.updatedAt?.toDate?.()
    ? formatDistanceToNow(application.updatedAt.toDate(), { addSuffix: true })
    : "N/A";
  const totalHours =
    application.flightLogs?.reduce((sum, log) => sum + log.duration, 0) || 0;

  return (
    <Link href={`/admin/applications/${application.id}`}>
      <div className="group relative flex items-center gap-4 border-b border-[var(--vv-border-soft)] px-6 py-4 transition-colors last:border-b-0 hover:bg-[var(--sky-pale)]/30">
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
          <div className="flex items-center gap-2.5">
            <p className="truncate font-outfit text-sm font-semibold text-[var(--navy)]">
              {user?.displayName || "Unknown Applicant"}
            </p>
            {isDraft && (
              <span className="shrink-0 rounded-full border border-[var(--status-attention)]/30 bg-[var(--status-attention)]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--status-attention)]">
                Draft
              </span>
            )}
          </div>
          <p className="truncate text-xs text-[var(--text-muted)]">
            {user?.email}
          </p>
        </div>

        <div className="hidden flex-col items-end text-right sm:flex">
          <div className="text-xs font-semibold text-[var(--navy)]">
            {application.licenseType || "—"}
          </div>
          <div className="mt-0.5 text-xs text-[var(--text-muted)]">
            {totalHours.toFixed(1)} hrs
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

/* ── Application Row Skeleton ───────────────────────────────────────── */

function ApplicationRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-[var(--vv-border-soft)] px-6 py-4 last:border-b-0">
      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3 w-52" />
      </div>
      <div className="hidden flex-col items-end gap-1.5 sm:flex">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-10" />
      </div>
      <Skeleton className="h-5 w-[100px] rounded-full" />
      <Skeleton className="hidden h-3 w-14 lg:block" />
      <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */

function AdminApplicationsPage() {
  const firestore = useFirestore();
  const applicationsRef = collection(firestore, "applications");

  const [searchTerm, setSearchTerm] = useState("");

  /* Fetch all applications and all users */
  const [applicationsSnapshot, loading, error] = useCollection(
    query(applicationsRef, orderBy("updatedAt", "desc"))
  );
  const [usersSnapshot, usersLoading, usersError] = useCollection(
    collection(firestore, "users")
  );

  /* userId → UserProfile map */
  const usersMap = useMemo(() => {
    if (!usersSnapshot) return new Map<string, UserProfile>();
    const map = new Map<string, UserProfile>();
    usersSnapshot.docs.forEach((d) =>
      map.set(d.id, d.data() as UserProfile)
    );
    return map;
  }, [usersSnapshot]);

  /* Filter and split */
  const { submittedApps, draftApps } = useMemo(() => {
    if (!applicationsSnapshot)
      return { submittedApps: [], draftApps: [] };

    const allApps = applicationsSnapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() } as Application)
    );

    const filteredApps = allApps.filter((app) => {
      const u = usersMap.get(app.userId);
      const name = u?.displayName?.toLowerCase() || "";
      const email = u?.email?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();
      return name.includes(search) || email.includes(search);
    });

    return {
      submittedApps: filteredApps.filter((app) => app.status !== "draft"),
      draftApps: filteredApps.filter((app) => app.status === "draft"),
    };
  }, [applicationsSnapshot, usersMap, searchTerm]);

  /* Render helpers */
  const isLoading = loading || usersLoading;
  const loadError = error || usersError;

  function renderSection(
    apps: Application[],
    isDraftSection?: boolean
  ) {
    if (isLoading) {
      return (
        <div className="overflow-hidden rounded-xl border border-[var(--vv-border)] bg-white">
          {[...Array(3)].map((_, i) => (
            <ApplicationRowSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (loadError) {
      return (
        <p className="text-sm text-[var(--status-missing)]">
          Error: {loadError.message}
        </p>
      );
    }

    if (apps.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--vv-border)] p-12 text-center text-[var(--text-muted)]">
          <FileText className="mb-3 h-10 w-10 opacity-40" />
          <h3 className="font-outfit text-base font-semibold text-[var(--navy)]">
            No applications found
          </h3>
          <p className="mt-1 text-sm">
            {isDraftSection
              ? "No drafts in progress."
              : "No submitted applications match your search."}
          </p>
        </div>
      );
    }

    return (
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-[var(--vv-border)] bg-white",
          isDraftSection && "border-l-[3px] border-l-[var(--status-attention)]"
        )}
      >
        {apps.map((app) => (
          <ApplicationRow
            key={app.id}
            application={app}
            user={usersMap.get(app.userId)}
            isDraftSection={isDraftSection}
          />
        ))}
      </div>
    );
  }

  return (
    <PageTransition>
      <VvPageHeader
        kicker="Operations"
        title="All applications"
        sub="Every active conversion on the platform. Use search to jump straight to a pilot or email."
        actions={
          <VvButton variant="outline" size="sm">
            <Download className="h-4 w-4" /> Export
          </VvButton>
        }
      />

      {/* ── Search ─────────────────────────────────────────────── */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          placeholder="Search by applicant name or email…"
          className="w-full rounded-xl border border-[var(--vv-border)] bg-white py-3.5 pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--sky)] focus:ring-1 focus:ring-[var(--sky)]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* ── Sections ───────────────────────────────────────────── */}
      <div className="space-y-10">
        {/* Submitted */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="font-outfit text-lg font-semibold text-[var(--navy)]">
              Submitted applications
            </h2>
            {!loading && (
              <span className="rounded-full bg-[var(--sky-pale)] px-2.5 py-0.5 text-xs font-semibold text-[var(--sky)]">
                {submittedApps.length}
              </span>
            )}
          </div>
          {renderSection(submittedApps)}
        </section>

        {/* Drafts */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="font-outfit text-lg font-semibold text-[var(--navy)]">
              Draft applications
            </h2>
            {!loading && (
              <span className="rounded-full bg-[var(--status-attention)]/15 px-2.5 py-0.5 text-xs font-semibold text-[var(--status-attention)]">
                {draftApps.length}
              </span>
            )}
          </div>
          {renderSection(draftApps, true)}
        </section>
      </div>
    </PageTransition>
  );
}

export default AdminApplicationsPage;
