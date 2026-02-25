'use client';
import Link from "next/link";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import type { Application, FirebaseTimestamp } from "@/types";
import { LoadingScreen } from "@/components/LoadingScreen";

// Helper function to safely format dates
const safeFormatDate = (date: FirebaseTimestamp | Date | string | undefined | null, formatString: string) => {
  if (!date) return 'N/A';
  try {
    const dateObj = (typeof date === 'object' && date && 'toDate' in date) ? date.toDate() : new Date(date as string);
    if (isNaN(dateObj.getTime())) return "Invalid Date";
    return format(dateObj, formatString);
  } catch (error) {
    console.error("Date formatting failed:", error);
    return "Invalid Date";
  }
};

export default function DashboardPage() {
  const { user, claims, loading: userLoading } = useUser();
  const [selectedFeedback, setSelectedFeedback] = React.useState<string | null>(null);
  const firestore = useFirestore();
  const router = useRouter();

  // Redirect admins/reviewers away from the user dashboard
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

  // To prevent flicker, show a loading screen while user data is loading or while redirecting.
  if (userLoading || (claims && ['reviewer', 'admin', 'head-admin'].includes(claims.role))) {
    return <LoadingScreen text="Loading dashboard..." />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center">
        <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold font-headline tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">An overview of your recent activity and applications.</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/applications/new">
            <Button size="sm" className="h-8 gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                New Application
              </span>
            </Button>
          </Link>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
          <CardDescription>
            A summary of your recent pilot license applications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Last Updated</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading your applications...</TableCell></TableRow>
              ) : userApplications && userApplications.length > 0 ? (
                userApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">
                      <Link href={`/applications/${app.id}`} className="hover:underline">{app.licenseType}</Link>
                    </TableCell>
                    <TableCell><StatusBadge status={app.status} /></TableCell>
                    <TableCell className="hidden md:table-cell">{safeFormatDate(app.updatedAt, "MMMM d, yyyy")}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Toggle menu</span></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild><Link href={`/applications/${app.id}`}>View Details</Link></DropdownMenuItem>
                          {app.feedback && <DropdownMenuItem onSelect={() => setSelectedFeedback(app.feedback || null)}>View Feedback</DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <h3 className="font-semibold">No applications found.</h3>
                    <p className="text-sm text-muted-foreground">Get started by creating a new application.</p>
                    <Button asChild size="sm" className="mt-4"><Link href="/applications/new">New Application</Link></Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {!isLoading && userApplications && (
            <CardFooter>
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{userApplications.length}</strong> of <strong>{userApplications.length}</strong> applications
                </div>
            </CardFooter>
        )}
      </Card>
      <Dialog open={!!selectedFeedback} onOpenChange={(isOpen) => !isOpen && setSelectedFeedback(null)}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Feedback from Admin</DialogTitle>
                <DialogDescription className="pt-4 text-base text-foreground">{selectedFeedback}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-start">
                <Button onClick={() => setSelectedFeedback(null)} variant="outline">Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
