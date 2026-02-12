
"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import type { Application, ApplicationDocument, FirebaseTimestamp, FlightLog } from "@/types";
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
  Loader2,
  Download,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { flagExpiringDocuments } from "@/ai/flows/flag-expiring-documents";
import { checkRecency, type CheckRecencyOutput } from "@/ai/flows/check-recency";
import { uploadDocumentAction, uploadFlightLogAction } from "@/app/actions";
import { useFirestore, useStorage, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, serverTimestamp, updateDoc, collection, addDoc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { v4 as uuidv4 } from 'uuid';

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
  const logPdfInputRef = useRef<HTMLInputElement>(null);

  const [recencyResult, setRecencyResult] = useState<CheckRecencyOutput | null>(null);
  const [isRecencyChecking, setIsRecencyChecking] = useState(false);
  const [isUploadingLog, setIsUploadingLog] = useState(false);

  
  const handlePersistChanges = (updates: Partial<Application>, successToast: {title: string, description?: string} | null) => {
    if (!firestore) return;
    const appRef = doc(firestore, 'applications', appState.id);

    const dataToUpdate = {
        ...updates,
        updatedAt: serverTimestamp(),
    };

    updateDoc(appRef, dataToUpdate)
    .then(() => {
        if (successToast) {
            toast(successToast);
        }
    })
    .catch((error) => {
        const permissionError = new FirestorePermissionError({
            path: appRef.path,
            operation: 'update',
            requestResourceData: dataToUpdate,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
            variant: 'destructive',
            title: "Save Failed",
            description: "Your changes could not be saved. Please try again.",
        });
        // Revert to initial state on failure
        setAppState(initialApplication);
    });
  };

  const handleUploadClick = (docId: string) => {
    setActiveUploadDocId(docId);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeUploadDocId) return;

    const docDefinition = appState.documents.find(d => d.id === activeUploadDocId);
    if (!docDefinition) return;

    setUploadingDocId(activeUploadDocId);
    toast({ title: 'Upload Started', description: 'Your document is being uploaded and processed.' });

    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        const dataUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });

        const { storagePath, expiryDate: detectedExpiryDate } = await uploadDocumentAction(
            appState.id,
            activeUploadDocId,
            dataUrl,
            file.name,
            docDefinition.requiresExpiry,
        );

        if (detectedExpiryDate) {
            toast({ title: 'AI Success!', description: `Detected expiry date: ${format(new Date(detectedExpiryDate), 'PPP')}` });
        } else if (docDefinition.requiresExpiry) {
             toast({ variant: "default", title: 'AI Notice', description: 'Could not automatically detect an expiry date. Please enter it manually.' });
        }

        const newDocuments = appState.documents.map((doc) =>
          doc.id === activeUploadDocId
            ? {
                ...doc,
                status: "uploaded" as const,
                fileName: file.name,
                uploadedAt: new Date().toISOString(),
                storagePath: storagePath,
                expiryDate: detectedExpiryDate || doc.expiryDate, // Use detected date, but keep manual if AI fails
              }
            : doc
        );
        
        setAppState((prev) => ({ ...prev, documents: newDocuments }));
        
        handlePersistChanges({ documents: newDocuments }, { title: "Upload Successful", description: `${file.name} has been uploaded and saved.` });

    } catch (error: any) {
        console.error("Upload failed:", error);
        toast({
            variant: "destructive",
            title: "Upload Failed",
            description: error.message || "There was an error uploading your file.",
        });
        setAppState(initialApplication);
    } finally {
        setUploadingDocId(null);
        setActiveUploadDocId(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }
  };


  const handleDateChange = (docId: string, date: string) => {
    const newDocuments = appState.documents.map((doc) =>
        doc.id === docId ? { ...doc, expiryDate: date } : doc
    );

    setAppState((prev) => ({ ...prev, documents: newDocuments }));

    handlePersistChanges(
        { documents: newDocuments }, 
        { title: "Expiry Date Saved", description: "The expiry date has been updated." }
    );
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
    startTransition(() => {
        handlePersistChanges(
            { documents: appState.documents, flightLogs: appState.flightLogs },
            { title: "Draft Saved!", description: "Your changes have been saved." }
        );
    });
  }

  const handleSubmit = () => {
    startTransition(() => {
        if (!firestore) return;
        const finalState = {
            ...appState,
            status: 'submitted' as const,
            submittedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const appRef = doc(firestore, 'applications', appState.id);
        
        updateDoc(appRef, finalState)
        .then(() => {
            setAppState(prev => ({...prev, ...finalState}));

            const notificationsRef = collection(firestore, 'users', appState.userId, 'notifications');
            addDoc(notificationsRef, {
                userId: appState.userId,
                title: `Application Submitted`,
                body: `Your '${appState.licenseType}' application has been submitted for review.`,
                href: `/applications/${appState.id}`,
                isRead: false,
                createdAt: serverTimestamp(),
            }).catch(notifError => console.error("Failed to create notification:", notifError));

            toast({
                title: "Application Submitted!",
                description: "Your application has been submitted for review.",
            });
        })
        .catch(e => {
            const permissionError = new FirestorePermissionError({
                path: appRef.path,
                operation: 'update',
                requestResourceData: finalState,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: "Submission failed", description: "Could not submit your application." });
            setAppState(initialApplication);
        });
    });
  }

  const handleFlightLogUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingLog(true);
    toast({ title: 'AI Processing Started', description: 'Your flight log is being analyzed. This may take a moment.' });

    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        const pdfDataUri = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
        
        const { storagePath, extractedLogs } = await uploadFlightLogAction(
            appState.id,
            pdfDataUri,
            file.name,
        );

        setAppState(prev => ({ ...prev, flightLogs: extractedLogs, flightLogPdfStoragePath: storagePath }));
        
        handlePersistChanges({ flightLogs: extractedLogs, flightLogPdfStoragePath: storagePath }, {
            title: "AI Analysis Complete",
            description: `${extractedLogs.length} recent flight logs have been extracted and saved.`,
        });

    } catch (error: any) {
        console.error("Flight log processing failed:", error);
        toast({
            variant: "destructive",
            title: "Processing Failed",
            description: error.message || "Could not process the flight log PDF. Please try again.",
        });
    } finally {
        setIsUploadingLog(false);
        if (logPdfInputRef.current) {
            logPdfInputRef.current.value = "";
        }
    }
  };

  const handleDownloadLogPdf = async () => {
    if (!storage || !appState.flightLogPdfStoragePath) return;
    try {
        const fileRef = ref(storage, appState.flightLogPdfStoragePath);
        const url = await getDownloadURL(fileRef);
        window.open(url, '_blank');
    } catch (error) {
        console.error("Download failed:", error);
        toast({
            variant: "destructive",
            title: "Download Failed",
            description: "Could not get the download URL for the logbook.",
        });
    }
};

  
  useEffect(() => {
    const handleRecencyCheck = async () => {
        const logs = appState.flightLogs;
        if (!logs || logs.length === 0) {
            setRecencyResult(null);
            setIsRecencyChecking(false);
            return;
        }
        setIsRecencyChecking(true);
        try {
            const result = await checkRecency({
                flights: logs.map(f => ({ date: f.date, duration: f.duration }))
            });
            setRecencyResult(result);
        } catch (error) {
            console.error("Recency check failed:", error);
            toast({
                variant: "destructive",
                title: "AI Check Failed",
                description: "Could not perform pilot recency check.",
            });
        } finally {
            setIsRecencyChecking(false);
        }
    };

    handleRecencyCheck();
  }, [appState.flightLogs, toast]);


  const allDocsUploaded = appState.documents.every(doc => doc.status !== 'missing');
  const isSubmitted = appState.status !== 'draft';

  return (
    <div className="grid gap-8">
      <input type="file" ref={fileInputRef} onChange={handleFileSelected} className="hidden" accept="image/png, image/jpeg, image/webp,application/pdf" />
      <input type="file" ref={logPdfInputRef} onChange={handleFlightLogUpload} accept="application/pdf" className="hidden" />
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
            <CardTitle>Flight Logs</CardTitle>
            <CardDescription>Upload a PDF of your flight logbook. The AI will extract recent flights automatically.</CardDescription>
        </CardHeader>
        <CardContent>
            {isRecencyChecking ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>AI is analyzing flight logs...</span>
                </div>
            ) : recencyResult ? (
                <div className={`p-4 rounded-md flex items-start gap-4 mb-6 ${recencyResult.hasRecency ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {recencyResult.hasRecency ? <Check className="h-5 w-5 flex-shrink-0 mt-0.5" /> : <X className="h-5 w-5 flex-shrink-0 mt-0.5" />}
                    <div>
                        <h4 className="font-semibold">
                            {recencyResult.hasRecency ? 'Recency Requirement Met' : 'Recency Requirement Not Met'}
                        </h4>
                        <p className="text-sm">
                            You have logged <strong>{recencyResult.totalHours} hours</strong> in the last 6 months.
                        </p>
                    </div>
                </div>
            ) : null}

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Aircraft</TableHead>
                        <TableHead>Instructor</TableHead>
                        <TableHead className="text-right">Duration (hrs)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <>
                        {appState.flightLogs && appState.flightLogs.length > 0 ? (
                            appState.flightLogs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell>{format(new Date(log.date), 'PPP')}</TableCell>
                                    <TableCell>{log.aircraft}</TableCell>
                                    <TableCell>{log.instructorName || 'N/A'}</TableCell>
                                    <TableCell className="text-right">{log.duration.toFixed(2)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">No flight logs have been extracted yet.</TableCell>
                            </TableRow>
                        )}
                    </>
                </TableBody>
            </Table>
        </CardContent>
        <CardFooter className="flex items-center gap-2 border-t pt-6">
            <Button
                variant="outline"
                onClick={() => logPdfInputRef.current?.click()}
                disabled={isSubmitted || isUploadingLog}
            >
                {isUploadingLog ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                {appState.flightLogPdfStoragePath ? 'Replace PDF' : 'Upload Log PDF'}
            </Button>
            {appState.flightLogPdfStoragePath && (
                <Button variant="secondary" onClick={handleDownloadLogPdf} disabled={isUploadingLog}>
                    <Download className="mr-2 h-4 w-4" /> Download PDF
                </Button>
            )}
        </CardFooter>
      </Card>


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
