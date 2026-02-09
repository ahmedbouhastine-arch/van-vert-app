'use client';
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, UserCog, LineChart, History, PlusCircle } from "lucide-react";
import { useUser } from "@/firebase";

export default function AdminDashboardPage() {
    const { claims } = useUser();
    const isHeadAdmin = claims?.role === 'head-admin';
    const isAdmin = claims?.role === 'admin' || isHeadAdmin;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Quick access to admin functionalities.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-6 w-6" />
                    <span>Application Management</span>
                </CardTitle>
                <CardDescription>
                    Review, approve, or reject user applications.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Link href="/admin/applications">
                    <Button>View Applications</Button>
                </Link>
            </CardContent>
        </Card>
        {isAdmin && (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LineChart className="h-6 w-6" />
                        <span>Analytics</span>
                    </CardTitle>
                    <CardDescription>
                        View application trends and statistics.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/admin/analytics">
                        <Button>View Analytics</Button>
                    </Link>
                </CardContent>
            </Card>
        )}
        {isHeadAdmin && (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserCog className="h-6 w-6" />
                        <span>User Management</span>
                    </CardTitle>
                    <CardDescription>
                        Manage user roles and permissions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/admin/users">
                        <Button>Manage Users</Button>
                    </Link>
                </CardContent>
            </Card>
        )}
        {isHeadAdmin && (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-6 w-6" />
                        <span>Audit Log</span>
                    </CardTitle>
                    <CardDescription>
                        Track all administrative actions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/admin/audit-log">
                        <Button>View Logs</Button>
                    </Link>
                </CardContent>
            </Card>
        )}
        {isHeadAdmin && (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PlusCircle className="h-6 w-6" />
                        <span>Create Application</span>
                    </CardTitle>
                    <CardDescription>
                        Create a new license application for your own account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/applications/new">
                        <Button>Start Application</Button>
                    </Link>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
