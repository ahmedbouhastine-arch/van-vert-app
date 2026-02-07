
'use client';
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { useMemo, useEffect } from "react";
import type { Application, UserProfile, FirebaseTimestamp } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
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

export default function AdminApplicationsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const { user, claims, loading: claimsLoading } = useUser();
  
  const isAuthorized = useMemo(() => 
    claims?.role && ['reviewer', 'admin', 'head-admin'].includes(claims.role),
    [claims]
  );

  useEffect(() => {
    if (!claimsLoading && !isAuthorized) {
        router.push('/dashboard');
    }
  }, [claimsLoading, isAuthorized, router]);

  const usersQuery = useMemoFirebase(() => isAuthorized && firestore ? query(collection(firestore, "users")) : null, [firestore, isAuthorized]);
  const { data: users, loading: usersLoading } = useCollection<UserProfile>(usersQuery);

  const appsQuery = useMemoFirebase(() => isAuthorized && firestore ? query(collection(firestore, "applications"), where("status", "!=", "draft")) : null, [firestore, isAuthorized]);
  const { data: applications, loading: appsLoading } = useCollection<Application>(appsQuery);

  const allApplications = useMemo(() => {
    if (!applications || !users) return [];
    return applications.map(app => {
      const user = users.find((u) => u.id === app.userId);
      return { ...app, user };
    });
  }, [applications, users]);

  const isLoading = claimsLoading || usersLoading || appsLoading;

  const handleSendReminder = (applicantName: string | undefined, licenseType: string) => {
    toast({
        title: "Reminder Sent",
        description: `A reminder email has been sent to ${applicantName || 'the applicant'} for their ${licenseType} application.`,
    })
  }

  if (isLoading || !isAuthorized) {
    return <LoadingScreen text="Verifying Access & Loading Applications..." />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Manage Applications</h1>
        <p className="text-muted-foreground">Review and manage all submitted pilot license applications.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Applications</CardTitle>
          <CardDescription>
            A list of all applications submitted by users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden sm:table-cell">Applicant</TableHead>
                <TableHead>License Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">
                  Submitted
                </TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Loading applications...</TableCell>
                </TableRow>
              ) : allApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">No submitted applications found.</TableCell>
                </TableRow>
              ) : (
                allApplications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={app.user?.photoURL} alt={app.user?.displayName} data-ai-hint="person portrait" />
                            <AvatarFallback>{app.user?.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium">{app.user?.displayName}</div>
                            <div className="text-xs text-muted-foreground">{app.user?.email}</div>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                     <Link href={`/admin/applications/${app.id}`} className="hover:underline">
                      {app.licenseType}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={app.status} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {safeFormatDate(app.submittedAt, "MMMM d, yyyy")}
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
                            <Link href={`/admin/applications/${app.id}`}>Review Application</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleSendReminder(app.user?.displayName, app.licenseType)}>Send Reminder</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )))}
            </TableBody>
          </Table>
        </CardContent>
        {!isLoading && (
            <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>1-{allApplications.length}</strong> of <strong>{allApplications.length}</strong>{" "}
                applications
            </div>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
