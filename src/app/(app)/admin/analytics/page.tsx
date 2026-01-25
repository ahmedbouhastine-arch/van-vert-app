
'use client';

import { analyticsData } from "@/lib/data";
import { AnalyticsClient } from "./_components/AnalyticsClient";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function AnalyticsPage() {
    const { user, loading, claims } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (claims?.role !== 'admin' && claims?.role !== 'head-admin')) {
            router.push('/admin');
        }
    }, [user, loading, claims, router]);

    // In a real app, you'd fetch this data.
    const kpiData = {
        totalApplications: 153,
        avgProcessingTime: 5.2, // days
        approvalRate: 85.6, // percentage
        pendingReview: 12,
    };

    if (loading || !user || (claims?.role !== 'admin' && claims?.role !== 'head-admin')) {
        return <LoadingScreen text="Verifying Access..." />;
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold font-headline tracking-tight">Analytics Dashboard</h1>
                <p className="text-muted-foreground">Insights into application trends and processing times.</p>
            </div>
            <AnalyticsClient kpiData={kpiData} chartData={analyticsData} />
        </div>
    );
}
