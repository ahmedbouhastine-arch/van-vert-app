
'use client';

import { AnalyticsClient } from "./_components/AnalyticsClient";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import React from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { subMonths, format } from "date-fns";
import type { AnalyticsDataPoint } from "@/types";

// Helper function to generate mock data
const generateMockChartData = (): AnalyticsDataPoint[] => {
    const data: AnalyticsDataPoint[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const date = subMonths(now, i);
        const submitted = Math.floor(Math.random() * 30) + 10;
        const approved = Math.floor(submitted * (0.6 + Math.random() * 0.3));
        const rejected = Math.floor(submitted * (0.1 + Math.random() * 0.1));
        data.push({
            date: format(date, 'MMM'),
            submitted,
            approved,
            rejected
        });
    }
    return data;
}

function RedirectToAdminDashboard() {
    const router = useRouter();
    React.useEffect(() => {
        router.push('/admin');
    }, [router]);
    return <LoadingScreen text="Access Denied. Redirecting..." />;
}


export default function AnalyticsPage() {
    const { loading, claims } = useUser();

    // In a real app, you'd fetch this data from a collection aggregated for analytics.
    const kpiData = {
        totalApplications: 125,
        avgProcessingTime: 14, 
        approvalRate: 82,
        pendingReview: 15,
    };
    
    const chartData = generateMockChartData();

    if (loading) {
        return <LoadingScreen text="Verifying Access..." />;
    }

    const isAuthorized = claims?.role && ['admin', 'head-admin'].includes(claims.role);

    if (!isAuthorized) {
        return <RedirectToAdminDashboard />;
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
