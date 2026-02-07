
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
import React, { useMemo } from "react";
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

function AdminApplicationsContent() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const usersQuery = useMemoFirebase(() => 
        firestore ? query(collection(firestore, "users")) : null, 
        [firestore]
    );
    const { data: users, loading: usersLoading } = useCollection<UserProfile>(usersQuery);

    const appsQuery = useMemoFirebase(() => 
        firestore ? query(collection(firestore, "applications"), where("status", "!=", "draft")) : null, 
        [firestore]
    );
    const { data: applications, loading: appsLoading } = useCollection<Application>(appsQuery);

    const allApplications = useMemo(() => {
        if (!applications || !users) return [];
        return applications.map(app => {
            const user = users.find((u) => u.id === app.userId);
            return { ...app, user };
        });
    }, [applications, users]);

    const isLoading = usersLoading || appsLoading;

    const handleSendReminder = (applicantName: string | undefined, licenseType: string) => {
        toast({
            title: "Reminder Sent",
            description: `A reminder email has been sent to ${applicantName || 'the applicant'} for their ${licenseType} application.`,
        })
    }

    if (isLoading) {
        return (
            <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                    Loading applications...
                </TableCell>
            </TableRow>
        )
    }

    if (allApplications.length === 0) {
        return (
            <TableRow>
                <TableCell colSpan={5} className="text-center h-24">No submitted applications found.</TableCell>
            </TableRow>
        )
    }
    
    return (
        <>
            {allApplications.map((app) => (
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
            ))}
        </>
    )
}

function RedirectToDashboard() {
  const router = useRouter();
  React.useEffect(() => {
    router.push('/dashboard');
  }, [router]);
  return <LoadingScreen text="Access Denied. Redirecting..." />;
}


export default function AdminApplicationsPage() {
  const { claims, loading: claimsLoading } = useUser();

  if (claimsLoading) {
    return <LoadingScreen text="Verifying Access..." />;
  }

  const isAuthorized = claims?.role && ['reviewer', 'admin', 'head-admin'].includes(claims.role);

  const PageContent = () => (
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
                <AdminApplicationsContent />
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  // Render content only if authorized, otherwise redirect. This prevents child components
  // from attempting to fetch data before the authorization check is complete.
  return isAuthorized ? <PageContent /> : <RedirectToDashboard />;
}
