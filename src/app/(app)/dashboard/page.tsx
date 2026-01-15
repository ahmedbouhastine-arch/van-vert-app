

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
import { applications } from "@/lib/data";
import { StatusBadge } from "@/components/StatusBadge";
import { format, parseISO } from "date-fns";
import { useUser } from "@/firebase";

export default function DashboardPage() {
  const { user } = useUser();
  
  if (!user) return null;

  // Get the 3 most recently updated applications for the preview
  const recentApplications = applications
    .filter(app => app.userId === user.uid)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  const totalApplications = applications.filter(app => app.userId === user.uid).length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold font-headline tracking-tight">Welcome, {user.displayName || 'Pilot'}!</h1>
            <p className="text-muted-foreground">Here's a quick look at your recent activity.</p>
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
            {recentApplications.length === 0 && (
                <div className="text-center text-muted-foreground py-8 col-span-full">
                    <p className="mb-2">You have no applications yet.</p>
                    <Link href="/applications/new">
                        <Button>Start your first application</Button>
                    </Link>
                </div>
            )}
             {recentApplications.map((app) => (
                 <Card key={app.id}>
                     <CardHeader>
                         <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold">{app.licenseType}</CardTitle>
                            <StatusBadge status={app.status} />
                         </div>
                     </CardHeader>
                     <CardContent>
                         <p className="text-sm text-muted-foreground">
                             Last updated on {format(parseISO(app.updatedAt), "PPP")}
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
            ))}
        </CardContent>
        {totalApplications > recentApplications.length && (
            <CardFooter className="border-t pt-6">
                <Link href="/applications" className="w-full">
                    <Button variant="secondary" className="w-full">View All My Applications ({totalApplications})</Button>
                </Link>
            </CardFooter>
        )}
      </Card>

    </div>
  );
}
