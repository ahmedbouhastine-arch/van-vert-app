'use client';

import { applications } from "@/lib/data";
import { notFound } from "next/navigation";
import { AdminApplicationClient } from "./_components/AdminApplicationClient";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { LoadingScreen } from "@/components/LoadingScreen";
import { use, useMemo } from "react";

export default function AdminApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const resolvedParams = use(params);
  const application = applications.find((app) => app.id === resolvedParams.id);
  
  if (!application) {
    notFound();
  }

  const firestore = useFirestore();
  const userRef = useMemo(() => 
    firestore ? doc(firestore, 'users', application.userId) : null,
    [firestore, application.userId]
  );
  const { data: user, loading } = useDoc(userRef);

  if (loading) {
    return <LoadingScreen text="Loading user..." />
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
        <AdminApplicationClient application={application} user={user} />
    </div>
  );
}
