'use client';
import { useUser } from "@/firebase";
import { PageTransition } from "@/components/PageTransition";
import Link from "next/link";
import { FileText, LineChart, ChevronRight, Lock } from "lucide-react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { VvPageHeader } from "@/components/vv/VvPageHeader";

function DashCard({ icon: Icon, kicker, title, body, cta, href, accent }: {
  icon: React.ElementType; kicker: string; title: string; body: string; cta: string; href: string; accent: string;
}) {
  return (
    <Link href={href} className="group flex h-full flex-col justify-between overflow-hidden rounded-xl border border-[var(--vv-border)] bg-white p-7 transition-colors hover:border-[var(--sky)]">
      <div>
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[12px] bg-[var(--sky-pale)]" style={{ color: accent }}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="font-inter text-[10px] font-semibold uppercase tracking-[3px] text-[var(--text-muted)]">{kicker}</div>
        <h3 className="mt-1.5 font-outfit text-[20px] font-bold text-[var(--navy)]">{title}</h3>
        <p className="mt-2 max-w-[90%] text-sm leading-relaxed text-[var(--text-secondary)]">{body}</p>
      </div>
      <div className="mt-6 flex items-center gap-1.5 text-sm font-semibold" style={{ color: accent }}>
        {cta}
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export default function AdminDashboardPage() {
    const { claims, loading } = useUser();
    const isAdmin = claims?.role === 'admin' || claims?.role === 'head-admin';

    if (loading) return <LoadingScreen text="Loading admin dashboard..." />;

  return (
    <PageTransition>
      <VvPageHeader
        kicker="Operations"
        title="Admin Dashboard"
        sub="Manage ongoing applications and review system analytics globally."
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <DashCard
            icon={FileText}
            kicker="Workflow"
            title="Application Management"
            body="Access the full list of submitted and draft applications. Filter by applicant name or email to quickly find an application that needs attention."
            cta="Manage all applications"
            href="/admin/applications"
            accent="var(--sky)"
          />

          {isAdmin ? (
            <DashCard
              icon={LineChart}
              kicker="Insights"
              title="System Analytics"
              body="Track application processing times, approval rates, and total global volume to ensure the platform is functioning efficiently."
              cta="View global analytics"
              href="/admin/analytics"
              accent="var(--status-attention)"
            />
          ) : (
            <div className="flex h-full flex-col gap-3 rounded-xl border border-dashed border-[var(--vv-border)] bg-white p-9">
              <div className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--text-muted)]">
                <Lock className="h-[22px] w-[22px]" />
              </div>
              <div>
                <div className="font-inter text-[10px] font-semibold uppercase tracking-[3px] text-[var(--text-muted)]">Restricted</div>
                <div className="mt-1 font-outfit text-[22px] font-bold text-[var(--navy)]">System Analytics</div>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Reviewer role doesn&apos;t have analytics access. Ask your admin if you need this view.
              </p>
            </div>
          )}
      </div>
    </PageTransition>
  );
}
