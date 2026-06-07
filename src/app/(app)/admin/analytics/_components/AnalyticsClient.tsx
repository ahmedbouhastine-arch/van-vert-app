
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { AnalyticsDataPoint } from '@/types';
import type { ChartConfig } from '@/components/ui/chart';
import { FileText, Clock, CheckCircle2, Hourglass } from 'lucide-react';

type KpiData = {
    totalApplications: number;
    avgProcessingTime: number;
    approvalRate: number;
    pendingReview: number;
};

const chartConfig = {
    submitted: {
        label: 'Submitted',
        color: 'var(--sky)',
    },
    approved: {
        label: 'Approved',
        color: 'var(--status-ready)',
    },
    rejected: {
        label: 'Rejected',
        color: 'var(--status-missing)',
    },
} satisfies ChartConfig;

export function AnalyticsClient({ kpiData, chartData }: { kpiData: KpiData, chartData: AnalyticsDataPoint[] }) {
    const KPI_CARDS = [
        { label: 'Total applications', value: kpiData.totalApplications, icon: FileText },
        { label: 'Avg. processing time', value: kpiData.avgProcessingTime, suffix: 'days', icon: Clock },
        { label: 'Approval rate', value: kpiData.approvalRate, suffix: '%', icon: CheckCircle2 },
        { label: 'Pending review', value: kpiData.pendingReview, icon: Hourglass },
    ];

    return (
        <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {KPI_CARDS.map((kpi) => (
                    <div key={kpi.label} className="rounded-xl border border-[var(--vv-border)] bg-white p-5">
                        <div className="mb-3 flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--sky-pale)] text-[var(--sky)]">
                                <kpi.icon className="h-4 w-4" />
                            </div>
                            <div className="font-inter text-[10px] font-semibold uppercase tracking-[3px] text-[var(--text-muted)]">{kpi.label}</div>
                        </div>
                        <div className="font-outfit text-3xl font-bold tracking-[-0.02em] text-[var(--navy)]">
                            {kpi.value}
                            {kpi.suffix && <span className="ml-1 text-base font-normal text-[var(--text-muted)]">{kpi.suffix}</span>}
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-xl border border-[var(--vv-border)] bg-white p-6">
                <h3 className="font-outfit text-base font-semibold text-[var(--navy)]">Application volume</h3>
                <p className="mt-1 text-[13px] text-[var(--text-muted)]">Monthly application submissions, approvals, and rejections.</p>
                <ChartContainer config={chartConfig} className="mt-5 h-[300px] w-full">
                    <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} stroke="var(--vv-border-soft)" />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <YAxis tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="submitted" fill="var(--color-submitted)" radius={4} />
                        <Bar dataKey="approved" fill="var(--color-approved)" radius={4} />
                        <Bar dataKey="rejected" fill="var(--color-rejected)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </div>
        </div>
    )
}
