'use client';

import Link from "next/link";
import { PlusCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import type { Application, FirebaseTimestamp } from "@/types";
import { LoadingScreen } from "@/components/LoadingScreen";

// Helper function to safely format dates, whether they are Timestamps or strings
const safeFormatDate = (date: FirebaseTimestamp | Date | string | undefined | null, formatString: string) => {
  if (!date) return 'N/A';
  try {
    if (typeof date === 'object' && date && 'toDate' in date && typeof date.toDate === 'function') {
      return format(date.toDate(), formatString);
    }
    return format(new Date(date as string), formatString);
  } catch (error) {
    console.error("Date formatting failed:", error);
    return "Invalid Date";
  }
};

function ApplicationCardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-20" />
                </div>
            </CardContent>
            <CardFooter>
                <Skeleton className="h-10 w-full" />
            </CardFooter>
        </Card>
    )
}


export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();

  const appsQuery = useMemoFirebase(() => {
    if (!firestore || !user) {
      return null;
    }
    return query(
        collection(firestore, "applications"), 
        where("userId", "==", user.uid),
        orderBy("updatedAt", "desc"),
        limit(3)
    );
  }, [firestore, user]);

  const { data: recentApplications, loading: appsLoading } = useCollection<Application>(appsQuery);

  if (userLoading) {
      return <LoadingScreen text="Loading Dashboard..." />;
  }
  
  const renderContent = () => {
    if (appsLoading) {
      return Array.from({ length: 3 }).map((_, i) => <ApplicationCardSkeleton key={i} />);
    }

    if (!recentApplications || recentApplications.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-8 col-span-full">
                <p className="mb-2">You have no applications yet.</p>
                <Link href="/applications/new">
                    <Button>Start your first application</Button>
                </Link>
            </div>
        );
    }
    return recentApplications.map((app) => (
        <Card key={app.id}>
            <CardHeader>
                <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">{app.licenseType}</CardTitle>
                <StatusBadge status={app.status} />
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    Last updated on {safeFormatDate(app.updatedAt, "PPP")}
                </p>
            </CardContent>
            <CardFooter>
                <Link href={`/applications/${app.id}`} className="w-full">
                <Button variant="outline" className="w-full">
                    View Details <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                </Link>
            </CardFooter>
        </Card>
    ));
  }


  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold font-headline tracking-tight">
              User Dashboard
            </h1>
            <p className="text-muted-foreground">
                {`Welcome, ${user?.displayName || 'User'}! Here's a quick look at your recent activity.`}
            </p>
        </div>
        <Link href="/applications/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Application
            </Button>
          </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
          <CardDescription>
            A preview of your most recently updated applications.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {renderContent()}
        </CardContent>
        {(!userLoading && !appsLoading) && recentApplications && recentApplications.length > 0 && (
            <CardFooter className="border-t pt-6">
                <Link href="/applications" className="w-full">
                    <Button variant="secondary" className="w-full">View All My Applications</Button>
                </Link>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
