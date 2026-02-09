'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { licenseTypes } from "@/lib/licensing";
import { useState } from 'react';
import { redirect } from 'next/navigation';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import type { LicenseType } from '@/lib/licensing';
import { useToast } from '@/hooks/use-toast';
import { LoadingScreen } from "@/components/LoadingScreen";
import { useRouter } from "next/navigation";

function NewApplicationButton({ licenseType }: { licenseType: LicenseType }) {
  const [isCreating, setIsCreating] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const handleCreateApplication = async () => {
    if (!firestore || !user) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "You must be logged in to create an application.",
        });
        return;
    }

    setIsCreating(true);
    try {
      const docData = {
        userId: user.uid,
        licenseType: licenseType.name,
        status: 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        feedback: "",
        documents: licenseType.documentRequirements.map((req, index) => ({
          id: `doc${index + 1}`,
          docRequirementId: req.id,
          name: req.name,
          description: req.description,
          status: 'missing',
          requiresExpiry: req.requiresExpiry,
        })),
        flightLogs: [],
      };

      const newAppRef = await addDoc(collection(firestore, 'applications'), docData);
      
      toast({
        title: "Application Created",
        description: `Your draft for ${licenseType.name} is ready.`,
      });

      router.push(`/applications/${newAppRef.id}`);

    } catch (error: any) {
      console.error("Error creating application:", error);
      toast({
        variant: "destructive",
        title: "Failed to Create Application",
        description: error.message,
      });
      setIsCreating(false);
    }
  };

  return (
    <Button onClick={handleCreateApplication} disabled={isCreating}>
      {isCreating ? (
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
  );
}


export default function NewApplicationPage() {
  const { claims, loading: userLoading } = useUser();

  if (userLoading) {
    return <LoadingScreen text="Verifying access..." />;
  }

  if (claims && ['reviewer', 'admin', 'head-admin'].includes(claims.role)) {
    redirect('/admin');
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-4">
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
              <NewApplicationButton licenseType={license} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
