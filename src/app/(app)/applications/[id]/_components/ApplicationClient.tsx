
"use client";

import { useState, useTransition, useRef, useEffect, useMemo } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Application, ApplicationDocument, FirebaseTimestamp, FlightLog } from "@/types";
import { Button } from "@/components/ui/button";
import { VvButton } from "@/components/vv/VvButton";
import { VvStatusBadge, type VvStatusBadgeProps } from "@/components/vv/VvStatusBadge";
import { cn } from "@/lib/utils";
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
  ChevronLeft, ChevronRight, Edit2,
  Plus, Trash2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parse, isValid } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { checkRecency, type CheckRecencyOutput } from "@/ai/flows/check-recency";
import * as serverActions from '@/app/actions';
import { useFirestore, errorEmitter, FirestorePermissionError, useAuth, useFirebaseApp } from "@/firebase";
import { doc, serverTimestamp, updateDoc, collection, addDoc } from "firebase/firestore";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { v4 as uuidv4 } from 'uuid';

// Upload limits
const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_PDF_PAGES = 64;

/** Lightweight PDF page counter — counts /Type /Page (not /Pages) occurrences. */
async function countPdfPages(file: File): Promise<number> {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const text = new TextDecoder('latin1').decode(bytes);
    // Match "/Type /Page" but NOT "/Type /Pages" to count individual pages
    const matches = text.match(/\/Type\s*\/Page(?!s)/g);
    return matches ? matches.length : 0;
  } catch {
    return 0; // If we can't parse it, let the server handle validation
  }
}

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Storage Security Rules read application ownership from Firestore via a cross-service
// get(), which can lag a few seconds behind a just-created application document. Retry
// on 'storage/unauthorized' to ride out that propagation window instead of failing
// uploads attempted right after creating an application.
const UPLOAD_RETRY_DELAYS_MS = [1500, 3000];

async function uploadBytesWithRetry(storageRef: ReturnType<typeof ref>, file: File) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await uploadBytes(storageRef, file);
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code !== 'storage/unauthorized' || attempt >= UPLOAD_RETRY_DELAYS_MS.length) {
        throw error;
      }
      await sleep(UPLOAD_RETRY_DELAYS_MS[attempt]);
    }
  }
}

type VvBadgeStatus = NonNullable<VvStatusBadgeProps["status"]>;

const APP_STATUS_TO_BADGE: Record<Application["status"], VvBadgeStatus> = {
  draft: "draft",
  submitted: "submitted",
  in_review: "in-review",
  needs_attention: "needs-attention",
  approved: "ready",
  rejected: "missing",
};

const DOC_STATUS_TO_BADGE: Record<ApplicationDocument["status"], VvBadgeStatus> = {
  missing: "missing",
  uploaded: "submitted",
  needs_attention: "needs-attention",
  approved: "ready",
  rejected: "missing",
};

const DOC_STATUS_LABEL: Record<ApplicationDocument["status"], string> = {
  missing: "Missing",
  uploaded: "Uploaded",
  needs_attention: "Needs attention",
  approved: "Approved",
  rejected: "Rejected",
};

