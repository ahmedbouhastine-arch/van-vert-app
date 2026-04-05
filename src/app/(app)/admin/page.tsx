'use client';
import { useUser } from "@/firebase";
import { PageTransition } from "@/components/PageTransition";
import { AdminApplicationsClient } from "./_components/AdminApplicationsClient";
import { AnalyticsClient } from "./analytics/_components/AnalyticsClient";
import type { AnalyticsDataPoint } from "@/types";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function AdminDashboardPage() {
    const { claims, loading } = useUser();
    const isAdmin = claims?.role === 'admin' || claims?.role === 'head-admin';

    // Placeholder data until live analytics logic is complete
    const kpiData = {
        totalApplications: 0,
        avgProcessingTime: 0, 
        approvalRate: 0,
        pendingReview: 0,
    };
    const chartData: AnalyticsDataPoint[] = [];

    if (loading) return <LoadingScreen text="Loading admin dashboard..." />;

  return (
    <PageTransition className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage ongoing applications and review system analytics globally.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full items-start">
          {/* Left Column: Applications List */}
          <div className="w-full min-w-0">
             <AdminApplicationsClient />
          </div>

          {/* Right Column: Analytics overview (only for admin/head-admin roles) */}
          <div className="w-full flex flex-col gap-6">
             {isAdmin ? (
                 <AnalyticsClient kpiData={kpiData} chartData={chartData} />
             ) : (
                 <div className="border border-dashed rounded-lg flex flex-col items-center justify-center p-12 text-center text-muted-foreground h-full min-h-[300px]">
                    <p className="text-sm">You do not have permission to view advanced analytics.</p>
                 </div>
             )}
          </div>
      </div>
    </PageTransition>
  );
}
