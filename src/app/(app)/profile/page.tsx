
'use client';

import { useUser, useFirestore } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileClient } from "./_components/ProfileClient";
import { PageTransition } from "@/components/PageTransition";
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where } from 'firebase/firestore';
import type { UserProfile, Application } from "@/types";

export default function ProfilePage() {
  const { user, claims } = useUser();
  const firestore = useFirestore();

  // Fetch applications to calculate total flight hours
  const [applicationsSnapshot, loading, error] = useCollection(
    user ? query(collection(firestore, 'applications'), where('userId', '==', user.uid)) : null
  );

  if (!user || loading) {
    return (
      <>
        <div className="mb-8">
          <Skeleton className="mb-3 h-8 w-24" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="rounded-xl border border-[var(--vv-border)] bg-white p-8">
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-[var(--vv-border)]">
            <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-8 h-9 w-28 rounded-lg" />
        </div>
      </>
    );
  }

  if (error) {
      // You can return a proper error component here
      return <p>Error loading applications.</p>
  }
  
  const applications = applicationsSnapshot?.docs.map(doc => doc.data()) || [];

  return <PageTransition><ProfileClient user={user} claims={claims as UserProfile | null} applications={applications as Application[]} /></PageTransition>;
}