// Safe date formatter for flight logs
function formatFlightDate(dateStr: string): string {
  if (dateStr.endsWith('-00')) {
    const [year, month] = dateStr.split('-');
    const monthName = new Date(`${year}-${month}-01`).toLocaleString('default', { month: 'long' });
    return `${monthName} ${year} (day unknown)`;
  }
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr; // return raw string if invalid
    return format(date, 'MMM d, yyyy');
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
    <div className="overflow-hidden rounded-xl border border-[var(--vv-border)] bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--vv-border-soft)] bg-[var(--surface)] p-4">
        <div>
          <h3 className="font-outfit text-[15px] font-semibold text-[var(--navy)]">{doc.name}</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{doc.description}</p>
        </div>
        <VvStatusBadge status={DOC_STATUS_TO_BADGE[doc.status] ?? "missing"}>{DOC_STATUS_LABEL[doc.status] ?? doc.status}</VvStatusBadge>
      </div>
      <div className="p-4 text-sm">
        {doc.status === "missing" && (
          <VvButton variant="outline" size="sm" onClick={() => onUpload(doc.id)} disabled={isButtonDisabled} loading={isUploading}>
            <UploadCloud className="h-3.5 w-3.5" />
            {isUploading ? 'Uploading...' : 'Upload document'}
          </VvButton>
        )}
        {doc.status !== "missing" && (
          <div className="flex items-center gap-3 text-[var(--text-secondary)]">
            <FileIcon className="h-5 w-5 text-[var(--sky)]" />
            <span className="truncate font-medium text-[var(--text-primary)]">{doc.fileName}</span>
            <button
              onClick={() => onUpload(doc.id)}
              disabled={isButtonDisabled}
              className="text-xs font-semibold text-[var(--sky)] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Replace'}
            </button>
          </div>
        )}
        {doc.requiresExpiry && (
          <div className="mt-4 space-y-2">
            <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor={`expiry-${doc.id}`} className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Expiry date
                </Label>
                <div className="flex w-full max-w-sm items-center space-x-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            id={`expiry-${doc.id}`}
                            type="button"
                            variant="outline"
                            disabled={doc.status === "missing" || isSubmitted}
                            className={cn(
                                "w-full justify-start rounded-lg border-[var(--vv-border)] font-normal focus-visible:ring-[var(--sky)]",
                                !doc.expiryDate && "text-muted-foreground"
                            )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {doc.expiryDate && isValid(parse(doc.expiryDate, 'yyyy-MM-dd', new Date()))
                                    ? format(parse(doc.expiryDate, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy')
                                    : <span>dd/mm/yyyy</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={doc.expiryDate && isValid(parse(doc.expiryDate, 'yyyy-MM-dd', new Date())) ? parse(doc.expiryDate, 'yyyy-MM-dd', new Date()) : undefined}
                                onSelect={(date) => date && onDateChange(doc.id, format(date, 'yyyy-MM-dd'))}
                                autoFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => onClearDate(doc.id)}
                        disabled={doc.status === 'missing' || isSubmitted || !doc.expiryDate}
                        aria-label="Clear date"
                        className="shrink-0 rounded-lg border-[var(--vv-border)]"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    {doc.status !== 'missing' && (
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => onCheckExpiry(doc.id)}
                            disabled={isExpiryCheckDisabled}
                            aria-label="Retry AI expiry check"
                            title="Retry AI expiry check"
                            className="shrink-0 rounded-lg border-[var(--vv-border)]"
                        >
                            {isCheckingExpiry ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                        </Button>
                    )}
                </div>
            </div>
          </div>
        )}
        {doc.isExpiringSoon && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-[var(--status-attention)]/30 bg-[var(--status-attention)]/10 p-3.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-attention)]" />
                <div>
                    <p className="text-sm font-semibold text-[var(--navy)]">Expiry warning</p>
                    <p className="mt-0.5 text-sm text-[var(--text-secondary)]">This document is expiring soon. Please upload a renewed version.</p>
                </div>
            </div>
        )}
      </div>
    </div>
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
  const [selectedFlightTypeFilter, setSelectedFlightTypeFilter] = useState<'All' | 'PIC' | 'Solo' | 'Dual' | 'Instrument'>('All');
  const [currentPage, setCurrentPage] = useState(1);

  const [isReviewMode, setIsReviewMode] = useState(false);
  const [editableFlights, setEditableFlights] = useState<FlightLog[]>([]);
  const [isSavingLogs, setIsSavingLogs] = useState(false);

  const flightLogs = useMemo(() => appState.flightLogs || [], [appState.flightLogs]);
  const logbookFormat = appState.logbookFormat || 'simple';

  const calculateHours = (logs: FlightLog[], type: 'total' | 'PIC' | 'Solo' | 'Dual' | 'Instrument') => {
    return logs.reduce((sum, log) => {
      if (type === 'total') return sum + (log.duration || 0);
      if (type === 'PIC') return sum + (log.pilotInCommand || 0);
      if (type === 'Solo') return sum + (log.solo || 0);
      if (type === 'Dual') return sum + (log.dualReceived || 0);
      if (type === 'Instrument') return sum + (log.instrumentSimulatedHours || 0);
      return sum;
    }, 0);
  };

  const totalFlightHours = useMemo(() => calculateHours(flightLogs, 'total'), [flightLogs]);
  const picHours = useMemo(() => calculateHours(flightLogs, 'PIC'), [flightLogs]);
  const soloHours = useMemo(() => calculateHours(flightLogs, 'Solo'), [flightLogs]);
  const dualHours = useMemo(() => calculateHours(flightLogs, 'Dual'), [flightLogs]);
  const instrumentSimHours = useMemo(() => calculateHours(flightLogs, 'Instrument'), [flightLogs]);

  const filteredFlightLogs = useMemo(() => {
    if (selectedFlightTypeFilter === 'All') {
      return flightLogs;
    }
    return flightLogs.filter(log => {
        if (selectedFlightTypeFilter === 'Dual' && (log.dualReceived || 0) > 0) return true;
        if (selectedFlightTypeFilter === 'PIC' && (log.pilotInCommand || 0) > 0) return true;
        if (selectedFlightTypeFilter === 'Solo' && (log.solo || 0) > 0) return true;
        if (selectedFlightTypeFilter === 'Instrument' && (log.instrumentSimulatedHours || 0) > 0) return true;
        return false;
    });
  }, [flightLogs, selectedFlightTypeFilter]);

  const totalFilteredFlights = filteredFlightLogs.length;
  const totalPages = Math.ceil(totalFilteredFlights / ITEMS_PER_PAGE);
  const paginatedFlights = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredFlightLogs.slice(startIndex, endIndex);
  }, [filteredFlightLogs, currentPage]);

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

    // File size validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: `Maximum file size is ${MAX_FILE_SIZE_MB}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`,
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      setActiveUploadDocId(null);
      return;
    }

    // PDF page count validation
    if (file.type === 'application/pdf') {
      const pageCount = await countPdfPages(file);
      if (pageCount > MAX_PDF_PAGES) {
        toast({
          variant: 'destructive',
          title: 'Too Many Pages',
          description: `Maximum is ${MAX_PDF_PAGES} pages. Your PDF has ${pageCount} pages.`,
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        setActiveUploadDocId(null);
        return;
      }
    }

    const docDefinition = appState.documents.find(d => d.id === activeUploadDocId);
    if (!docDefinition) return;

    setUploadingDocId(activeUploadDocId);
    toast({ title: 'Upload Started', description: 'Your document is being uploaded.' });

    try {
      const storage = getStorage(app);
      const storageRef = ref(storage, `applications/${appState.userId}/${appState.id}/${activeUploadDocId}/${file.name}`);
      const snapshot = await uploadBytesWithRetry(storageRef, file);
      const publicUrl = await getDownloadURL(snapshot.ref);

      let detectedExpiryDate: string | null = null;
      if (docDefinition.requiresExpiry && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
        toast({ title: 'AI Processing', description: 'Analyzing document for expiry date.' });
        try {
          const idToken = await auth.currentUser?.getIdToken();
          const { expiryDate } = await serverActions.extractExpiryDateAction({
            applicationId: appState.id,
            documentUrl: publicUrl,
            idToken
          });
          detectedExpiryDate = expiryDate || null;
        } catch (aiError) {
          console.error("Expiry date detection failed:", aiError);
        }
      }

      if (detectedExpiryDate) {
        toast({ title: 'AI Success!', description: `Detected expiry date: ${format(new Date(detectedExpiryDate), 'dd/MM/yyyy')}` });
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
                        description: `Detected expiry date: ${format(new Date(expiryDate), 'dd/MM/yyyy')}.`
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
            setAppState(prev => ({...prev, ...finalState} as Application));

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

    // File size validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: `Maximum file size is ${MAX_FILE_SIZE_MB}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`,
      });
      if (logPdfInputRef.current) logPdfInputRef.current.value = '';
      return;
    }

    // PDF page count validation
    const pageCount = await countPdfPages(file);
    if (pageCount > MAX_PDF_PAGES) {
      toast({
        variant: 'destructive',
        title: 'Too Many Pages',
        description: `Maximum is ${MAX_PDF_PAGES} pages. Your PDF has ${pageCount} pages.`,
      });
      if (logPdfInputRef.current) logPdfInputRef.current.value = '';
      return;
    }

    setIsUploadingLog(true);
    toast({ title: 'AI Processing Started', description: 'Your flight log is being analyzed. This may take a moment.' });

    try {
      const idToken = await auth.currentUser?.getIdToken();

      const formData = new FormData();
      formData.append('applicationId', appState.id);
      formData.append('file', file);

      const { publicUrl, extractedLogs, logbookFormat } = await serverActions.uploadFlightLogAction(formData, idToken);

        setAppState(prev => ({ ...prev, flightLogs: extractedLogs, flightLogPdfUrl: publicUrl, logbookFormat: logbookFormat }));
        
        handlePersistChanges({ flightLogs: extractedLogs, flightLogPdfUrl: publicUrl, logbookFormat: logbookFormat }, {
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
                flights: logs.map(f => ({
                    date: f.date,
                    duration: f.duration,
                }))
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

  const handleToggleReviewMode = () => {
    if (!isReviewMode) {
      setEditableFlights([...flightLogs]);
    }
    setIsReviewMode(!isReviewMode);
  };

  const handleEditableFlightChange = (id: string, field: keyof FlightLog, value: FlightLog[keyof FlightLog]) => {
    setEditableFlights(prev => prev.map(log => {
      if (log.id === id) {
        const updatedLog = { ...log, [field]: value };
        // Recalculate duration if hours changed
        if (['dualReceived', 'pilotInCommand', 'solo'].includes(field)) {
          updatedLog.duration = (Number(updatedLog.dualReceived) || 0) + 
                                (Number(updatedLog.pilotInCommand) || 0) + 
                                (Number(updatedLog.solo) || 0);
        }
        return updatedLog;
      }
      return log;
    }));
  };

  const handleAddEditableFlight = () => {
    const newFlight: FlightLog = {
      id: uuidv4(),
      date: new Date().toISOString().split('T')[0],
      duration: 0,
      aircraft: 'Unknown',
      flightType: 'Unknown',
      dualReceived: 0,
      pilotInCommand: 0,
      solo: 0,
      instrumentSimulatedHours: 0
    };
    setEditableFlights(prev => [...prev, newFlight]);
  };

  const handleRemoveEditableFlight = (id: string) => {
    setEditableFlights(prev => prev.filter(log => log.id !== id));
  };

  const handleSaveReviewChanges = async () => {
    setIsSavingLogs(true);
    try {
        const idToken = await auth.currentUser?.getIdToken();
        const result = await serverActions.updateFlightLogsAction(appState.id, editableFlights, idToken);
        
        if (result.success) {
            setAppState(prev => ({ ...prev, flightLogs: editableFlights }));
            setIsReviewMode(false);
            toast({ title: "Changes Saved", description: "Flight logs have been updated." });
        } else {
            throw new Error("Failed to update logs");
        }
    } catch (error) {
        console.error("Save failed:", error);
        toast({ variant: "destructive", title: "Save Failed", description: "Could not save flight log changes." });
    } finally {
        setIsSavingLogs(false);
    }
  };

  const allDocsUploaded = appState.documents.every(doc => doc.status !== 'missing');
  const isSubmitted = appState.status !== 'draft';

  const filterPillClass = (active: boolean) =>
    cn(
      "shrink-0 rounded-full border px-3.5 py-[7px] text-[13px] font-medium transition-colors",
      active
        ? "border-[var(--navy)] bg-[var(--navy)] text-white"
        : "border-[var(--vv-border)] bg-white text-[var(--text-secondary)] hover:border-[var(--sky)]"
    );

  return (
    <div className="grid gap-8">
      <input type="file" ref={fileInputRef} onChange={handleFileSelected} className="hidden" accept="image/png, image/jpeg, image/webp,application/pdf" />
      <input type="file" ref={logPdfInputRef} onChange={handleFlightLogUpload} accept="application/pdf" className="hidden" />

      <div className="overflow-hidden rounded-xl bg-[var(--navy)] p-7 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-[2px] text-white/50">{appState.id}</div>
            <h1 className="mt-1.5 font-outfit text-[26px] font-bold tracking-[-0.01em]">{appState.licenseType}</h1>
            <p className="mt-1.5 text-sm text-white/60">
              Last updated {safeFormatDate(appState.updatedAt, "MMM d, yyyy")}
              {appState.submittedAt && ` · Submitted ${safeFormatDate(appState.submittedAt, "MMM d, yyyy")}`}
            </p>
          </div>
          <VvStatusBadge status={APP_STATUS_TO_BADGE[appState.status] ?? "draft"} className="bg-white/10 text-white [&>span]:bg-white">
            {appState.status.replace(/_/g, " ")}
          </VvStatusBadge>
        </div>
      </div>

      <div className="grid gap-4">
        <h2 className="font-outfit text-lg font-semibold text-[var(--navy)]">Required documents</h2>
        {appState.documents.filter(doc => doc.name !== "Detailed Logbook Summary").map((doc) => (
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
        <div className="flex items-start gap-3 rounded-xl border border-[var(--status-attention)]/30 bg-[var(--status-attention)]/10 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-attention)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--navy)]">Feedback from reviewer</p>
            <p className="mt-0.5 text-sm leading-relaxed text-[var(--text-secondary)]">{appState.feedback}</p>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[var(--vv-border)] bg-white">
        <div className="flex items-start justify-between gap-4 p-6">
            <div>
                <h2 className="font-outfit text-lg font-semibold text-[var(--navy)]">Flight logs</h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Upload a PDF of your flight logbook. The AI will extract recent flights automatically.</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
                {totalFlightHours > 0 && (
                    <div className="text-right">
                        <p className="font-outfit text-[28px] font-bold tracking-[-0.02em] text-[var(--navy)]">{totalFlightHours.toFixed(2)}</p>
                        <p className="text-xs text-[var(--text-muted)]">Total hours</p>
                    </div>
                )}
                <div className="flex gap-2">
                    {appState.flightLogs && appState.flightLogs.length > 0 && !isReviewMode && (
                        <VvButton onClick={handleRecalculateHours} variant="outline" size="sm">
                            <RefreshCw className="h-3.5 w-3.5" />
                            Refresh totals
                        </VvButton>
                    )}
                     {appState.flightLogs && appState.flightLogs.length > 0 && !isSubmitted && !isReviewMode && (
                         <VvButton onClick={handleToggleReviewMode} variant="outline" size="sm">
                            <Edit2 className="h-3.5 w-3.5" />
                            Review & edit
                        </VvButton>
                    )}
                </div>
            </div>
        </div>
        <div className="border-t border-[var(--vv-border-soft)] p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="rounded-xl border border-[var(--vv-border)] bg-[var(--surface)] p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Total hours</div>
                    <div className="mt-1.5 font-outfit text-2xl font-bold text-[var(--navy)]">{totalFlightHours.toFixed(2)}</div>
                </div>
                {logbookFormat !== 'simple' && (
                    <>
                        <div className="rounded-xl border border-[var(--status-ready)]/25 bg-[var(--status-ready)]/10 p-4">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                {logbookFormat === 'typeB' ? 'PIC hours (incl. solo)' : 'PIC hours'}
                            </div>
                            <div className="mt-1.5 font-outfit text-2xl font-bold text-[var(--status-ready)]">{picHours.toFixed(2)}</div>
                        </div>
                        {logbookFormat === 'typeA' && (
                            <div className="rounded-xl border border-[var(--sky)]/25 bg-[var(--sky-pale)] p-4">
                                <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Solo hours</div>
                                <div className="mt-1.5 font-outfit text-2xl font-bold text-[var(--sky)]">{soloHours.toFixed(2)}</div>
                            </div>
                        )}
                        <div className="rounded-xl border border-[var(--navy)]/15 bg-[var(--navy)]/5 p-4">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Dual hours</div>
                            <div className="mt-1.5 font-outfit text-2xl font-bold text-[var(--navy)]">{dualHours.toFixed(2)}</div>
                        </div>
                    </>
                )}
                <div className="rounded-xl border border-[var(--status-attention)]/25 bg-[var(--status-attention)]/10 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Simulated instrument</div>
                    <div className="mt-1.5 font-outfit text-2xl font-bold text-[var(--status-attention)]">{instrumentSimHours.toFixed(2)}</div>
                </div>
            </div>

            {isRecencyChecking ? (
                <div className="mb-6 flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>AI is analyzing flight logs...</span>
                </div>
            ) : recencyResult ? (
                <div className={cn(
                    "mb-6 flex items-start gap-3 rounded-xl border p-4",
                    recencyResult.hasRecency
                        ? "border-[var(--status-ready)]/25 bg-[var(--status-ready)]/10"
                        : "border-[var(--status-missing)]/25 bg-[var(--status-missing)]/10"
                )}>
                    {recencyResult.hasRecency
                        ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-ready)]" />
                        : <X className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-missing)]" />}
                    <div>
                        <h4 className="text-sm font-semibold text-[var(--navy)]">
                            {recencyResult.hasRecency ? 'Recency requirement met' : 'Recency requirement not met'}
                        </h4>
                        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                            {recencyResult.hasRecency
                                ? `You have logged ${recencyResult.totalHours} hours in the last 6 months.`
                                : `Your logged flights are outside the 6-month window. Flights must be within the last 6 months to meet recency requirements.`}
                        </p>
                    </div>
                </div>
            ) : null}

            {appState.flightLogs && appState.flightLogs.length > 0 && (
                <div className="mb-4">
                    {!isReviewMode ? (
                        <>
                            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                                <button className={filterPillClass(selectedFlightTypeFilter === 'All')} onClick={() => setSelectedFlightTypeFilter('All')}>
                                    All
                                </button>
                                {logbookFormat !== 'simple' && (
                                    <>
                                        <button className={filterPillClass(selectedFlightTypeFilter === 'Dual')} onClick={() => setSelectedFlightTypeFilter('Dual')}>
                                            Dual
                                        </button>
                                        <button className={filterPillClass(selectedFlightTypeFilter === 'PIC')} onClick={() => setSelectedFlightTypeFilter('PIC')}>
                                            {logbookFormat === 'typeB' ? 'PIC (Incl. Solo)' : 'PIC'}
                                        </button>
                                        {logbookFormat === 'typeA' && (
                                            <button className={filterPillClass(selectedFlightTypeFilter === 'Solo')} onClick={() => setSelectedFlightTypeFilter('Solo')}>
                                                Solo
                                            </button>
                                        )}
                                    </>
                                )}
                                <button className={filterPillClass(selectedFlightTypeFilter === 'Instrument')} onClick={() => setSelectedFlightTypeFilter('Instrument')}>
                                    Instrument
                                </button>
                            </div>

                            <div className="mb-4 text-sm text-[var(--text-muted)]">
                                Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalFilteredFlights)}-{Math.min(currentPage * ITEMS_PER_PAGE, totalFilteredFlights)} of {totalFilteredFlights} flights
                            </div>
                            
                            <div className="space-y-2.5">
                                {paginatedFlights.length > 0 ? (
                                    paginatedFlights.map((log, index) => (
                                        <div key={log.id} className="flex flex-col gap-3 rounded-xl border border-[var(--vv-border)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 shrink-0 text-sm font-bold text-[var(--text-muted)]">
                                                    #{((currentPage - 1) * ITEMS_PER_PAGE) + index + 1}
                                                </div>
                                                <div>
                                                    <div className="text-[15px] font-medium text-[var(--text-primary)]">{formatFlightDate(log.date)}</div>
                                                    <div className="text-sm text-[var(--text-muted)]">{log.aircraft}</div>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap justify-end gap-2">
                                                {logbookFormat === 'typeA' && (
                                                    <>
                                                        {(log.dualReceived || 0) > 0 && (
                                                            <span className="rounded-full border border-[var(--sky)]/25 bg-[var(--sky-pale)] px-2.5 py-1 text-xs font-medium text-[var(--sky)]">
                                                                DUAL {log.dualReceived?.toFixed(2)}h
                                                            </span>
                                                        )}
                                                        {(log.pilotInCommand || 0) > 0 && (
                                                            <span className="rounded-full border border-[var(--status-ready)]/25 bg-[var(--status-ready)]/10 px-2.5 py-1 text-xs font-medium text-[var(--status-ready)]">
                                                                PIC {log.pilotInCommand?.toFixed(2)}h
                                                            </span>
                                                        )}
                                                        {(log.solo || 0) > 0 && (
                                                            <span className="rounded-full border border-[var(--navy)]/15 bg-[var(--navy)]/5 px-2.5 py-1 text-xs font-medium text-[var(--navy)]">
                                                                SOLO {log.solo?.toFixed(2)}h
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                                {logbookFormat === 'typeB' && (
                                                    <>
                                                        {(log.dualReceived || 0) > 0 && (
                                                            <span className="rounded-full border border-[var(--sky)]/25 bg-[var(--sky-pale)] px-2.5 py-1 text-xs font-medium text-[var(--sky)]">
                                                                DUAL {log.dualReceived?.toFixed(2)}h
                                                            </span>
                                                        )}
                                                        {(log.pilotInCommand || 0) > 0 && (
                                                            <span className="rounded-full border border-[var(--status-ready)]/25 bg-[var(--status-ready)]/10 px-2.5 py-1 text-xs font-medium text-[var(--status-ready)]">
                                                                PIC (INCL. SOLO) {log.pilotInCommand?.toFixed(2)}h
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                                {logbookFormat === 'simple' && (
                                                    <span className="rounded-full border border-[var(--vv-border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">
                                                        FLIGHT {log.duration.toFixed(2)}h
                                                    </span>
                                                )}
                                                {(log.instrumentSimulatedHours || 0) > 0 && (
                                                    <span className="rounded-full border border-[var(--status-attention)]/25 bg-[var(--status-attention)]/10 px-2.5 py-1 text-xs font-medium text-[var(--status-attention)]">
                                                        INSTRUMENT {log.instrumentSimulatedHours?.toFixed(2)}h
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-xl border border-dashed border-[var(--vv-border)] py-8 text-center text-sm text-[var(--text-muted)]">
                                        No flight logs have been extracted yet or match the current filter.
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 py-4">
                                <VvButton
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />Previous
                                </VvButton>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={cn(
                                                "h-8 w-8 rounded-lg text-[13px] font-medium transition-colors",
                                                currentPage === page
                                                    ? "bg-[var(--navy)] text-white"
                                                    : "border border-[var(--vv-border)] bg-white text-[var(--text-secondary)] hover:border-[var(--sky)]"
                                            )}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>
                                <VvButton
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next<ChevronRight className="h-3.5 w-3.5" />
                                </VvButton>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="overflow-x-auto rounded-xl border border-[var(--vv-border)]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Aircraft</TableHead>
                                            <TableHead>Dual</TableHead>
                                            <TableHead>{logbookFormat === 'typeB' ? 'PIC (Incl. Solo)' : 'PIC'}</TableHead>
                                            {logbookFormat === 'typeA' && <TableHead>Solo</TableHead>}
                                            <TableHead>Inst / Sim</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {editableFlights.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="p-2">
                                                    <Input 
                                                        value={log.date} 
                                                        onChange={(e) => handleEditableFlightChange(log.id, 'date', e.target.value)}
                                                        className="w-[130px] h-8 text-sm"
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input 
                                                        value={log.aircraft} 
                                                        onChange={(e) => handleEditableFlightChange(log.id, 'aircraft', e.target.value)}
                                                        className="w-[100px] h-8 text-sm"
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input 
                                                        type="number" step="0.1" 
                                                        value={log.dualReceived || ''} 
                                                        onChange={(e) => handleEditableFlightChange(log.id, 'dualReceived', parseFloat(e.target.value) || 0)}
                                                        className="w-[80px] h-8 text-sm"
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input 
                                                        type="number" step="0.1" 
                                                        value={log.pilotInCommand || ''} 
                                                        onChange={(e) => handleEditableFlightChange(log.id, 'pilotInCommand', parseFloat(e.target.value) || 0)}
                                                        className="w-[80px] h-8 text-sm"
                                                    />
                                                </TableCell>
                                                {logbookFormat === 'typeA' && (
                                                    <TableCell className="p-2">
                                                        <Input 
                                                            type="number" step="0.1" 
                                                            value={log.solo || ''} 
                                                            onChange={(e) => handleEditableFlightChange(log.id, 'solo', parseFloat(e.target.value) || 0)}
                                                            className="w-[80px] h-8 text-sm"
                                                        />
                                                    </TableCell>
                                                )}
                                                <TableCell className="p-2">
                                                    <Input 
                                                        type="number" step="0.1" 
                                                        value={log.instrumentSimulatedHours || ''} 
                                                        onChange={(e) => handleEditableFlightChange(log.id, 'instrumentSimulatedHours', parseFloat(e.target.value) || 0)}
                                                        className="w-[80px] h-8 text-sm"
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--status-missing)] hover:bg-[var(--status-missing)]/10 hover:text-[var(--status-missing)]" onClick={() => handleRemoveEditableFlight(log.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <VvButton variant="outline" size="sm" onClick={handleAddEditableFlight} className="w-full justify-center border-dashed">
                                <Plus className="h-3.5 w-3.5" /> Add flight row
                            </VvButton>
                            <div className="flex justify-end gap-2 border-t border-[var(--vv-border-soft)] pt-4">
                                <VvButton variant="outline" onClick={handleToggleReviewMode} disabled={isSavingLogs}>
                                    Cancel
                                </VvButton>
                                <VvButton onClick={handleSaveReviewChanges} disabled={isSavingLogs} loading={isSavingLogs}>
                                    <Save className="h-3.5 w-3.5" />
                                    Save changes
                                </VvButton>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
        <div className="flex items-center gap-2 border-t border-[var(--vv-border-soft)] p-6">
            <VvButton
                variant="outline"
                onClick={() => logPdfInputRef.current?.click()}
                disabled={isSubmitted || isUploadingLog}
                loading={isUploadingLog}
            >
                <UploadCloud className="h-3.5 w-3.5" />
                {appState.flightLogPdfUrl ? 'Replace PDF' : 'Upload log PDF'}
            </VvButton>
            {appState.flightLogPdfUrl && (
                <VvButton variant="ghost" onClick={handleDownloadLogPdf} disabled={isUploadingLog}>
                    <Download className="h-3.5 w-3.5" /> Download PDF
                </VvButton>
            )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--vv-border)] bg-white">
        <div className="p-6">
            <h2 className="font-outfit text-lg font-semibold text-[var(--navy)]">Next steps</h2>
        </div>
        <div className="grid gap-4 px-6 pb-6 sm:grid-cols-2">
            <VvButton onClick={handleSaveDraft} disabled={isPending || isSubmitted} loading={isPending} variant="outline" className="justify-center">
                <Save className="h-3.5 w-3.5" />
                Save draft
            </VvButton>
            <VvButton onClick={handleSubmit} disabled={!allDocsUploaded || isSubmitted || isPending} loading={isPending} className="justify-center sm:col-start-2">
                <Check className="h-3.5 w-3.5" />
                {isSubmitted ? 'Submitted' : 'Submit application'}
            </VvButton>
        </div>
        {!allDocsUploaded && !isSubmitted && (
             <div className="border-t border-[var(--vv-border-soft)] px-6 py-4">
                 <p className="text-sm text-[var(--text-muted)]">You must upload all required documents before submitting.</p>
            </div>
        )}
      </div>
    </div>
  );
}
