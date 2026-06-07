
'use client';

import { AnalyticsClient } from "./_components/AnalyticsClient";
import type { AnalyticsDataPoint } from "@/types";
import { PageTransition } from "@/components/PageTransition";
import { VvPageHeader } from "@/components/vv/VvPageHeader";

export default function AnalyticsPage() {
    // In a real app, you'd fetch this data from a collection aggregated for analytics.
    // This is now placeholder data until live analytics are implemented.
    const kpiData = {
        totalApplications: 0,
        avgProcessingTime: 0,
        approvalRate: 0,
        pendingReview: 0,
    };

    const chartData: AnalyticsDataPoint[] = [];

    return (
        <PageTransition>
            <VvPageHeader
              kicker="Insights"
              title="Analytics Dashboard"
              sub="Insights into application trends and processing times."
            />
            <AnalyticsClient kpiData={kpiData} chartData={chartData} />
        </PageTransition>
    );
}
