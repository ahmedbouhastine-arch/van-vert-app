'use client';
export const dynamic = 'force-dynamic';

import Link from "next/link";
import { useState } from "react";
import { redirect } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc, deleteDoc, orderBy } from "firebase/firestore";
import type { Application, FirebaseTimestamp } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PageTransition } from "@/components/PageTransition";
import { VvPageHeader } from "@/components/vv/VvPageHeader";
import { VvButton, vvButtonVariants } from "@/components/vv/VvButton";
import { VvStatusBadge } from "@/components/vv/VvStatusBadge";
import { VvEmptyState } from "@/components/vv/VvEmptyState";
import { cn } from "@/lib/utils";

const safeFormatDate = (date: FirebaseTimestamp | Date | string | undefined | null, formatString: string) => {
  if (!date) return 'N/A';
  try {
    if (typeof date === 'object' && date && 'toDate' in date && typeof date.toDate === 'function') {
      return format(date.toDate(), formatString);
    }
    return format(new Date(date as string), formatString);
  } catch (error) {
    console.error("Date formatting failed:", error);
    return "Invalid Date";
  }
};

const STATUS_TO_BADGE: Record<string, "draft" | "submitted" | "in-review" | "ready" | "needs-attention" | "missing"> = {
  draft: "draft",
  submitted: "submitted",
  in_review: "in-review",
  needs_attention: "needs-attention",
  approved: "ready",
  rejected: "missing",
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "in_review", label: "In Review" },
  { id: "needs_attention", label: "Needs Attention" },
  { id: "approved", label: "Approved" },
] as const;

