'use client';

import { AnalyticsClient } from "./_components/AnalyticsClient";
import { useUser } from "@/firebase";
import { redirect } from "next/navigation";
import React from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import type { AnalyticsDataPoint } from "@/types";

export default function AnalyticsPage() {
    const { loading, claims } = useUser();

    // In a real app, you'd fetch this data from a collection aggregated for analytics.
    // This is now placeholder data until live analytics are implemented.
    const kpiData = {
        totalApplications: 0,
        avgProcessingTime: 0, 
        approvalRate: 0,
        pendingReview: 0,
    };
    
    const chartData: AnalyticsDataPoint[] = [];

    if (loading) {
        return <LoadingScreen text="Verifying Access..." />;
    }

    const isAuthorized = claims?.role && ['admin', 'head-admin'].includes(claims.role);

    if (!isAuthorized) {
        redirect('/admin');
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold font-headline tracking-tight">Analytics Dashboard</h1>
                <p className="text-muted-foreground">Insights into application trends and processing times.</p>
            </div>
            <AnalyticsClient kpiData={kpiData} chartData={chartData} />
        </div>
    );
}
