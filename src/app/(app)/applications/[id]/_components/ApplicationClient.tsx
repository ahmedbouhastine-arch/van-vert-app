
"use client";

import { useState, useTransition, useRef, useEffect, useMemo } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
  RefreshCw,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { checkRecency, type CheckRecencyOutput } from "@/ai/flows/check-recency";
import * as serverActions from '@/app/actions';
import { useFirestore, errorEmitter, FirestorePermissionError, useAuth, useFirebaseApp } from "@/firebase";
import { doc, serverTimestamp, updateDoc, collection, addDoc } from "firebase/firestore";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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

function getErrorMessage(err: unknown): string {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  const e = err as { message?: unknown };
  if (typeof e.message === 'string') return e.message;
  return 'An unexpected error occurred';
}

// Safe date formatter for flight logs
function formatFlightDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr; // return raw string if invalid
    return format(date, 'PPP');
  } catch {
    return dateStr; // fallback to raw string
  }
}

function DocumentCard({
  doc,
  onUpload,
  onDateChange,
  onClearDate,
  isSubmitted,
  isUploading,
  onCheckExpiry,
  isCheckingExpiry,
}: {
  doc: ApplicationDocument;
  onUpload: (docId: string) => void;
  onDateChange: (docId: string, date: string) => void;
  onClearDate: (docId: string) => void;
  isSubmitted: boolean;
  isUploading: boolean;
  onCheckExpiry: (docId: string) => void;
  isCheckingExpiry: boolean;
}) {
  const isButtonDisabled = isSubmitted || isUploading;
  const isExpiryCheckDisabled = isButtonDisabled || isCheckingExpiry;

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
          <div className="mt-4 space-y-2">
            <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor={`expiry-${doc.id}`} className="text-xs">
                Expiry Date
                </Label>
                <div className="flex w-full max-w-sm items-center space-x-2">
                    <Input
                    id={`expiry-${doc.id}`}
                    type="date"
                    value={doc.expiryDate || ''}
                    onChange={(e) => onDateChange(doc.id, e.target.value)}
                    disabled={doc.status === "missing" || isSubmitted}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => onClearDate(doc.id)}
                        disabled={doc.status === 'missing' || isSubmitted || !doc.expiryDate}
                        aria-label="Clear date"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            {doc.status !== 'missing' && (
                <Button variant="secondary" size="sm" onClick={() => onCheckExpiry(doc.id)} disabled={isExpiryCheckDisabled} className="w-full max-w-sm">
                    {isCheckingExpiry ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                    AI Check Expiry
                </Button>
            )}
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

const ITEMS_PER_PAGE = 20;

export function ApplicationClient({
  application: initialApplication,
}: {
  application: Application;
}) {
  const [appState, setAppState] = useState<Application>(initialApplication);
  const [isPending, startTransition] = useTransition();
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [activeUploadDocId, setActiveUploadDocId] = useState<string | null>(null);
  const [checkingExpiryDocId, setCheckingExpiryDocId] = useState<string | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();
  const app = useFirebaseApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logPdfInputRef = useRef<HTMLInputElement>(null);

  const [recencyResult, setRecencyResult] = useState<CheckRecencyOutput | null>(null);
  const [isRecencyChecking, setIsRecencyChecking] = useState(false);
  const [isUploadingLog, setIsUploadingLog] = useState(false);
  const [selectedFlightTypeFilter, setSelectedFlightTypeFilter] = useState<'All' | 'PIC' | 'Solo' | 'Dual'>('All');
  const [currentPage, setCurrentPage] = useState(1);

  const flightLogs = appState.flightLogs || [];

  const totalFlightHours = useMemo(() => {
    return flightLogs.reduce((sum, log) => sum + (Number(log.duration) || 0), 0);
  }, [flightLogs]);

  const picHours = useMemo(() => {
    return flightLogs.filter(log => log.flightType === 'PIC').reduce((sum, log) => sum + (Number(log.duration) || 0), 0);
  }, [flightLogs]);

  const soloHours = useMemo(() => {
    return flightLogs.filter(log => log.flightType === 'Solo').reduce((sum, log) => sum + (Number(log.duration) || 0), 0);
  }, [flightLogs]);

  const dualHours = useMemo(() => {
    return flightLogs.filter(log => log.flightType === 'Dual').reduce((sum, log) => sum + (Number(log.duration) || 0), 0);
  }, [flightLogs]);

  const filteredFlightLogs = useMemo(() => {
    if (selectedFlightTypeFilter === 'All') {
      return flightLogs;
    }
    return flightLogs.filter(log => log.flightType === selectedFlightTypeFilter);
  }, [flightLogs, selectedFlightTypeFilter]);

  const totalFilteredFlights = filteredFlightLogs.length;
  const totalPages = Math.ceil(totalFilteredFlights / ITEMS_PER_PAGE);
  const paginatedFlights = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredFlightLogs.slice(startIndex, endIndex);
  }, [filteredFlightLogs, currentPage]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFlightTypeFilter]);
  
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
    .catch(() => {
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
    toast({ title: 'Upload Started', description: 'Your document is being uploaded.' });

    try {
      const storage = getStorage(app);
      const storageRef = ref(storage, `applications/${appState.id}/${activeUploadDocId}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const publicUrl = await getDownloadURL(snapshot.ref);

      let detectedExpiryDate: string | null = null;
      if (docDefinition.requiresExpiry && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
        toast({ title: 'AI Processing', description: 'Analyzing document for expiry date.' });
        const idToken = await auth.currentUser?.getIdToken();
        const { expiryDate } = await serverActions.extractExpiryDateAction({ 
          applicationId: appState.id,
          documentUrl: publicUrl,
          idToken 
        });
        detectedExpiryDate = expiryDate || null;
      }

      if (detectedExpiryDate) {
        toast({ title: 'AI Success!', description: `Detected expiry date: ${format(new Date(detectedExpiryDate), 'PPP')}` });
      } else if (docDefinition.requiresExpiry) {
        toast({ variant: "default", title: 'AI Notice', description: 'Could not automatically detect an expiry date. Please enter it manually.' });
      }

      const newDocuments = appState.documents.map((doc) => {
        if (doc.id === activeUploadDocId) {
          return {
            ...doc,
            status: "uploaded" as const,
            fileName: file.name,
            fileType: file.type || '',
            fileUrl: publicUrl,
            uploadedAt: new Date().toISOString(),
            expiryDate: detectedExpiryDate || doc.expiryDate || '',
          };
        }
        return doc;
      });

      setAppState((prev) => ({ ...prev, documents: newDocuments }));

      handlePersistChanges({ documents: newDocuments }, { title: "Upload Successful", description: `${file.name} has been uploaded and saved.` });

    } catch (error: unknown) {
      console.error("Upload failed:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: getErrorMessage(error) || "There was an error uploading your file.",
      });
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
  
  const handleClearDate = (docId: string) => {
    const newDocuments = appState.documents.map((doc) =>
        doc.id === docId ? { ...doc, expiryDate: "" } : doc
    );

    setAppState((prev) => ({ ...prev, documents: newDocuments }));

    handlePersistChanges(
        { documents: newDocuments }, 
        { title: "Expiry Date Cleared", description: "The expiry date has been removed." }
    );
  };

  const handleCheckSingleExpiry = (docId: string) => {
    startTransition(async () => {
        setCheckingExpiryDocId(docId);
        toast({ title: 'AI Check In Progress...', description: 'Analyzing document to find expiry date.' });
        
        try {
          const idToken = await auth.currentUser?.getIdToken();
          const { expiryDate } = await serverActions.getExpiryDateForSingleDocumentAction(appState.id, docId, idToken);

            if (expiryDate) {
                const newDocuments = appState.documents.map(doc => 
                    doc.id === docId ? { ...doc, expiryDate: expiryDate } : doc
                );
                setAppState(prev => ({ ...prev, documents: newDocuments }));
                
                handlePersistChanges(
                    { documents: newDocuments },
                    { 
                        title: "AI Success!", 
                        description: `Detected expiry date: ${format(new Date(expiryDate), 'PPP')}.` 
                    }
                );
            } else {
                 toast({ title: 'AI Check Complete', description: 'No expiry date was found in the document.' });
            }
        } catch (error: unknown) {
          toast({ variant: 'destructive', title: 'AI Check Failed', description: getErrorMessage(error) });
        } finally {
            setCheckingExpiryDocId(null);
        }
    });
  };

  const handleSaveDraft = () => {
    startTransition(() => {
        handlePersistChanges(
            { documents: appState.documents, flightLogs: appState.flightLogs, totalFlightHours },
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
            totalFlightHours,
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
        .catch(() => {
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
      const idToken = await auth.currentUser?.getIdToken();

      const formData = new FormData();
      formData.append('applicationId', appState.id);
      formData.append('file', file);

      const { publicUrl, extractedLogs } = await serverActions.uploadFlightLogAction(formData, idToken);

        setAppState(prev => ({ ...prev, flightLogs: extractedLogs, flightLogPdfUrl: publicUrl }));
        
        handlePersistChanges({ flightLogs: extractedLogs, flightLogPdfUrl: publicUrl }, {
            title: "AI Analysis Complete",
            description: `${extractedLogs.length} recent flight logs have been extracted and saved.`,
        });

    } catch (error: unknown) {
      console.error("Flight log processing failed:", error);
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description: getErrorMessage(error) || "Could not process the flight log PDF. Please try again.",
      });
    } finally {
        setIsUploadingLog(false);
        if (logPdfInputRef.current) {
            logPdfInputRef.current.value = "";
        }
    }
  };

  const handleDownloadLogPdf = async () => {
    if (!appState.flightLogPdfUrl) return;
    window.open(appState.flightLogPdfUrl, '_blank');
  };

  const handleRecalculateHours = () => {
    const logs = appState.flightLogs || [];
    const total = logs.reduce((sum, log) => sum + (Number(log.duration) || 0), 0);
    // setTotalFlightHours(total); // No longer needed as totalFlightHours is a useMemo
    
    toast({
        title: "Hours Recalculated",
        description: `Total hours: ${total.toFixed(2)}.`,
    });
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
            onClearDate={handleClearDate}
            isSubmitted={isSubmitted}
            isUploading={uploadingDocId === doc.id}
            onCheckExpiry={handleCheckSingleExpiry}
            isCheckingExpiry={checkingExpiryDocId === doc.id}
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
            <div className="flex items-start justify-between">
                <div>
                    <CardTitle>Flight Logs</CardTitle>
                    <CardDescription>Upload a PDF of your flight logbook. The AI will extract recent flights automatically.</CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                    {totalFlightHours > 0 && (
                        <div className="text-right">
                            <p className="text-3xl font-bold">{totalFlightHours.toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">Total Hours</p>
                        </div>
                    )}
                    {appState.flightLogs && appState.flightLogs.length > 0 && (
                        <Button onClick={handleRecalculateHours} variant="secondary" size="sm" className="mt-2">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Recalculate
                        </Button>
                    )}
                </div>
            </div>
        </CardHeader>
        <CardContent>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="bg-card text-card-foreground shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                        <Loader2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalFlightHours.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card className="bg-card text-card-foreground shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">PIC Hours</CardTitle>
                        <Bot className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{picHours.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card className="bg-card text-card-foreground shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Solo Hours</CardTitle>
                        <Bot className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{soloHours.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card className="bg-card text-card-foreground shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dual Hours</CardTitle>
                        <Bot className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{dualHours.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            {isRecencyChecking ? (
                <div className="flex items-center gap-2 text-muted-foreground mb-6">
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

            <Tabs defaultValue="All" onValueChange={(value) => setSelectedFlightTypeFilter(value as 'All' | 'PIC' | 'Solo' | 'Dual')}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="All">All</TabsTrigger>
                    <TabsTrigger value="PIC">PIC</TabsTrigger>
                    <TabsTrigger value="Solo">Solo</TabsTrigger>
                    <TabsTrigger value="Dual">Dual</TabsTrigger>
                </TabsList>
                {/* The TabsContent will render the same table, filtered by selectedFlightTypeFilter */}
                <TabsContent value={selectedFlightTypeFilter} className="mt-4">
                    <div className="mb-4 text-sm text-muted-foreground">
                        Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalFilteredFlights)}-{Math.min(currentPage * ITEMS_PER_PAGE, totalFilteredFlights)} of {totalFilteredFlights} flights
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Date</TableHead>
                                <TableHead>Aircraft</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Duration (hrs)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedFlights && paginatedFlights.length > 0 ? (
                                paginatedFlights.map((log, index) => (
                                    <TableRow key={log.id} className={index % 2 === 0 ? 'bg-muted/30 hover:bg-muted' : 'hover:bg-muted'}>
                                        <TableCell>{formatFlightDate(log.date)}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{log.aircraft}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={
                                                    log.flightType === 'PIC' ? 'bg-blue-600 text-blue-50 hover:bg-blue-500' :
                                                    log.flightType === 'Solo' ? 'bg-green-600 text-green-50 hover:bg-green-500' :
                                                    log.flightType === 'Dual' ? 'bg-orange-600 text-orange-50 hover:bg-orange-500' :
                                                    'bg-gray-600 text-gray-50 hover:bg-gray-500'
                                                }
                                                variant="outline"
                                            >
                                                {log.flightType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{log.duration.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">No flight logs have been extracted yet or match the current filter.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-2" />Previous
                        </Button>
                        <div className="flex items-center space-x-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "secondary" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(page)}
                                    className={currentPage === page ? "bg-primary text-primary-foreground" : ""}
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next<ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>
        </CardContent>
        <CardFooter className="flex items-center gap-2 border-t pt-6">
            <Button
                variant="outline"
                onClick={() => logPdfInputRef.current?.click()}
                disabled={isSubmitted || isUploadingLog}
            >
                {isUploadingLog ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                {appState.flightLogPdfUrl ? 'Replace PDF' : 'Upload Log PDF'}
            </Button>
            {appState.flightLogPdfUrl && (
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
        <CardContent className="grid sm:grid-cols-2 gap-4">
            <Button onClick={handleSaveDraft} disabled={isPending || isSubmitted} variant="outline">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Draft
            </Button>
            <Button onClick={handleSubmit} disabled={!allDocsUploaded || isSubmitted || isPending} className="sm:col-start-2">
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
