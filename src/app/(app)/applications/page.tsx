'use client';

import Link from "next/link";
import { useState } from "react";
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
import { applications } from "@/lib/data";
import { StatusBadge } from "@/components/StatusBadge";
import { format, parseISO } from "date-fns";
import { useUser } from "@/firebase";

export default function MyApplicationsPage() {
  const { user } = useUser();
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
  if (!user) return null;

  // If the user is the test user, show all applications for demonstration.
  // Otherwise, only show applications belonging to the logged-in user.
  const userApplications = user.email === 'user@test.va' 
    ? applications
    : applications.filter(app => app.userId === user.uid);

  return (
    <div className="flex flex-col gap-4">
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
              {userApplications.map((app) => (
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
                    {format(parseISO(app.updatedAt), "MMMM d, yyyy")}
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
            Showing <strong>1-{userApplications.length}</strong> of <strong>{userApplications.length}</strong>{" "}
            applications
          </div>
        </CardFooter>
      </Card>
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
    </div>
  );
}
