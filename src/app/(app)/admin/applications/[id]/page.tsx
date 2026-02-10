'use client';

import { notFound, useParams, redirect } from "next/navigation";
import { AdminApplicationClient } from "./_components/AdminApplicationClient";
import { useFirestore, useDoc, useUser, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { LoadingScreen } from "@/components/LoadingScreen";
import type { Application, UserProfile } from "@/types";
import React from "react";
import { mockApplications, mockUsers } from "@/lib/mock-data";


function AuthorizedApplicationDetail({ id, claims }: { id: string, claims: any }) {
  const firestore = useFirestore();
  const isMock = id.startsWith('mock-');

  let application: Application | undefined | null = undefined;
  let user: UserProfile | undefined | null = undefined;
  let appLoading: boolean = false;
  let userLoading: boolean = false;

  // Use mock data if the ID indicates it's a mock application
  if (isMock) {
      application = mockApplications.find(app => app.id === id);
      if (application) {
          user = mockUsers[application.userId];
      }
  } 
  
  const appRef = useMemoFirebase(() => {
      if (!isMock && firestore && id) {
          return doc(firestore, 'applications', id) as any;
      }
      return null;
  }, [firestore, id, isMock]);
  
  const { data: liveApplication, loading: liveAppLoading } = useDoc<Application>(appRef);

  const userRef = useMemoFirebase(() => 
      !isMock && firestore && liveApplication ? doc(firestore, 'users', liveApplication.userId) as any : null,
      [firestore, liveApplication, isMock]
  );
  const { data: liveUser, loading: liveUserLoading } = useDoc<UserProfile>(userRef);

  if (!isMock) {
      application = liveApplication;
      user = liveUser;
      appLoading = liveAppLoading;
      userLoading = liveUserLoading;
  }

  if (appLoading || userLoading) {
      return <LoadingScreen text="Loading application data..." />
  }

  if (!application) {
      notFound();
      return null;
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
  const { claims, loading: claimsLoading } = useUser();
  const params = useParams<{ id: string }>();

  if (claimsLoading) {
    return <LoadingScreen text="Verifying Access..." />
  }

  const isAuthorized = claims?.role && ['reviewer', 'admin', 'head-admin'].includes(claims.role);
  
  if (!isAuthorized) {
      redirect('/dashboard');
      return null;
  }
  
  return <AuthorizedApplicationDetail id={params.id} claims={claims} />;
}
