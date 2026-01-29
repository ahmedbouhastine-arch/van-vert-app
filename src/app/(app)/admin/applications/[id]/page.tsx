
'use client';

import { applications } from "@/lib/data";
import { notFound } from "next/navigation";
import { AdminApplicationClient } from "./_components/AdminApplicationClient";
import { useFirestore, useDoc, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useMemo } from "react";

export default function AdminApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const application = applications.find((app) => app.id === params.id);
  
  if (!application) {
    notFound();
  }

  const firestore = useFirestore();
  const { claims, loading: claimsLoading } = useUser();

  const userRef = useMemo(() => 
    firestore ? doc(firestore, 'users', application.userId) : null,
    [firestore, application.userId]
  );
  const { data: user, loading: userLoading } = useDoc(userRef);

  if (userLoading || claimsLoading) {
    return <LoadingScreen text="Loading application data..." />
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
  );
}
