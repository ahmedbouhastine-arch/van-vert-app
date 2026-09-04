
'use client';

import { useMemo } from "react";
import { collection, type CollectionReference } from "firebase/firestore";
import { AnalyticsClient } from "./_components/AnalyticsClient";
import type { Application, AnalyticsDataPoint } from "@/types";
import { PageTransition } from "@/components/PageTransition";
import { VvPageHeader } from "@/components/vv/VvPageHeader";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toDate(value: Application["submittedAt"] | Application["updatedAt"]): Date | null {
    if (!value) return null;
    if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
        return value.toDate();
    }
    return null;
}

export default function AnalyticsPage() {
    const firestore = useFirestore();

    const applicationsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, "applications") as CollectionReference<Application>;
    }, [firestore]);

    const { data: applications, isLoading } = useCollection<Application>(applicationsQuery);

    const { kpiData, chartData } = useMemo(() => {
        const allApps = applications || [];
        // Drafts never entered the review pipeline - exclude them from every metric below.
        const nonDraft = allApps.filter((a) => a.status !== "draft");

        const approved = nonDraft.filter((a) => a.status === "approved");
        const rejected = nonDraft.filter((a) => a.status === "rejected");
        const resolved = [...approved, ...rejected];
        const pendingReview = nonDraft.filter(
            (a) => a.status === "submitted" || a.status === "in_review" || a.status === "needs_attention"
        ).length;

        const processingDays: number[] = [];
        for (const app of resolved) {
            const submitted = toDate(app.submittedAt);
            const decided = toDate(app.updatedAt);
            if (submitted && decided) {
                const days = (decided.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24);
                if (days >= 0) processingDays.push(days);
            }
        }
        const avgProcessingTime = processingDays.length
            ? Math.round((processingDays.reduce((sum, d) => sum + d, 0) / processingDays.length) * 10) / 10
            : 0;

        const approvalRate = resolved.length
            ? Math.round((approved.length / resolved.length) * 100)
            : 0;

        // Last 6 months (oldest -> newest), bucketed by submittedAt for
        // "submitted" and by updatedAt for "approved"/"rejected" (the closest
        // proxy we have to a decision date, since status transitions aren't
        // tracked with their own timestamp).
        const now = new Date();
        const buckets: { key: string; label: string; submitted: number; approved: number; rejected: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            buckets.push({
                key: `${d.getFullYear()}-${d.getMonth()}`,
                label: MONTH_LABELS[d.getMonth()],
                submitted: 0,
                approved: 0,
                rejected: 0,
            });
        }
        const bucketByKey = new Map(buckets.map((b) => [b.key, b]));

        for (const app of nonDraft) {
            const submitted = toDate(app.submittedAt);
            if (submitted) {
                const key = `${submitted.getFullYear()}-${submitted.getMonth()}`;
                const bucket = bucketByKey.get(key);
                if (bucket) bucket.submitted += 1;
            }
        }
        for (const app of resolved) {
            const decided = toDate(app.updatedAt);
            if (decided) {
                const key = `${decided.getFullYear()}-${decided.getMonth()}`;
                const bucket = bucketByKey.get(key);
                if (bucket) {
                    if (app.status === "approved") bucket.approved += 1;
                    else bucket.rejected += 1;
                }
            }
        }

        const chartData: AnalyticsDataPoint[] = buckets.map((b) => ({
            date: b.label,
            submitted: b.submitted,
            approved: b.approved,
            rejected: b.rejected,
        }));

        return {
            kpiData: {
                totalApplications: nonDraft.length,
                avgProcessingTime,
                approvalRate,
                pendingReview,
            },
            chartData,
        };
    }, [applications]);

    return (
        <PageTransition>
            <VvPageHeader
              kicker="Insights"
              title="Analytics Dashboard"
              sub="Insights into application trends and processing times."
            />
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-[120px] animate-pulse rounded-xl border border-[var(--vv-border)] bg-[var(--surface)]" />
                    ))}
                </div>
            ) : (
                <AnalyticsClient kpiData={kpiData} chartData={chartData} />
            )}
        </PageTransition>
    );
}
