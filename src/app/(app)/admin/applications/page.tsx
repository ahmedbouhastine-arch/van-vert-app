
'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useFirestore } from "@/firebase";
import Link from 'next/link';
import { useState, useMemo } from 'react';
import type { Application, UserProfile } from '@/types';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/StatusBadge';
import { ChevronRight, FileText, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PageTransition } from "@/components/PageTransition";

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
        "bg-muted/30 border rounded-lg p-4 flex items-center gap-4 transition-all duration-200 group relative overflow-hidden",
        "hover:bg-muted/50 hover:shadow-md",
        isDraft ? "border-amber-200/40 hover:border-amber-300/60" : "border-border/40 hover:border-border/60"
      )}>
        <div className={cn(
          "absolute left-0 top-0 h-full w-1.5 transition-all duration-300",
          isDraft ? "bg-amber-400" : "bg-primary/20",
          "group-hover:w-2",
          isDraft ? "group-hover:bg-amber-500" : "group-hover:bg-primary"
        )}></div>
        
        <Avatar className="h-10 w-10 border ml-3">
          <AvatarImage src={user?.photoURL} alt={user?.displayName || 'User'} />
          <AvatarFallback className="bg-primary/10 text-primary">{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
             <p className="font-semibold text-foreground truncate">{user?.displayName || 'Unknown Applicant'}</p>
             {isDraft && <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-200">DRAFT</Badge>}
          </div>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
        </div>

        <div className="hidden md:flex flex-col items-end text-right">
            <p className="text-xs text-muted-foreground">Total Hours</p>
            <p className="font-mono text-sm font-medium">{totalHours.toFixed(1)}h</p>
        </div>

        <div className="hidden sm:flex flex-col items-end text-right">
            <p className="text-xs text-muted-foreground">Last Updated</p>
            <p className="text-sm font-medium">{lastUpdated}</p>
        </div>

        <div className="w-[120px] text-right">
            <StatusBadge status={application.status} />
        </div>
        
        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
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
                <div key={i} className="bg-muted/30 border rounded-lg p-4 h-20 animate-pulse"></div>
            ))}
        </div>
    }
    if (error) return <p className="text-red-500 text-sm">Error: {error.message}</p>;
    if (apps.length === 0) {
        return <div className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mb-3" />
            <h3 className="font-semibold text-lg">No applications found</h3>
            <p className="text-sm mt-1">There are no applications in this category that match your search.</p>
        </div>
    }
    return <div className="space-y-3">
        {apps.map(app => (
            <ApplicationCard key={app.id} application={app} user={usersMap.get(app.userId)} />
        ))}
    </div>;
  };

  return (
    <PageTransition className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-1">Applications</h1>
            <p className="text-muted-foreground">Review and manage all submitted pilot applications.</p>
            <div className="relative mt-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Search by name or email..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        
        <div className="space-y-10">
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-semibold">Submitted Applications</h2>
                    {!loading && <Badge variant="secondary">{submittedApps.length}</Badge>}
                </div>
                {renderAppList(submittedApps, loading || usersLoading, error || usersError)}
            </div>

            <div>
                <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-semibold">Draft Applications</h2>
                    {!loading && <Badge variant="secondary">{draftApps.length}</Badge>}
                </div>
                {renderAppList(draftApps, loading || usersLoading, error || usersError)}
            </div>
        </div>
    </PageTransition>
  );
}

export default AdminApplicationsPage;
