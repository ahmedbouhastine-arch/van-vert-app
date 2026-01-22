
import { analyticsData } from "@/lib/data";
import { AnalyticsClient } from "./_components/AnalyticsClient";

export default function AnalyticsPage() {
    // In a real app, you'd fetch this data.
    const kpiData = {
        totalApplications: 153,
        avgProcessingTime: 5.2, // days
        approvalRate: 85.6, // percentage
        pendingReview: 12,
    };

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
