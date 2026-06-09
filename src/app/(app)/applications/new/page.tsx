'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Award, Compass, Briefcase, type LucideIcon } from 'lucide-react';

import { licenseTypes } from "@/lib/licensing";
import { useUser, useAuth } from '@/firebase';
import type { LicenseType } from '@/lib/licensing';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import * as serverActions from "@/app/actions";
import { PageTransition } from "@/components/PageTransition";
import { VvPageHeader } from "@/components/vv/VvPageHeader";
import { VvButton, vvButtonVariants } from "@/components/vv/VvButton";
import { cn } from '@/lib/utils';

const LICENSE_ICON: Record<string, LucideIcon> = {
  ppl: Compass,
  cpl: Briefcase,
  atpl: Award,
};

export default function NewApplicationPage() {
  const { user, claims, loading: userLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && claims && ['reviewer', 'admin', 'head-admin'].includes(claims.role)) {
      router.push('/admin');
    }
  }, [userLoading, claims, router]);

  const handleCreateApplication = async (licenseType: LicenseType) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to create an application.",
      });
      return;
    }

    setIsCreating(licenseType.id);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error("Could not retrieve user authentication token.");
      }

      const { applicationId } = await serverActions.createApplicationAction(licenseType.id, idToken);

      toast({
        title: "Application Created",
        description: `Your draft for ${licenseType.name} is ready.`,
      });

      router.push(`/applications/${applicationId}`);

    } catch (error: unknown) {
      const err = (error instanceof Error) ? error : new Error('An unknown error occurred.');
      console.error("Error creating application:", err);
      toast({
        variant: "destructive",
        title: "Failed to Create Application",
        description: err.message,
      });
      setIsCreating(null);
    }
  };

  if (userLoading || (claims && ['reviewer', 'admin', 'head-admin'].includes(claims.role))) {
    return (
      <>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Skeleton className="mb-3 h-8 w-40" />
            <Skeleton className="h-4 w-[400px] max-w-full" />
          </div>
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-[var(--vv-border)] bg-white p-7">
              <Skeleton className="mb-5 h-[52px] w-[52px] rounded-[14px]" />
              <Skeleton className="mb-2 h-6 w-32" />
              <Skeleton className="mb-1 h-4 w-full" />
              <Skeleton className="mb-4 h-4 w-3/4" />
              <Skeleton className="h-3 w-36" />
              <Skeleton className="mt-7 h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <PageTransition>
      <VvPageHeader
        title="New Application"
        sub="Select your license type to begin. Your application will be created as a draft."
        actions={
          <Link href="/applications" className={cn(vvButtonVariants({ variant: "outline" }))}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {licenseTypes.map((license) => {
          const Icon = LICENSE_ICON[license.id] ?? Compass;
          const creating = isCreating === license.id;
          return (
            <div key={license.id} className="flex flex-col overflow-hidden rounded-xl border border-[var(--vv-border)] bg-white">
              <div className="flex-1 p-7">
                <div className="mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-[var(--sky-pale)] text-[var(--sky)]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-outfit text-[22px] font-bold text-[var(--navy)]">{license.name}</h3>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{license.description}</p>
                <div className="mt-4 text-xs text-[var(--text-muted)]">
                  {license.documentRequirements.length} documents required
                </div>
              </div>
              <div className="px-7 pb-7">
                <VvButton
                  variant="sky"
                  className="w-full justify-center"
                  loading={creating}
                  disabled={!!isCreating}
                  onClick={() => handleCreateApplication(license)}
                >
                  Start Application <ArrowRight className="h-3.5 w-3.5" />
                </VvButton>
              </div>
            </div>
          );
        })}
      </div>
    </PageTransition>
  );
}
