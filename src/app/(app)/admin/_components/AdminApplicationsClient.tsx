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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function ApplicationCard({ application, user }: { application: Application, user?: UserProfile }) {
  const isDraft = application.status === 'draft';
  const lastUpdated = application.updatedAt?.toDate() 
    ? formatDistanceToNow(application.updatedAt.toDate(), { addSuffix: true })
    : 'N/A';
  const totalHours = application.flightLogs?.reduce((sum, log) => sum + log.duration, 0) || 0;
  
  return (
    <Link href={`/admin/applications/${application.id}`}>
      <div className={cn(
        "bg-muted/30 border rounded-lg p-3 flex items-center gap-3 transition-all duration-200 group relative overflow-hidden",
        "hover:bg-muted/50 hover:shadow-md",
        isDraft ? "border-amber-200/40 hover:border-amber-300/60" : "border-border/40 hover:border-border/60"
      )}>
        <div className={cn(
          "absolute left-0 top-0 h-full w-1.5 transition-all duration-300",
          isDraft ? "bg-amber-400" : "bg-primary/20",
          "group-hover:w-2",
          isDraft ? "group-hover:bg-amber-500" : "group-hover:bg-primary"
        )}></div>
        
        <Avatar className="h-8 w-8 border ml-2">
          <AvatarImage src={user?.photoURL} alt={user?.displayName || 'User'} />
          <AvatarFallback className="bg-primary/10 text-primary">{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
             <p className="font-semibold text-sm text-foreground truncate">{user?.displayName || 'Unknown Applicant'}</p>
             {isDraft && <Badge variant="outline" className="text-xs px-1 py-0 bg-amber-100 text-amber-800 border-amber-200">DRAFT</Badge>}
          </div>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>

        <div className="hidden lg:flex flex-col items-end text-right">
            <p className="text-[10px] text-muted-foreground">Hours</p>
            <p className="font-mono text-xs font-medium">{totalHours.toFixed(1)}h</p>
        </div>

        <div className="w-[100px] text-right">
            <StatusBadge status={application.status} />
        </div>
        
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
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
                <div key={i} className="bg-muted/30 border rounded-lg p-3 h-16 animate-pulse"></div>
            ))}
        </div>
    }
    if (errorText) return <p className="text-red-500 text-sm">Error: {errorText}</p>;
    if (apps.length === 0) {
        return <div className="border border-dashed rounded-lg flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
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
    <Card className="flex flex-col h-full border-none shadow-none md:border md:shadow-sm bg-transparent md:bg-card">
      <CardHeader className="px-0 md:px-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Applications to Review</CardTitle>
          <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                  placeholder="Search name or email..." 
                  className="pl-8 h-9 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 md:px-6 flex-1 flex flex-col gap-6">
        <div>
            <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-muted-foreground">SUBMITTED & REVIEWING</h3>
                {!loading && <Badge variant="secondary" className="text-xs">{submittedApps.length}</Badge>}
            </div>
            {renderAppList(submittedApps, loading || usersLoading, (error || usersError)?.message)}
        </div>

        <div>
            <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-muted-foreground">DRAFTS</h3>
                {!loading && <Badge variant="secondary" className="text-xs">{draftApps.length}</Badge>}
            </div>
            {renderAppList(draftApps, loading || usersLoading, (error || usersError)?.message)}
        </div>
      </CardContent>
    </Card>
  );
}
