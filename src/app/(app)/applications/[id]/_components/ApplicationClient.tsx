
"use client";

import { useState, useTransition, useRef } from "react";
import type { Application, ApplicationDocument, FirebaseTimestamp } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import {
  AlertCircle,
  Bot,
  Check,
  File as FileIcon,
  UploadCloud,
  Save,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { flagExpiringDocuments } from "@/ai/flows/flag-expiring-documents";
import { useFirestore, useStorage } from "@/firebase";
import { doc, serverTimestamp, updateDoc, collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Helper function to safely format dates, whether they are Timestamps or strings
const safeFormatDate = (date: FirebaseTimestamp | Date | string | undefined | null, formatString: string) => {
  if (!date) return 'N/A';
  try {
    if (typeof date === 'object' && date && 'toDate' in date && typeof date.toDate === 'function') {
      return format(date.toDate(), formatString);
    }
    return format(new Date(date as string), formatString);
  } catch (error) {
    console.error("Date formatting failed:", error);
    return "Invalid Date";
  }
};

async function checkExpiryAction(documents: ApplicationDocument[]) {
    const docsToCheck = documents
      .filter((doc) => doc.status === "uploaded" && doc.requiresExpiry && doc.expiryDate)
      .map((doc) => ({
        name: doc.name,
        expiryDate: doc.expiryDate!,
      }));
  
    if (docsToCheck.length === 0) {
      return [];
    }
  
    const results = await flagExpiringDocuments({
      documents: docsToCheck,
      daysUntilExpiry: 90,
    });
    return results;
  }

function DocumentCard({
  doc,
  onUpload,
  onDateChange,
  isSubmitted,
  isUploading,
}: {
  doc: ApplicationDocument;
  onUpload: (docId: string) => void;
  onDateChange: (docId: string, date: string) => void;
  isSubmitted: boolean;
  isUploading: boolean;
}) {
  const isButtonDisabled = isSubmitted || isUploading;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-4 bg-muted/50 p-4">
        <div>
          <CardTitle className="text-base font-medium">{doc.name}</CardTitle>
          <CardDescription className="text-xs mt-1">
            {doc.description}
          </CardDescription>
        </div>
        <StatusBadge status={doc.status} />
      </CardHeader>
      <CardContent className="p-4 text-sm">
        {doc.status === "missing" && (
          <Button variant="outline" onClick={() => onUpload(doc.id)} disabled={isButtonDisabled}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        )}
        {doc.status !== "missing" && (
          <div className="flex items-center gap-4 text-muted-foreground">
            <FileIcon className="h-5 w-5" />
            <span className="font-medium text-foreground truncate">{doc.fileName}</span>
            <Button variant="link" size="sm" onClick={() => onUpload(doc.id)} disabled={isButtonDisabled}>
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Replace'}
            </Button>
          </div>
        )}
        {doc.requiresExpiry && (
          <div className="mt-4 grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor={`expiry-${doc.id}`} className="text-xs">
              Expiry Date
            </Label>
            <Input
              id={`expiry-${doc.id}`}
              type="date"
              value={doc.expiryDate || ''}
              onChange={(e) => onDateChange(doc.id, e.target.value)}
              disabled={doc.status === "missing" || isSubmitted}
            />
          </div>
        )}
        {doc.isExpiringSoon && (
            <Alert variant="destructive" className="mt-4 bg-orange-50 border-orange-200 text-orange-700 [&>svg]:text-orange-700">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="font-semibold text-orange-800">Expiry Warning</AlertTitle>
                <AlertDescription className="text-orange-700">
                    This document is expiring soon. Please upload a renewed version.
                </AlertDescription>
            </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export function ApplicationClient({
  application: initialApplication,
}: {
  application: Application;
}) {
  const [appState, setAppState] = useState<Application>(initialApplication);
  const [isPending, startTransition] = useTransition();
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [activeUploadDocId, setActiveUploadDocId] = useState<string | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const storage = useStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePersistChanges = async (updates: Partial<Application>) => {
    if (!firestore) return;
    const appRef = doc(firestore, 'applications', appState.id);
    await updateDoc(appRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
  };

  const handleUploadClick = (docId: string) => {
    setActiveUploadDocId(docId);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeUploadDocId || !storage) return;

    setUploadingDocId(activeUploadDocId);

    try {
        const storageRef = ref(storage, `applications/${appState.id}/${activeUploadDocId}/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        const newDocuments = appState.documents.map((doc) =>
          doc.id === activeUploadDocId
            ? {
                ...doc,
                status: "uploaded" as const,
                fileName: file.name,
                uploadedAt: new Date().toISOString(),
                storagePath: storageRef.fullPath,
              }
            : doc
        );
        
        await handlePersistChanges({ documents: newDocuments });

        setAppState((prev) => ({ ...prev, documents: newDocuments }));
        
        toast({ title: "Upload Successful", description: `${file.name} has been uploaded and saved.` });

    } catch (error) {
        console.error("Upload failed:", error);
        toast({
            variant: "destructive",
            title: "Upload Failed",
            description: "There was an error uploading and saving your file.",
        });
    } finally {
        setUploadingDocId(null);
        setActiveUploadDocId(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }
  };


  const handleDateChange = async (docId: string, date: string) => {
    const newDocuments = appState.documents.map((doc) =>
        doc.id === docId ? { ...doc, expiryDate: date } : doc
    );

    // Optimistically update the UI
    setAppState((prev) => ({ ...prev, documents: newDocuments }));

    try {
        await handlePersistChanges({ documents: newDocuments });
        toast({
            title: "Expiry Date Saved",
            description: "The expiry date has been updated.",
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: "Save Failed",
            description: "Could not save the expiry date. Please try again.",
        });
        // Revert optimistic update on failure
        setAppState(initialApplication);
    }
  };
  
  const handleCheckExpiry = () => {
    startTransition(async () => {
        toast({ title: 'AI Check In Progress...', description: 'Checking for documents that are expiring soon.' });
        const results = await checkExpiryAction(appState.documents);

        if (results.length === 0) {
            toast({ title: 'AI Check Complete', description: 'No documents are expiring within 90 days.' });
            return;
        }

        const updatedDocs = appState.documents.map(doc => {
            const checkResult = results.find(r => r.name === doc.name);
            if (checkResult?.isExpiringSoon) {
                return { ...doc, isExpiringSoon: true, status: 'needs_attention' as const };
            }
            return doc;
        });

        setAppState(prev => ({ ...prev, documents: updatedDocs }));

        toast({
            variant: 'destructive',
            title: 'Action Required',
            description: `${results.filter(r => r.isExpiringSoon).length} document(s) are expiring soon.`,
          });
    });
  };

  const handleSaveDraft = () => {
    startTransition(async () => {
        try {
            await handlePersistChanges({ documents: appState.documents });
            toast({
                title: "Draft Saved!",
                description: "Your changes have been saved.",
            });
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Save failed", description: e.message });
        }
    });
  }

  const handleSubmit = () => {
    startTransition(async () => {
        try {
            const finalState = {
                ...appState,
                status: 'submitted' as const,
                submittedAt: serverTimestamp(),
            };
            await handlePersistChanges(finalState);
            setAppState(finalState); // Update local state to reflect submission
             if (firestore) {
                const notificationsRef = collection(firestore, 'users', appState.userId, 'notifications');
                await addDoc(notificationsRef, {
                    userId: appState.userId,
                    title: `Application Submitted`,
                    body: `Your '${appState.licenseType}' application has been submitted for review.`,
                    href: `/applications/${appState.id}`,
                    isRead: false,
                    createdAt: serverTimestamp(),
                });
            }
            toast({
                title: "Application Submitted!",
                description: "Your application has been submitted for review.",
            });
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Submission failed", description: e.message });
        }
    });
  }

  const allDocsUploaded = appState.documents.every(doc => doc.status !== 'missing');
  const isSubmitted = appState.status !== 'draft';

  return (
    <div className="grid gap-8">
      <input type="file" ref={fileInputRef} onChange={handleFileSelected} className="hidden" />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-headline">{appState.licenseType}</CardTitle>
            <StatusBadge status={appState.status} />
          </div>
          <CardDescription>
            Last updated on {safeFormatDate(appState.updatedAt, "MMMM d, yyyy")}
            {appState.submittedAt && ` | Submitted on ${safeFormatDate(appState.submittedAt, "MMMM d, yyyy")}`}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        <h2 className="font-semibold text-lg">Required Documents</h2>
        {appState.documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            doc={doc}
            onUpload={handleUploadClick}
            onDateChange={handleDateChange}
            isSubmitted={isSubmitted}
            isUploading={uploadingDocId === doc.id}
          />
        ))}
      </div>

       {appState.feedback && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Feedback from Admin</AlertTitle>
          <AlertDescription>{appState.feedback}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
            <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button onClick={handleCheckExpiry} disabled={isPending || isSubmitted} variant="secondary">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                AI Check Document Expiry
            </Button>
            <Button onClick={handleSaveDraft} disabled={isPending || isSubmitted} variant="outline">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Draft
            </Button>
            <Button onClick={handleSubmit} disabled={!allDocsUploaded || isSubmitted || isPending}>
                <Check className="mr-2 h-4 w-4" /> 
                {isSubmitted ? 'Submitted' : 'Submit Application'}
            </Button>
        </CardContent>
        {!allDocsUploaded && !isSubmitted && (
             <CardFooter>
                 <p className="text-sm text-muted-foreground">You must upload all required documents before submitting.</p>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
