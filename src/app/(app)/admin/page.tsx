'use client';
import { useUser } from "@/firebase";
import { PageTransition } from "@/components/PageTransition";
import Link from "next/link";
import { FileText, LineChart, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function AdminDashboardPage() {
    const { claims, loading } = useUser();
    const isAdmin = claims?.role === 'admin' || claims?.role === 'head-admin';

    if (loading) return <LoadingScreen text="Loading admin dashboard..." />;

  return (
    <PageTransition className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage ongoing applications and review system analytics globally.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
          {/* Left Column: Applications Preview */}
          <Link href="/admin/applications" className="group h-full">
            <Card className="h-full flex flex-col justify-between transition-all hover:bg-muted/50 hover:border-primary/50 relative overflow-hidden">
                <div className="absolute right-[-10%] top-[-10%] opacity-5 text-primary pointer-events-none transition-transform group-hover:scale-110 duration-500">
                    <FileText size={200} />
                </div>
                <div>
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Application Management
                    </CardTitle>
                    <CardDescription>
                        Review, approve, or reject user conversions.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-[85%]">
                            Access the full list of submitted and draft applications. You can filter by applicant name or email to quickly find an application that needs attention.
                        </p>
                    </CardContent>
                </div>
                <div className="px-6 pb-6 pt-2 flex items-center text-sm font-medium text-primary">
                    Manage all applications
                    <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
            </Card>
          </Link>

          {/* Right Column: Analytics overview (only for admin/head-admin roles) */}
          {isAdmin ? (
               <Link href="/admin/analytics" className="group h-full">
                  <Card className="h-full flex flex-col justify-between transition-all hover:bg-muted/50 hover:border-amber-500/50 relative overflow-hidden">
                       <div className="absolute right-[-10%] top-[-10%] opacity-5 text-amber-500 pointer-events-none transition-transform group-hover:scale-110 duration-500">
                          <LineChart size={200} />
                      </div>
                      <div>
                          <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                  <LineChart className="h-5 w-5 text-amber-500" />
                                  System Analytics
                              </CardTitle>
                              <CardDescription>
                                  View platform KPIs and conversion trends.
                              </CardDescription>
                          </CardHeader>
                          <CardContent>
                              <p className="text-sm text-muted-foreground leading-relaxed max-w-[85%]">
                                  Track application processing times, approval rates, and total global volume to ensure the platform is functioning efficiently.
                              </p>
                          </CardContent>
                      </div>
                      <div className="px-6 pb-6 pt-2 flex items-center text-sm font-medium text-amber-500">
                          View global analytics
                          <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                      </div>
                  </Card>
                </Link>
          ) : (
                <div className="border border-dashed rounded-lg flex flex-col items-center justify-center p-12 text-center text-muted-foreground h-full min-h-[250px]">
                   <p className="text-sm">You do not have permission to view advanced analytics.</p>
                </div>
          )}
      </div>
    </PageTransition>
  );
}
