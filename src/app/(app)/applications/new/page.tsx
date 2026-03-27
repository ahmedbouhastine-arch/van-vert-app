
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { licenseTypes } from "@/lib/licensing";
import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import type { LicenseType } from '@/lib/licensing';
import { useToast } from '@/hooks/use-toast';
import { LoadingScreen } from "@/components/LoadingScreen";
import { useRouter } from "next/navigation";
import * as serverActions from "@/app/actions";
import { PageTransition } from "@/components/PageTransition";

export default function NewApplicationPage() {
  const { user, claims, loading: userLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState<string | null>(null);

  // Redirect admins/reviewers away from this page
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

  // Show a loading screen while user data is being fetched or if they are being redirected.
  if (userLoading || (claims && ['reviewer', 'admin', 'head-admin'].includes(claims.role))) {
    return <LoadingScreen text="Verifying access..." />;
  }

  return (
    <PageTransition className="mx-auto grid w-full max-w-4xl gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Start a New Application
        </h1>
        <p className="text-muted-foreground">
          Select the type of license you are applying for.
        </p>
      </div>
      <div className="grid gap-6">
        {licenseTypes.map((license) => (
          <Card key={license.id}>
            <CardHeader>
              <CardTitle className="font-headline">{license.name}</CardTitle>
              <CardDescription>{license.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={() => handleCreateApplication(license)} disabled={!!isCreating}>
                  {isCreating === license.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Start Application <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageTransition>
  );
}
