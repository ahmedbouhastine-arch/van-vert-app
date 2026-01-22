
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
import { applications, mockUsers } from "@/lib/data";
import { StatusBadge } from "@/components/StatusBadge";
import { format, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCollection } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { useMemo } from "react";

export default function AdminDashboardPage() {
  const firestore = useFirestore();
  const usersQuery = useMemo(() => firestore ? query(collection(firestore, "users")) : null, [firestore]);
  const { data: firestoreUsers, loading: usersLoading } = useCollection(usersQuery);

  const users = useMemo(() => {
    const realUsers = (firestoreUsers as any[]) ?? [];
    const allUsers = [...realUsers];
    const realUserIds = new Set(realUsers.map((u: any) => u.id));

    for (const mockUser of mockUsers) {
      if (!realUserIds.has(mockUser.id)) {
        allUsers.push(mockUser);
      }
    }
    return allUsers;
  }, [firestoreUsers]);

  const allApplications = applications.map(app => {
    const user = users?.find((u: any) => u.id === app.userId);
    return { ...app, user };
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Admin Dashboard</h1>
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
              {usersLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Loading applications...</TableCell>
                </TableRow>
              ) : allApplications.map((app) => (
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
                    {app.submittedAt ? format(parseISO(app.submittedAt), "MMMM d, yyyy") : 'N/A'}
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
                        <DropdownMenuItem>Send Reminder</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>1-{allApplications.length}</strong> of <strong>{allApplications.length}</strong>{" "}
            applications
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