function ApplicationsPageSkeleton() {
  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Skeleton className="mb-3 h-8 w-44" />
          <Skeleton className="h-4 w-[440px] max-w-full" />
        </div>
        <Skeleton className="h-9 w-40 shrink-0 rounded-lg" />
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[34px] w-20 rounded-full" />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--vv-border)] bg-white p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_180px_140px_24px] sm:gap-6">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div>
                <div className="mb-2 flex justify-between">
                  <Skeleton className="h-2.5 w-20" />
                  <Skeleton className="h-2.5 w-8" />
                </div>
                <Skeleton className="h-1 w-full rounded-full" />
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function MyApplicationsPage() {
  const { user, claims, loading: userLoading } = useUser();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
  const [appToDelete, setAppToDelete] = useState<Application | null>(null);
  const firestore = useFirestore();
  const { toast } = useToast();

  const userApplicationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "applications"), where("userId", "==", user.uid), orderBy("updatedAt", "desc"));
  }, [firestore, user]);

  const { data: userApplications, isLoading: appsLoading } = useCollection<Application>(userApplicationsQuery);

  const isLoading = userLoading || appsLoading;

  const handleDelete = async () => {
    if (!appToDelete || !firestore) return;

    const appRef = doc(firestore, 'applications', appToDelete.id);
    try {
      await deleteDoc(appRef);
      toast({
        title: 'Draft Deleted',
        description: `Application for '${appToDelete.licenseType}' has been deleted.`
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: 'Could not delete the application. Please try again.'
      });
    } finally {
      setAppToDelete(null);
    }
  };

  if (isLoading) {
    return <ApplicationsPageSkeleton />;
  }

  if (claims && ['reviewer', 'admin', 'head-admin'].includes(claims.role)) {
    redirect('/admin');
  }

  const apps = userApplications ?? [];
  const filtered = apps.filter((a) => (filter === "all" ? true : a.status === filter));

  return (
    <PageTransition>
      <VvPageHeader
        title="My Applications"
        sub="Each application moves through draft → submitted → in review → ready. You can keep multiple running at once."
        actions={
          <Link href="/applications/new" className={cn(vvButtonVariants({ variant: "navy" }))}>
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            New application
          </Link>
        }
      />

      {/* Filter chips */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = f.id === "all" ? apps.length : apps.filter((a) => a.status === f.id).length;
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-[7px] text-[13px] font-medium transition-colors",
                active
                  ? "border-[var(--navy)] bg-[var(--navy)] text-white"
                  : "border-[var(--vv-border)] bg-white text-[var(--text-secondary)] hover:border-[var(--sky)]"
              )}
            >
              {f.label}
              <span className={cn("text-[11px] font-semibold", active ? "text-white/60" : "text-[var(--text-muted)]")}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {filtered.map((app) => {
          const total = app.documents?.length ?? 0;
          const uploaded = app.documents?.filter((d) => d.status === "uploaded" || d.status === "approved").length ?? 0;
          const pct = total > 0 ? Math.round((uploaded / total) * 100) : 0;
          return (
            <Link
              key={app.id}
              href={`/applications/${app.id}`}
              className="grid w-full grid-cols-1 items-center gap-4 rounded-xl border border-[var(--vv-border)] bg-white p-6 text-left transition-colors hover:border-[var(--sky)] sm:grid-cols-[1fr_180px_140px_24px] sm:gap-6"
            >
              <div className="min-w-0">
                <div className="mb-1.5 flex items-center gap-3">
                  <h3 className="font-outfit text-[17px] font-semibold text-[var(--navy)]">{app.licenseType}</h3>
                  <VvStatusBadge status={STATUS_TO_BADGE[app.status] ?? "draft"}>{app.status.replace(/_/g, " ")}</VvStatusBadge>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
                  <span className="font-mono tracking-wide">{app.id}</span>
                  <span>·</span>
                  <span>Updated {safeFormatDate(app.updatedAt, "MMM d, yyyy")}</span>
                  {app.feedback && (
                    <>
                      <span>·</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedFeedback(app.feedback ?? null);
                        }}
                        className="font-medium text-[var(--sky)] hover:underline"
                      >
                        View feedback
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <div className="mb-1.5 flex justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Documents</span>
                  <span className="text-xs font-semibold tabular-nums text-[var(--text-primary)]">
                    {uploaded}/{total}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-[var(--surface)]">
                  <div
                    className={cn("h-full rounded-full", app.status === "approved" ? "bg-[var(--status-ready)]" : "bg-[var(--sky)]")}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="text-right text-xs text-[var(--text-muted)]">
                Submitted
                <br />
                <span className="font-medium text-[var(--text-primary)]">{safeFormatDate(app.submittedAt, "MMM d, yyyy")}</span>
              </div>

              <div className="flex justify-end">
                {app.status === "draft" && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setAppToDelete(app);
                    }}
                    className="mr-2 text-xs font-medium text-[var(--status-missing)] hover:underline"
                  >
                    Delete
                  </button>
                )}
                <ChevronRight className="h-[18px] w-[18px] text-[var(--text-muted)]" />
              </div>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <VvEmptyState
            title="Nothing in this filter"
            sub="Try a different filter, or start a new application."
            action={
              <Link href="/applications/new" className={cn(vvButtonVariants({ variant: "navy" }))}>
                Start new application
              </Link>
            }
          />
        )}
      </div>

      {/* Feedback Dialog */}
      <Dialog open={!!selectedFeedback} onOpenChange={(isOpen) => !isOpen && setSelectedFeedback(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-outfit text-xl font-semibold text-[var(--navy)]">Feedback from reviewer</DialogTitle>
            <DialogDescription className="pt-3 text-[15px] leading-relaxed text-[var(--text-primary)]">
              {selectedFeedback}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <VvButton variant="outline" onClick={() => setSelectedFeedback(null)}>Close</VvButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!appToDelete} onOpenChange={(isOpen) => !isOpen && setAppToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-outfit text-xl font-semibold text-[var(--navy)]">Delete this draft?</AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--text-secondary)]">
              This will permanently delete your draft application for <span className="font-medium text-[var(--text-primary)]">{appToDelete?.licenseType}</span>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={cn(vvButtonVariants({ variant: "outline" }))}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={cn(vvButtonVariants({ variant: "danger" }))}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}
