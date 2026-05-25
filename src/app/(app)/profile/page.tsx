
'use client';

import { useUser, useFirestore } from "@/firebase";
import { LoadingScreen } from "@/components/LoadingScreen";
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
    return <LoadingScreen />;
  }

  if (error) {
      // You can return a proper error component here
      return <p>Error loading applications.</p>
  }
  
  const applications = applicationsSnapshot?.docs.map(doc => doc.data()) || [];

  return <PageTransition><ProfileClient user={user} claims={claims as UserProfile | null} applications={applications as Application[]} /></PageTransition>;
}
