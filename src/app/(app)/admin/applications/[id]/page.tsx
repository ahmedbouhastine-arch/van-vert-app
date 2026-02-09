'use client';

import { notFound, useParams, useRouter } from "next/navigation";
import { AdminApplicationClient } from "./_components/AdminApplicationClient";
import { useFirestore, useDoc, useUser, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { LoadingScreen } from "@/components/LoadingScreen";
import type { Application, UserProfile } from "@/types";
import React from "react";
import { mockApplications } from "@/lib/mock-data";

function AdminApplicationDetailContent() {
    const params = useParams<{ id: string }>();
    const firestore = useFirestore();
    const { claims } = useUser();
    const isMock = params.id.startsWith('mock-');

    // --- Data fetching logic ---
    let application: Application | undefined | null = undefined;
    let user: UserProfile | undefined | null = undefined;
    let appLoading: boolean = false;
    let userLoading: boolean = false;

    // Use mock data if the ID indicates it's a mock application
    if (isMock) {
        application = mockApplications.find(app => app.id === params.id);
        user = application ? (application as any).user : undefined;
    } 
    
    // --- Firestore hooks for live data (will only run if not a mock) ---
    const appRef = useMemoFirebase(() => {
        const isAuthorized = claims?.role && ['reviewer', 'admin', 'head-admin'].includes(claims.role);
        if (!isMock && firestore && params.id && isAuthorized) {
            return doc(firestore, 'applications', params.id) as any;
        }
        return null;
    }, [firestore, params.id, claims?.role, isMock]);
    
    const { data: liveApplication, loading: liveAppLoading } = useDoc<Application>(appRef);

    const userRef = useMemoFirebase(() => 
        !isMock && firestore && liveApplication ? doc(firestore, 'users', liveApplication.userId) as any : null,
        [firestore, liveApplication, isMock]
    );
    const { data: liveUser, loading: liveUserLoading } = useDoc<UserProfile>(userRef);

    // --- Assign live data if not in mock mode ---
    if (!isMock) {
        application = liveApplication;
        user = liveUser;
        appLoading = liveAppLoading;
        userLoading = liveUserLoading;
    }
    // --- End data fetching logic ---

    if (appLoading || userLoading) {
        return <LoadingScreen text="Loading application data..." />
    }

    if (!application) {
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
