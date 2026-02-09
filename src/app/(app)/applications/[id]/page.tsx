
'use client';

import { notFound, useParams } from "next/navigation";
import { ApplicationClient } from "./_components/ApplicationClient";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { LoadingScreen } from "@/components/LoadingScreen";
import type { Application } from "@/types";
import { mockApplications } from "@/lib/mock-data";

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const firestore = useFirestore();
  const isMock = params.id.startsWith('mock-');

  // --- Data fetching logic ---
  let application: Application | undefined | null = undefined;
  let appLoading: boolean = false;

  // Use mock data if the ID indicates it's a mock application
  if (isMock) {
    // The mock data includes the user profile, but ApplicationClient doesn't need it.
    // We just need to find the right application.
    application = mockApplications.find(app => app.id === params.id);
  }

  // --- Firestore hooks for live data (will only run if not a mock) ---
  const appRef = useMemoFirebase(() => 
    !isMock && firestore && params.id ? doc(firestore, 'applications', params.id) as any : null,
    [firestore, params.id, isMock]
  );
  
  const { data: liveApplication, loading: liveAppLoading } = useDoc<Application>(appRef);

  // --- Assign live data if not in mock mode ---
  if (!isMock) {
    application = liveApplication;
    appLoading = liveAppLoading;
  }
  // --- End data fetching logic ---

  if (appLoading) {
    return <LoadingScreen text="Loading application..." />
  }

  if (!application) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold font-headline tracking-tight">
                Application Details
            </h1>
            <p className="text-muted-foreground">
                Manage your application for the {application.licenseType}.
            </p>
        </div>
      <ApplicationClient application={application} />
    </div>
  );
}
