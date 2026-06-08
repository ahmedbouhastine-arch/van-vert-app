'use client';
export const dynamic = 'force-dynamic';

import { notFound, useParams, redirect } from "next/navigation";
import { AdminApplicationClient } from "./_components/AdminApplicationClient";
import { useFirestore, useDoc, useUser, useMemoFirebase } from "@/firebase";
import { doc, DocumentReference, DocumentData } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import type { Application, UserProfile } from "@/types";
import React from "react";
import { PageTransition } from "@/components/PageTransition";
import { VvPageHeader } from "@/components/vv/VvPageHeader";

/* ── Skeleton ──────────────────────────────────────────────────────── */

function ApplicationDetailSkeleton() {
  return (
    <PageTransition className="flex flex-col gap-4">
      <div className="mb-4 space-y-2.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-80 max-w-full" />
        <Skeleton className="h-4 w-[28rem] max-w-full" />
      </div>

      {/* Hero */}
      <div className="overflow-hidden rounded-xl border border-[var(--vv-border)] bg-white p-7">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3.5 w-64 max-w-full" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-10 w-full max-w-sm rounded-lg" />
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-4 rounded-xl border border-[var(--vv-border)] bg-white p-6">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-[var(--vv-border)] bg-white p-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}

function AuthorizedApplicationDetail({ id, claims, isAuthorized }: { id: string, claims?: { role?: string | null }, isAuthorized: boolean }) {
  const firestore = useFirestore();

  const appRef = useMemoFirebase(() => {
      if (firestore && id && isAuthorized) {
          return doc(firestore, 'applications', id) as DocumentReference<DocumentData>;
      }
      return null;
  }, [firestore, id, isAuthorized]);
  
  const { data: application, isLoading: appLoading } = useDoc<Application>(appRef);

  const userRef = useMemoFirebase(() => 
      firestore && application && isAuthorized ? doc(firestore, 'users', application.userId) as DocumentReference<DocumentData> : null,
      [firestore, application, isAuthorized]
  );
  const { data: user, isLoading: userLoading } = useDoc<UserProfile>(userRef);


  if ((appLoading || userLoading) && isAuthorized) {
      return <ApplicationDetailSkeleton />
  }

  if (!application && isAuthorized) {
      notFound();
      return null;
  }
  
  if (!application) {
    return <div className="p-8 text-center text-[var(--text-muted)]">You do not have permission to view this page.</div>;
  }

  return (
      <PageTransition className="flex flex-col gap-4">
          <VvPageHeader
            kicker="Review"
            title="Review application"
            sub={`Reviewing ${user?.displayName ?? "the applicant"}'s application for ${application.licenseType}.`}
          />
          <AdminApplicationClient application={application} user={user ?? undefined} claims={claims} />
      </PageTransition>
  )
}


export default function AdminApplicationDetailPage() {
  const { claims, loading: claimsLoading } = useUser();
  const params = useParams<{ id: string }>();

  if (claimsLoading) {
    return <ApplicationDetailSkeleton />
  }

  const isAuthorized = !!(claims?.role && ['reviewer', 'admin', 'head-admin'].includes(claims.role));
  
  if (!isAuthorized) {
      redirect('/dashboard');
  }
  
  return <AuthorizedApplicationDetail id={params.id} claims={claims} isAuthorized={isAuthorized} />;
}
