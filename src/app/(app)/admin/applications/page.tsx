
'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useFirestore } from "@/firebase";
import Link from 'next/link';
import { useState, useMemo } from 'react';
import type { Application, UserProfile } from '@/types';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronRight, FileText, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { PageTransition } from "@/components/PageTransition";
import { VvPageHeader } from "@/components/vv/VvPageHeader";
import { VvStatusBadge, type VvStatusBadgeProps } from "@/components/vv/VvStatusBadge";

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

// A new component for a single application card
function ApplicationCard({ application, user }: { application: Application, user?: UserProfile }) {
  const isDraft = application.status === 'draft';
  const lastUpdated = application.updatedAt?.toDate()
    ? formatDistanceToNow(application.updatedAt.toDate(), { addSuffix: true })
    : 'N/A';
  const totalHours = application.flightLogs?.reduce((sum, log) => sum + log.duration, 0) || 0;

  return (
    <Link href={`/admin/applications/${application.id}`}>
      <div className={cn(
        "group relative flex items-center gap-4 overflow-hidden rounded-lg border bg-white p-4 transition-colors",
        isDraft ? "border-[var(--status-attention)]/30 hover:border-[var(--status-attention)]/60" : "border-[var(--vv-border)] hover:border-[var(--sky)]"
      )}>
        <div className={cn(
          "absolute left-0 top-0 h-full w-1.5 transition-all",
          isDraft ? "bg-[var(--status-attention)]/40 group-hover:bg-[var(--status-attention)]" : "bg-[var(--sky)]/20 group-hover:bg-[var(--sky)]"
        )}></div>

        <Avatar className="ml-3 h-10 w-10 border border-[var(--vv-border)]">
          <AvatarImage src={user?.photoURL} alt={user?.displayName || 'User'} />
          <AvatarFallback className="bg-[var(--sky-pale)] text-[var(--sky)]">{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
             <p className="truncate font-outfit text-sm font-semibold text-[var(--navy)]">{user?.displayName || 'Unknown Applicant'}</p>
             {isDraft && <span className="rounded-full border border-[var(--status-attention)]/30 bg-[var(--status-attention)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--status-attention)]">Draft</span>}
          </div>
          <p className="truncate text-sm text-[var(--text-muted)]">{user?.email}</p>
        </div>

        <div className="hidden flex-col items-end text-right md:flex">
            <p className="text-xs text-[var(--text-muted)]">Total hours</p>
            <p className="font-mono text-sm font-medium text-[var(--navy)]">{totalHours.toFixed(1)}h</p>
        </div>

        <div className="hidden flex-col items-end text-right sm:flex">
            <p className="text-xs text-[var(--text-muted)]">Last updated</p>
            <p className="text-sm font-medium text-[var(--text-secondary)]">{lastUpdated}</p>
        </div>

        <div className="w-[140px] text-right">
            <VvStatusBadge status={APP_STATUS_TO_BADGE[application.status]}>{APP_STATUS_LABEL[application.status]}</VvStatusBadge>
        </div>

        <ChevronRight className="h-5 w-5 text-[var(--text-muted)] transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}


function AdminApplicationsPage() {
  const firestore = useFirestore();
  const applicationsRef = collection(firestore, 'applications');
  
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all applications and all users
  const [applicationsSnapshot, loading, error] = useCollection(
    query(applicationsRef, orderBy('updatedAt', 'desc'))
  );
  const [usersSnapshot, usersLoading, usersError] = useCollection(collection(firestore, 'users'));

  // Create a map of userId -> UserProfile for easy lookup
  const usersMap = useMemo(() => {
    if (!usersSnapshot) return new Map<string, UserProfile>();
    const map = new Map<string, UserProfile>();
    usersSnapshot.docs.forEach(doc => map.set(doc.id, doc.data() as UserProfile));
    return map;
  }, [usersSnapshot]);

  // Process and filter applications
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

  const renderAppList = (apps: Application[], isLoading: boolean, error?: Error) => {
    if (isLoading) {
        return <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg border border-[var(--vv-border)] bg-[var(--surface)]"></div>
            ))}
        </div>
    }
    if (error) return <p className="text-sm text-[var(--status-missing)]">Error: {error.message}</p>;
    if (apps.length === 0) {
        return <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--vv-border)] p-12 text-center text-[var(--text-muted)]">
            <FileText className="mb-3 h-10 w-10" />
            <h3 className="font-outfit text-lg font-semibold text-[var(--navy)]">No applications found</h3>
            <p className="mt-1 text-sm">There are no applications in this category that match your search.</p>
        </div>
    }
    return <div className="space-y-3">
        {apps.map(app => (
            <ApplicationCard key={app.id} application={app} user={usersMap.get(app.userId)} />
        ))}
    </div>;
  };

  return (
    <PageTransition>
        <VvPageHeader
          kicker="Operations"
          title="Applications"
          sub="Review and manage all submitted pilot applications."
        />

        <div className="relative mb-8 -mt-2 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
                placeholder="Search by name or email..."
                className="rounded-lg border-[var(--vv-border)] pl-10 focus-visible:ring-[var(--sky)]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <div className="space-y-10">
            <div>
                <div className="mb-4 flex items-center gap-3">
                    <h2 className="font-outfit text-lg font-semibold text-[var(--navy)]">Submitted applications</h2>
                    {!loading && <span className="rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-secondary)]">{submittedApps.length}</span>}
                </div>
                {renderAppList(submittedApps, loading || usersLoading, error || usersError)}
            </div>

            <div>
                <div className="mb-4 flex items-center gap-3">
                    <h2 className="font-outfit text-lg font-semibold text-[var(--navy)]">Draft applications</h2>
                    {!loading && <span className="rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-secondary)]">{draftApps.length}</span>}
                </div>
                {renderAppList(draftApps, loading || usersLoading, error || usersError)}
            </div>
        </div>
    </PageTransition>
  );
}

export default AdminApplicationsPage;
