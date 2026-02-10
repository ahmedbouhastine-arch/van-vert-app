
'use client';
import Link from "next/link";
import React from "react";
import { redirect } from "next/navigation";
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
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import type { Application, UserProfile, FirebaseTimestamp } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { LoadingScreen } from "@/components/LoadingScreen";
import { collection, query, orderBy, doc, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

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


function ApplicationTableRow({ application }: { application: Application }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const userRef = useMemoFirebase(() => 
        firestore ? doc(firestore, 'users', application.userId) as any : null,
        [firestore, application.userId]
    );
    const { data: user, isLoading: userLoading } = useDoc<UserProfile>(userRef);

    const handleSendReminder = (applicantName: string | undefined, licenseType: string) => {
        toast({
            title: "Reminder Sent",
            description: `A reminder email has been sent to ${applicantName || 'the applicant'} for their ${licenseType} application.`,
        })
    }

    if (userLoading) {
        return (
            <TableRow>
                <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div>
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32 mt-1" />
                        </div>
                    </div>
                </TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
        );
    }
    
    return (
        <TableRow>
            <TableCell className="hidden sm:table-cell">
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    {user?.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName} data-ai-hint="person portrait" />}
                    <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <div className="font-medium">{user?.displayName}</div>
                    <div className="text-xs text-muted-foreground">{user?.email}</div>
                </div>
            </div>
            </TableCell>
            <TableCell className="font-medium">
            <Link href={`/admin/applications/${application.id}`} className="hover:underline">
            {application.licenseType}
            </Link>
            </TableCell>
            <TableCell>
            <StatusBadge status={application.status} />
            </TableCell>
            <TableCell className="hidden md:table-cell">
            {safeFormatDate(application.submittedAt, "MMMM d, yyyy")}
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
                    <Link href={`/admin/applications/${application.id}`}>Review Application</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleSendReminder(user?.displayName, application.licenseType)}>Send Reminder</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            </TableCell>
        </TableRow>
    )
}

function AuthorizedApplicationList() {
    const firestore = useFirestore();
    const { user } = useUser();
    
    const applicationsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(
            collection(firestore, "applications"),
            where("userId", "==", user.uid),
            orderBy("submittedAt", "desc")
        ) as any;
    }, [firestore, user?.uid]);
    
    const { data: allApplications, isLoading } = useCollection<Application>(applicationsQuery);

    const renderTableBody = () => {
        if (isLoading) {
           return (
                Array.from({ length: 5 }).map((_, i) => (
                   <TableRow key={i}>
                       <TableCell className="hidden sm:table-cell">
                           <div className="flex items-center gap-2">
                               <Skeleton className="h-8 w-8 rounded-full" />
                               <div>
                                   <Skeleton className="h-4 w-24" />
                                   <Skeleton className="h-3 w-32 mt-1" />
                               </div>
                           </div>
                       </TableCell>
                       <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                       <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                       <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                       <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                   </TableRow>
               ))
           )
       }
   
       if (!allApplications || allApplications.length === 0) {
           return (
               <TableRow>
                   <TableCell colSpan={5} className="text-center h-24">No submitted applications found.</TableCell>
               </TableRow>
           )
       }
       
       return (
           <>
               {allApplications.map((app) => (
                   <ApplicationTableRow key={app.id} application={app} />
               ))}
           </>
       )
     }

     return (
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
                        {renderTableBody()}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
     )
}


export default function AdminApplicationsPage() {
  const { claims, loading: claimsLoading } = useUser();
  
  if (claimsLoading) {
    return <LoadingScreen text="Verifying Access..." />;
  }

  const isAuthorized = !!(claims?.role && ['reviewer', 'admin', 'head-admin'].includes(claims.role));
  
  if (!isAuthorized) {
    redirect('/dashboard');
    return null; // Render nothing while redirecting
  }
  
  return (
     <div className="flex flex-col gap-4">
       <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Manage Applications</h1>
            <p className="text-muted-foreground">Review and manage all submitted pilot license applications.</p>
          </div>
        </div>
      </div>
      <AuthorizedApplicationList />
    </div>
  );
}
