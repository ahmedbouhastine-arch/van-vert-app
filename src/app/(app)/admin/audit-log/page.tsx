
'use client';

import React from "react";
import { collection, query, orderBy, limit, type CollectionReference } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import type { AuditLogEntry, FirebaseTimestamp } from "@/types";
import { PageTransition } from "@/components/PageTransition";
import { VvPageHeader } from "@/components/vv/VvPageHeader";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";

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
    const firestore = useFirestore();

    // Populated by writeAuditLogEntry() in src/app/actions.ts, which every
    // admin-facing action (status changes, role changes) calls server-side.
    const auditLogsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'auditLogs') as CollectionReference<AuditLogEntry>,
            orderBy('timestamp', 'desc'),
            limit(200)
        );
    }, [firestore]);

    const { data: auditLogs, isLoading } = useCollection<AuditLogEntry>(auditLogsQuery);

    return (
        <PageTransition>
            <VvPageHeader
              kicker="Operations"
              title="Admin Audit Log"
              sub="A record of all significant actions performed by administrators."
            />
            <div className="rounded-xl border border-[var(--vv-border)] bg-white">
                <div className="border-b border-[var(--vv-border-soft)] p-6">
                    <h3 className="font-outfit text-base font-semibold text-[var(--navy)]">Activity log</h3>
                    <p className="mt-0.5 text-[13px] text-[var(--text-muted)]">Actions are logged with the administrator&apos;s details and timestamp.</p>
                </div>
                <Table>
                    <TableHeader className="bg-[var(--surface)]">
                        <TableRow className="border-[var(--vv-border-soft)] hover:bg-transparent">
                            <TableHead className="text-[var(--text-muted)]">Admin</TableHead>
                            <TableHead className="text-[var(--text-muted)]">Action</TableHead>
                            <TableHead className="text-[var(--text-muted)]">Details</TableHead>
                            <TableHead className="text-right text-[var(--text-muted)]">Timestamp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="border-[var(--vv-border-soft)]">
                                    <TableCell colSpan={4} className="py-4">
                                        <Skeleton className="h-4 w-full max-w-md" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : !auditLogs || auditLogs.length === 0 ? (
                            <TableRow className="border-[var(--vv-border-soft)]">
                                <TableCell colSpan={4} className="h-24 text-center text-[var(--text-muted)]">
                                    No audit logs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            auditLogs.map((log) => (
                                <TableRow key={log.id} className="border-[var(--vv-border-soft)]">
                                    <TableCell>
                                        <div className="font-outfit text-sm font-semibold text-[var(--navy)]">{log.adminName}</div>
                                        <div className="text-xs text-[var(--text-muted)]">{log.adminEmail}</div>
                                    </TableCell>
                                    <TableCell className="text-[var(--text-secondary)]">{log.action}</TableCell>
                                    <TableCell className="text-[var(--text-muted)]">{log.details || 'N/A'}</TableCell>
                                    <TableCell className="text-right text-[var(--text-muted)]">
                                        {safeFormatDate(log.timestamp, 'PPpp')}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </PageTransition>
    );
}
