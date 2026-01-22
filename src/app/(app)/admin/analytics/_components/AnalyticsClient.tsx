
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { AnalyticsDataPoint } from '@/types';
import type { ChartConfig } from '@/components/ui/chart';

type KpiData = {
    totalApplications: number;
    avgProcessingTime: number;
    approvalRate: number;
    pendingReview: number;
};

export function AnalyticsClient({ kpiData, chartData }: { kpiData: KpiData, chartData: AnalyticsDataPoint[] }) {
    const chartConfig = {
        submitted: {
            label: 'Submitted',
            color: 'hsl(var(--chart-2))',
        },
        approved: {
            label: 'Approved',
            color: 'hsl(var(--chart-1))',
        },
        rejected: {
            label: 'Rejected',
            color: 'hsl(var(--destructive))',
        },
    } satisfies ChartConfig;

    return (
        <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Applications</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{kpiData.totalApplications}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Avg. Processing Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{kpiData.avgProcessingTime} <span className="text-lg font-normal text-muted-foreground">days</span></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Approval Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{kpiData.approvalRate}%</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{kpiData.pendingReview}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Application Volume</CardTitle>
                    <CardDescription>Monthly application submissions, approvals, and rejections.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <BarChart accessibilityLayer data={chartData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tickFormatter={(value) => value.slice(0, 3)}
                            />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="submitted" fill="var(--color-submitted)" radius={4} />
                            <Bar dataKey="approved" fill="var(--color-approved)" radius={4} />
                            <Bar dataKey="rejected" fill="var(--color-rejected)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    )
}
