'use client';

import { notFound, useParams } from "next/navigation";
import { AdminApplicationClient } from "./_components/AdminApplicationClient";
import { useFirestore, useDoc, useUser, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { LoadingScreen } from "@/components/LoadingScreen";
import type { Application, UserProfile } from "@/types";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";


function AdminApplicationDetailContent() {
    const params = useParams<{ id: string }>();
    const firestore = useFirestore();
    const { claims } = useUser(); // We know claims exist from the parent

    const appRef = useMemoFirebase(() => 
        firestore && params.id ? doc(firestore, 'applications', params.id) as any : null,
        [firestore, params.id]
    );
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

export default function AdminApplicationDetailPage() {
  const router = useRouter();
  const { claims, loading: claimsLoading } = useUser();

  const isAuthorized = useMemo(() => 
    claims?.role && ['reviewer', 'admin', 'head-admin'].includes(claims.role),
    [claims]
  );

  useEffect(() => {
    if (!claimsLoading && !isAuthorized) {
        router.push('/dashboard');
    }
  }, [claimsLoading, isAuthorized, router]);

  if (claimsLoading || !isAuthorized) {
    return <LoadingScreen text="Verifying Access..." />
  }

  return <AdminApplicationDetailContent />;
}
