'use client';
import Link from "next/link";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, FileText, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import type { Application } from "@/types";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PageTransition } from "@/components/PageTransition";

export default function DashboardPage() {
  const { user, claims, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && claims && ['reviewer', 'admin', 'head-admin'].includes(claims.role)) {
      router.push('/admin');
    }
  }, [userLoading, claims, router]);

  const userApplicationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "applications"), where("userId", "==", user.uid), orderBy("updatedAt", "desc"));
  }, [firestore, user]);

  const { data: userApplications, isLoading: appsLoading } = useCollection<Application>(userApplicationsQuery);
  
  const isLoading = userLoading || appsLoading;

  if (userLoading || (claims && ['reviewer', 'admin', 'head-admin'].includes(claims.role))) {
    return <LoadingScreen text="Loading dashboard..." />;
  }

  return (
    <PageTransition className="flex flex-col gap-6">
      <div className="flex items-center">
        <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold font-headline tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back. Start a new application or explore the community.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
          {/* Left Column: Applications Preview */}
          <Link href="/applications" className="group h-full">
            <Card className="h-full flex flex-col justify-between transition-all hover:bg-muted/50 hover:border-primary/50 relative overflow-hidden">
                <div className="absolute right-[-10%] top-[-10%] opacity-5 text-primary pointer-events-none transition-transform group-hover:scale-110 duration-500">
                    <FileText size={200} />
                </div>
                <div>
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        My Applications
                    </CardTitle>
                    <CardDescription>
                        Track the status of your pilot license conversions.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <p className="text-sm text-muted-foreground">Loading status...</p>
                        ) : (
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-bold font-headline leading-none text-foreground">{userApplications?.length || 0}</span>
                                <span className="text-sm text-muted-foreground pb-1">total applications</span>
                            </div>
                        )}
                    </CardContent>
                </div>
                <div className="px-6 pb-6 pt-2 flex items-center text-sm font-medium text-primary">
                    View all applications
                    <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
            </Card>
          </Link>

          {/* Right Column: Community UI Preview */}
          <Link href="/community" className="group h-full">
            <Card className="h-full flex flex-col justify-between transition-all hover:bg-muted/50 hover:border-blue-500/50 relative overflow-hidden">
                 <div className="absolute right-[-10%] top-[-10%] opacity-5 text-blue-500 pointer-events-none transition-transform group-hover:scale-110 duration-500">
                    <Users size={200} />
                </div>
                <div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            Community & Resources
                        </CardTitle>
                        <CardDescription>
                            Review SOPs, find FAQ answers, and see global pilot stats.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-[85%]">
                            Join hundreds of other pilots navigating the conversion process. Ensure your documents meet the rigorous standards outlined in our updated standard operating procedures.
                        </p>
                    </CardContent>
                </div>
                <div className="px-6 pb-6 pt-2 flex items-center text-sm font-medium text-blue-500">
                    Explore the community hub
                    <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
            </Card>
          </Link>
      </div>
    </PageTransition>
  );
}
