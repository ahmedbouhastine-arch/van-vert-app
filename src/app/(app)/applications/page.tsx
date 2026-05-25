'use client';
export const dynamic = 'force-dynamic';
import Link from "next/link";
import { useState } from "react";
import { redirect } from "next/navigation";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { collection, query, where, doc, deleteDoc, orderBy } from "firebase/firestore";
import type { Application, FirebaseTimestamp } from "@/types";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useToast } from "@/hooks/use-toast";
import { PageTransition } from "@/components/PageTransition";

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

export default function MyApplicationsPage() {
  const { user, claims, loading: userLoading } = useUser();
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
  const [appToDelete, setAppToDelete] = useState<Application | null>(null);
  const firestore = useFirestore();
  const { toast } = useToast();

  const userApplicationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // Query for applications where the userId matches the current user's ID, sorted by most recent
    return query(collection(firestore, "applications"), where("userId", "==", user.uid), orderBy("updatedAt", "desc"));
  }, [firestore, user]);
  
  const { data: userApplications, isLoading: appsLoading } = useCollection<Application>(userApplicationsQuery);
  
  const isLoading = userLoading || appsLoading;

  const handleDelete = async () => {
    if (!appToDelete || !firestore) return;

    const appRef = doc(firestore, 'applications', appToDelete.id);
    try {
        await deleteDoc(appRef);
        toast({
            title: 'Draft Deleted',
            description: `Application for '${appToDelete.licenseType}' has been deleted.`
        });
    } catch {
        toast({
            variant: 'destructive',
            title: 'Delete Failed',
            description: 'Could not delete the application. Please try again.'
        });
    } finally {
        setAppToDelete(null); // Close dialog
    }
  };

  if (isLoading) {
    return <LoadingScreen text="Loading applications..." />;
  }

  if (claims && ['reviewer', 'admin', 'head-admin'].includes(claims.role)) {
    redirect('/admin');
  }

  return (
    <PageTransition className="flex flex-col gap-4">
      <div className="flex items-center">
        <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold font-headline tracking-tight">My Applications</h1>
            <p className="text-muted-foreground">Manage and track the status of your pilot license applications.</p>
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
          <CardTitle>Your License Applications</CardTitle>
          <CardDescription>
            A list of all your active and past applications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">
                  Last Updated
                </TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">Loading your applications...</TableCell>
                </TableRow>
              ) : userApplications && userApplications.length > 0 ? (
                userApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">
                      <Link href={`/applications/${app.id}`} className="hover:underline">
                        {app.licenseType}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={app.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {safeFormatDate(app.updatedAt, "MMMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                              <Link href={`/applications/${app.id}`}>View Details</Link>
                          </DropdownMenuItem>
                          {app.feedback && <DropdownMenuItem onSelect={() => setSelectedFeedback(app.feedback || null)}>View Feedback</DropdownMenuItem>}
                          {app.status === 'draft' && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => setAppToDelete(app)} className="text-destructive focus:text-destructive">
                                    Delete Draft
                                </DropdownMenuItem>
                            </>
                          )}
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
                    <Button asChild size="sm" className="mt-4">
                        <Link href="/applications/new">New Application</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {!isLoading && userApplications && (
            <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>{userApplications.length}</strong> of <strong>{userApplications.length}</strong>{" "}
                applications
            </div>
            </CardFooter>
        )}
      </Card>

      {/* Feedback Dialog */}
      <Dialog open={!!selectedFeedback} onOpenChange={(isOpen) => !isOpen && setSelectedFeedback(null)}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Feedback from Admin</DialogTitle>
                <DialogDescription className="pt-4 text-base text-foreground">
                    {selectedFeedback}
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-start">
                <Button onClick={() => setSelectedFeedback(null)} variant="outline">Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!appToDelete} onOpenChange={(isOpen) => !isOpen && setAppToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action will permanently delete your draft application for the <span className="font-semibold text-foreground">{appToDelete?.licenseType}</span>. This cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}
