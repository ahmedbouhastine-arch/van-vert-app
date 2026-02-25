'use client';
export const dynamic = 'force-dynamic';

import { useUser } from "@/firebase";
import { redirect } from "next/navigation";
import React from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import type { AuditLogEntry, FirebaseTimestamp } from "@/types";

// Helper function to safely format dates, whether they are Timestamps or strings
const safeFormatDate = (date: FirebaseTimestamp | Date | string | undefined | null, formatString: string) => {
  if (!date) return 'N/A';
  try {
    let dateObj;
    if (typeof date === 'object' && date && 'toDate' in date && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } else {
      dateObj = new Date(date as string);
    }
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
        return "Invalid Date";
    }
    return format(dateObj, formatString);
  } catch (error) {
    console.error("Date formatting failed:", error);
    return "Invalid Date";
  }
};

export default function AuditLogPage() {
    const { loading, claims } = useUser();

    // In a real app, this data would be fetched from a Firestore collection.
    // For now, it's an empty array as mock data has been removed.
    const auditLogs: AuditLogEntry[] = [];

    if (loading) {
        return <LoadingScreen text="Verifying Access..." />;
    }

    if (claims?.role !== 'head-admin') {
        redirect('/admin');
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
                    <CardDescription>Actions are logged with the administrator&apos;s details and timestamp.</CardDescription>
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
                                            {safeFormatDate(log.timestamp, 'PPpp')}
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
