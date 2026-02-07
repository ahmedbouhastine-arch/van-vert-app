
'use client';

import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import type { AuditLogEntry } from "@/types";

export default function AuditLogPage() {
    const { user, loading, claims } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!loading && claims?.role !== 'head-admin') {
            router.push('/admin');
        }
    }, [user, loading, claims, router]);

    // In a real app, this data would be fetched from a Firestore collection.
    const auditLogs: AuditLogEntry[] = [];

    if (loading || !user || claims?.role !== 'head-admin') {
        return <LoadingScreen text="Verifying Access..." />;
    }
    
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold font-headline tracking-tight">Admin Audit Log</h1>
                <p className="text-muted-foreground">A record of all significant actions performed by administrators.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Activity Log</CardTitle>
                    <CardDescription>Actions are logged with the administrator's details and timestamp.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Admin</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead className="text-right">Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {auditLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No audit logs found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                auditLogs.map((log: AuditLogEntry) => (
                                    <TableRow key={log.id}>
                                        <TableCell>
                                            <div className="font-medium">{log.adminName}</div>
                                            <div className="text-xs text-muted-foreground">{log.adminEmail}</div>
                                        </TableCell>
                                        <TableCell>{log.action}</TableCell>
                                        <TableCell className="text-muted-foreground">{log.details || 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            {log.timestamp ? format(log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp.seconds * 1000 || log.timestamp), 'PPpp') : 'N/A'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

    

    