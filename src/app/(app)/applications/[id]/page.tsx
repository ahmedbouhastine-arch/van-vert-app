'use client';
import { notFound, useParams } from "next/navigation";
import { ApplicationClient } from "./_components/ApplicationClient";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { LoadingScreen } from "@/components/LoadingScreen";
import type { Application } from "@/types";

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const firestore = useFirestore();

  const appRef = useMemoFirebase(() => 
    firestore && params.id ? doc(firestore, 'applications', params.id) as any : null,
    [firestore, params.id]
  );
  
  const { data: application, isLoading: appLoading } = useDoc<Application>(appRef);

  if (appLoading) {
    return <LoadingScreen text="Loading application..." />
  }

  if (!application) {
    notFound();
    return null;
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
