'use client';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useFirestore } from "@/firebase";
import Link from 'next/link';
import { useState, useMemo } from 'react';
import type { Application, UserProfile } from '@/types';
import { VvAvatar } from '@/components/vv/VvAvatar';
import { VvStatusBadge as StatusBadge, type VvStatusBadgeProps } from '@/components/vv/VvStatusBadge';
import { ChevronRight, FileText, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const APP_STATUS_TO_BADGE: Record<Application["status"], NonNullable<VvStatusBadgeProps["status"]>> = {
  draft: "draft",
  submitted: "submitted",
  in_review: "in-review",
  needs_attention: "needs-attention",
  approved: "ready",
  rejected: "missing",
};

function ApplicationCard({ application, user }: { application: Application, user?: UserProfile }) {
  const isDraft = application.status === 'draft';
  const totalHours = application.flightLogs?.reduce((sum, log) => sum + log.duration, 0) || 0;

  return (
    <Link href={`/admin/applications/${application.id}`}>
      <div className="rounded-xl border border-[var(--vv-border)] bg-white p-4 flex items-center gap-3 transition-colors hover:bg-[var(--surface)]">
        <VvAvatar name={user?.displayName || 'U'} size={32} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
             <p className="font-semibold text-sm text-[var(--text-primary)] truncate">{user?.displayName || 'Unknown Applicant'}</p>
             {isDraft && (
               <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">DRAFT</span>
             )}
          </div>
          <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
        </div>

        <div className="hidden lg:flex flex-col items-end text-right">
            <p className="text-[10px] text-[var(--text-muted)]">Hours</p>
            <p className="font-mono text-xs font-medium text-[var(--text-primary)]">{totalHours.toFixed(1)}h</p>
        </div>

        <div className="w-[100px] text-right">
            <StatusBadge status={APP_STATUS_TO_BADGE[application.status]} />
        </div>

        <ChevronRight className="h-4 w-4 text-[var(--text-muted)] transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export function AdminApplicationsClient() {
  const firestore = useFirestore();
  const applicationsRef = collection(firestore, 'applications');

  const [searchTerm, setSearchTerm] = useState('');

  const [applicationsSnapshot, loading, error] = useCollection(
    query(applicationsRef, orderBy('updatedAt', 'desc'))
  );
  const [usersSnapshot, usersLoading, usersError] = useCollection(collection(firestore, 'users'));

  const usersMap = useMemo(() => {
    if (!usersSnapshot) return new Map<string, UserProfile>();
    const map = new Map<string, UserProfile>();
    usersSnapshot.docs.forEach(doc => map.set(doc.id, doc.data() as UserProfile));
    return map;
  }, [usersSnapshot]);

  const { submittedApps, draftApps } = useMemo(() => {
    if (!applicationsSnapshot) return { submittedApps: [], draftApps: [] };

    const allApps = applicationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));

    const filteredApps = allApps.filter(app => {
        const user = usersMap.get(app.userId);
        const name = user?.displayName?.toLowerCase() || '';
        const email = user?.email?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        return name.includes(search) || email.includes(search);
    });

    return {
        submittedApps: filteredApps.filter(app => app.status !== 'draft'),
        draftApps: filteredApps.filter(app => app.status === 'draft'),
    };
  }, [applicationsSnapshot, usersMap, searchTerm]);

  const renderAppList = (apps: Application[], isLoading: boolean, errorText?: string) => {
    if (isLoading) {
        return <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl border border-[var(--vv-border)] bg-white p-4 h-16 animate-pulse"></div>
            ))}
        </div>
    }
    if (errorText) return <p className="text-red-500 text-sm">Error: {errorText}</p>;
    if (apps.length === 0) {
        return <div className="border border-dashed border-[var(--vv-border)] rounded-xl flex flex-col items-center justify-center p-6 text-center text-[var(--text-muted)]">
            <FileText className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No applications found.</p>
        </div>
    }
    return <div className="space-y-2">
        {apps.map(app => (
            <ApplicationCard key={app.id} application={app} user={usersMap.get(app.userId)} />
        ))}
    </div>;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-outfit text-lg font-semibold text-[var(--navy)]">
          Applications to Review
        </h2>
        <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
                placeholder="Search name or email..."
                className="w-full rounded-lg border border-[var(--vv-border)] bg-[var(--surface)]
                           py-2 pl-9 pr-4 font-inter text-[13px] text-[var(--text-primary)]
                           outline-none placeholder:text-[var(--text-muted)]
                           focus:border-[var(--sky)] focus:bg-white
                           focus:shadow-[0_0_0_4px_rgba(0,120,165,0.08)]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      <div>
          <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-[var(--text-muted)]">SUBMITTED & REVIEWING</h3>
              {!loading && (
                <span className="rounded-full bg-[var(--sky-pale)] px-2 py-0.5 font-inter text-[11px] font-semibold text-[var(--sky)]">
                  {submittedApps.length}
                </span>
              )}
          </div>
          {renderAppList(submittedApps, loading || usersLoading, (error || usersError)?.message)}
      </div>

      <div>
          <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-[var(--text-muted)]">DRAFTS</h3>
              {!loading && (
                <span className="rounded-full bg-[var(--sky-pale)] px-2 py-0.5 font-inter text-[11px] font-semibold text-[var(--sky)]">
                  {draftApps.length}
                </span>
              )}
          </div>
          {renderAppList(draftApps, loading || usersLoading, (error || usersError)?.message)}
      </div>
    </div>
  );
}
