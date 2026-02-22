
'use client';

import { notFound, useParams, redirect } from "next/navigation";
import { AdminApplicationClient } from "./_components/AdminApplicationClient";
import { useFirestore, useDoc, useUser, useMemoFirebase } from "@/firebase";
import { doc, DocumentReference, DocumentData } from "firebase/firestore";
import { LoadingScreen } from "@/components/LoadingScreen";
import type { Application, UserProfile } from "@/types";
import React from "react";


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
      return <LoadingScreen text="Loading application data..." />
  }

  if (!application && isAuthorized) {
      notFound();
      return null;
  }
  
  if (!application) {
    return <div className="text-center text-muted-foreground p-8">You do not have permission to view this page.</div>;
  }
  
  return (
      <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold font-headline tracking-tight">
                  Review Application
              </h1>
              <p className="text-muted-foreground">
                  Reviewing {user?.displayName}&apos;s application for {application.licenseType}.
              </p>
          </div>
          <AdminApplicationClient application={application} user={user ?? undefined} claims={claims} />
      </div>
  )
}


export default function AdminApplicationDetailPage() {
  const { claims, loading: claimsLoading } = useUser();
  const params = useParams<{ id: string }>();

  if (claimsLoading) {
    return <LoadingScreen text="Verifying Access..." />
  }

  const isAuthorized = !!(claims?.role && ['reviewer', 'admin', 'head-admin'].includes(claims.role));
  
  if (!isAuthorized) {
      redirect('/dashboard');
  }
  
  return <AuthorizedApplicationDetail id={params.id} claims={claims} isAuthorized={isAuthorized} />;
}
