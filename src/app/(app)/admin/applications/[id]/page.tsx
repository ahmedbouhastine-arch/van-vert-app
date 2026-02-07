
'use client';

import { notFound, useParams, useRouter } from "next/navigation";
import { AdminApplicationClient } from "./_components/AdminApplicationClient";
import { useFirestore, useDoc, useUser, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { LoadingScreen } from "@/components/LoadingScreen";
import type { Application, UserProfile } from "@/types";
import React from "react";

function AdminApplicationDetailContent() {
    const params = useParams<{ id: string }>();
    const firestore = useFirestore();
    const { claims } = useUser(); // We know claims exist from the parent

    const appRef = useMemoFirebase(() => {
        // Only create the reference if authorized.
        const isAuthorized = claims?.role && ['reviewer', 'admin', 'head-admin'].includes(claims.role);
        if (!firestore || !params.id || !isAuthorized) return null;
        return doc(firestore, 'applications', params.id) as any;
    }, [firestore, params.id, claims]);
    
    const { data: application, loading: appLoading } = useDoc<Application>(appRef);

    const userRef = useMemoFirebase(() => 
        firestore && application?.userId ? doc(firestore, 'users', application.userId) as any : null,
        [firestore, application]
    );
    const { data: user, loading: userLoading } = useDoc<UserProfile>(userRef);

    if (appLoading || userLoading) {
        return <LoadingScreen text="Loading application data..." />
    }

    if (!application) {
        // This can happen if the doc doesn't exist or if the query was not run due to permissions.
        // The parent component should have already redirected, but this is a safe fallback.
        notFound();
    }
    
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold font-headline tracking-tight">
                    Review Application
                </h1>
                <p className="text-muted-foreground">
                    Reviewing {user?.displayName}'s application for {application.licenseType}.
                </p>
            </div>
            <AdminApplicationClient application={application} user={user} claims={claims} />
        </div>
    )
}

function RedirectToDashboard() {
  const router = useRouter();
  React.useEffect(() => {
    router.push('/dashboard');
  }, [router]);
  return <LoadingScreen text="Access Denied. Redirecting..." />;
}


export default function AdminApplicationDetailPage() {
  const { claims, loading: claimsLoading } = useUser();

  if (claimsLoading) {
    return <LoadingScreen text="Verifying Access..." />
  }

  // Render content only if authorized, otherwise redirect. This prevents child components
  // from attempting to fetch data before the authorization check is complete.
  const isAuthorized = claims?.role && ['reviewer', 'admin', 'head-admin'].includes(claims.role);
  
  return isAuthorized ? <AdminApplicationDetailContent /> : <RedirectToDashboard />;
}
