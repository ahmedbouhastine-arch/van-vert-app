
"use client";

import { useState, useTransition, useEffect, useMemo, useCallback } from "react";
import type { Application, ApplicationDocument, ApplicationStatus, UserProfile, DocumentStatus, FirebaseTimestamp, LogbookFormat, FlightLog } from "@/types";
import {
  Bot,
  Download,
  File as FileIcon,
  Save,
  Check,
  X,
  Loader2,
  Info,
  Clock,
  Calendar,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { flagExpiringDocuments, FlagExpiringDocumentsOutput } from "@/ai/flows/flag-expiring-documents";
import { checkRecency } from "@/ai/flows/check-recency";
import type { CheckRecencyOutput } from "@/ai/flows/check-recency";
import { cn } from "@/lib/utils";
import { useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, serverTimestamp, updateDoc, addDoc, collection } from "firebase/firestore";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VvButton } from "@/components/vv/VvButton";
import { VvStatusBadge, type VvStatusBadgeProps } from "@/components/vv/VvStatusBadge";
import { VvTabs, type VvTabItem } from "@/components/vv/VvTabs";

type VvBadgeStatus = NonNullable<VvStatusBadgeProps["status"]>;
const APP_STATUS_TO_BADGE: Record<Application["status"], VvBadgeStatus> = {
  draft: "draft",
  submitted: "submitted",
  in_review: "in-review",
  needs_attention: "needs-attention",
  approved: "ready",
  rejected: "missing",
};
const APP_STATUS_LABEL: Record<Application["status"], string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In review",
  needs_attention: "Needs attention",
  approved: "Approved",
  rejected: "Rejected",
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
const DETAIL_TABS: VvTabItem[] = [
  { id: "overview", label: "Overview" },
  { id: "documents", label: "Documents" },
  { id: "flightlogs", label: "Flight logs" },
];
const TYPE_PILL_CLASS: Record<string, string> = {
  PIC: "border-[var(--sky)]/30 bg-[var(--sky-pale)] text-[var(--sky)]",
  Solo: "border-[var(--status-ready)]/30 bg-[var(--status-ready)]/10 text-[var(--status-ready)]",
  Dual: "border-[var(--status-attention)]/30 bg-[var(--status-attention)]/10 text-[var(--status-attention)]",
  Unknown: "border-[var(--vv-border)] bg-[var(--surface)] text-[var(--text-secondary)]",
};


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

const logbookFormatDescriptions: Record<LogbookFormat, string> = {
    typeA: "Type A (Separate columns for PIC, Solo, Dual)",
    typeB: "Type B (Combined PIC includes Solo, separate Dual)",
    simple: "Simple (Single duration column only)"
}; 

async function checkExpiryAction(documents: ApplicationDocument[]): Promise<FlagExpiringDocumentsOutput> {
    const docsToCheck = documents
      .filter((doc) => doc.status !== "missing" && doc.requiresExpiry && doc.expiryDate)
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

function DocumentReviewCard({
  doc,
  onStatusChange,
  onDownload,
}: {
  doc: ApplicationDocument;
  onStatusChange: (docId: string, status: DocumentStatus) => void;
  onDownload: (url: string) => void;
}) {
  const documentStatuses: DocumentStatus[] = [
    "uploaded",
    "needs_attention",
    "approved",
    "rejected",
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--vv-border)] bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--vv-border-soft)] bg-[var(--surface)] p-4">
        <div className="min-w-0 flex-1">
          <p className="truncate font-outfit text-sm font-semibold text-[var(--navy)]" title={doc.name}>{doc.name}</p>
        </div>
        <div className="shrink-0">
            <VvStatusBadge status={DOC_STATUS_TO_BADGE[doc.status]} className="text-[10px]">{DOC_STATUS_LABEL[doc.status]}</VvStatusBadge>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="line-clamp-2 text-xs text-[var(--text-muted)]" title={doc.description}>{doc.description}</p>

        {doc.status !== "missing" ? (
          <div className="mt-auto space-y-3">
            <div className="flex items-center justify-between rounded-md bg-[var(--surface)] p-2 text-xs">
                <span className="flex max-w-[120px] items-center gap-1.5 truncate text-[var(--text-muted)]" title={doc.fileName}>
                    <FileIcon className="h-3 w-3 shrink-0" />
                    <span className="truncate">{doc.fileName}</span>
                </span>
                <button
                  type="button"
                  className="ml-2 flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] transition-colors hover:bg-white hover:text-[var(--sky)]"
                  onClick={() => doc.fileUrl && onDownload(doc.fileUrl)}
                >
                    <Download className="h-3 w-3" />
                </button>
            </div>

            {doc.requiresExpiry && (
                <div className={cn("flex items-center justify-between rounded-md p-2 text-xs",
                    doc.isExpiringSoon ? "bg-[var(--status-attention)]/10 text-[var(--status-attention)]" : "bg-[var(--surface)] text-[var(--text-muted)]")}>
                    <span className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        <span>Expiry:</span>
                    </span>
                    <span className="font-medium">{safeFormatDate(doc.expiryDate, "MMM d, yyyy")}</span>
                </div>
            )}

            <div className="border-t border-[var(--vv-border-soft)] pt-2">
                <Label className="mb-1.5 block text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Review status</Label>
                <Select
                    value={doc.status}
                    onValueChange={(val) => onStatusChange(doc.id, val as DocumentStatus)}
                >
                    <SelectTrigger className="h-8 rounded-lg border-[var(--vv-border)] text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {documentStatuses.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs capitalize">
                                {DOC_STATUS_LABEL[s]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
        ) : (
            <div className="mt-auto flex h-24 items-center justify-center rounded-md border border-dashed border-[var(--vv-border)] bg-[var(--surface)]">
                <p className="text-xs italic text-[var(--text-muted)]">No file uploaded</p>
            </div>
        )}
      </div>
    </div>
  );
}


export function AdminApplicationClient({
  application: initialApplication,
  user,
  claims,
}: {
  application: Application;
  user?: UserProfile;
  claims?: { role?: string | null };
}) {
  function getErrorMessage(err: unknown): string {
    if (!err) return 'Unknown error';
    if (typeof err === 'string') return err;
    const e = err as { message?: unknown };
    if (typeof e.message === 'string') return e.message;
    return 'An unexpected error occurred';
  }
  const [appState, setAppState] = useState<Application>(initialApplication);
  const [feedback, setFeedback] = useState(initialApplication.feedback || "");
  const [status, setStatus] = useState<ApplicationStatus>(initialApplication.status);
  const [isPending, startTransition] = useTransition();
  const [recencyResult, setRecencyResult] = useState<CheckRecencyOutput | null>(null);
  const [isRecencyChecking, setIsRecencyChecking] = useState(true);
  const [tab, setTab] = useState<"overview" | "documents" | "flightlogs">("overview");
  const { toast } = useToast();
  
  const firestore = useFirestore();

  const isAdminOrHigher = claims?.role === 'admin' || claims?.role === 'head-admin';
  const isDraft = appState.status === 'draft';

  // Flight Hours Calculation
  const flightLogs = useMemo(() => appState.flightLogs || [], [appState.flightLogs]);
  const logbookFormat = appState.logbookFormat || 'simple';

  const calculateHours = useCallback((logs: FlightLog[], type: 'total' | 'PIC' | 'Solo' | 'Dual') => {
    return logs.reduce((sum, log) => {
        const getLogType = (l: FlightLog) => {
             if (logbookFormat === 'typeA') {
                if ((l.pilotInCommand || 0) > 0) return 'PIC';
                if ((l.solo || 0) > 0) return 'Solo';
                if ((l.dualReceived || 0) > 0) return 'Dual';
            } else if (logbookFormat === 'typeB') {
                if ((l.pilotInCommand || 0) > 0) return 'PIC';
                if ((l.dualReceived || 0) > 0) return 'Dual';
            }
            return l.flightType || 'Unknown';
        }
        const logType = getLogType(log);

        if (type === 'total') return sum + (log.duration || 0);
        if (type === 'PIC' && logType === 'PIC') return sum + (log.duration || 0);
        if (type === 'Solo' && logType === 'Solo') return sum + (log.duration || 0);
        if (type === 'Dual' && logType === 'Dual') return sum + (log.duration || 0);
        return sum;
    }, 0);
  }, [logbookFormat]);

  const totalFlightHours = useMemo(() => calculateHours(flightLogs, 'total'), [flightLogs, calculateHours]);
  const picHours = useMemo(() => calculateHours(flightLogs, 'PIC'), [flightLogs, calculateHours]);
  const soloHours = useMemo(() => calculateHours(flightLogs, 'Solo'), [flightLogs, calculateHours]);
  const dualHours = useMemo(() => calculateHours(flightLogs, 'Dual'), [flightLogs, calculateHours]);

  useEffect(() => {
    const initialRecencyCheck = async () => {
        if (!appState.flightLogs || appState.flightLogs.length === 0) {
            setIsRecencyChecking(false);
            setRecencyResult(null);
            return;
        }
        
        setIsRecencyChecking(true);
        try {
            const result = await checkRecency({
                flights: appState.flightLogs.map(f => ({ date: f.date, duration: f.duration }))
            });
            setRecencyResult(result);
        } catch (error) {
            console.error("Initial recency check failed:", error);
        } finally {
            setIsRecencyChecking(false);
        }
    };

    initialRecencyCheck();
  }, [appState.flightLogs]);
  
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
            return {
                ...doc,
                isExpiringSoon: checkResult ? checkResult.isExpiringSoon : doc.isExpiringSoon,
                status: checkResult?.isExpiringSoon ? 'needs_attention' as const : doc.status,
            }
        });

        setAppState(prev => ({ ...prev, documents: updatedDocs }));
        
        if (firestore) {
            const appRef = doc(firestore, 'applications', appState.id);
            updateDoc(appRef, { documents: updatedDocs }).catch(() => {
                 const permissionError = new FirestorePermissionError({ path: appRef.path, operation: 'update', requestResourceData: { documents: updatedDocs } });
                 errorEmitter.emit('permission-error', permissionError);
                 toast({ variant: 'destructive', title: 'Save Failed' });
                 setAppState(initialApplication);
            });
        }

        toast({
            variant: "destructive",
            title: "Expiry Warning",
            description: `${results.filter(r => r.isExpiringSoon).length} document(s) flagged for review.`,
          });
    });
  };

  const handleDocumentStatusChange = (docId: string, newStatus: DocumentStatus) => {
    const newDocuments = appState.documents.map((doc) =>
      doc.id === docId ? { ...doc, status: newStatus } : doc
    );
    setAppState((prev) => ({ ...prev, documents: newDocuments }));

    if (!firestore) return;
    const appRef = doc(firestore, 'applications', appState.id);
    updateDoc(appRef, { documents: newDocuments })
        .then(() => toast({ title: "Document Status Updated" }))
        .catch(() => {
            toast({ variant: 'destructive', title: "Update Failed", description: "Could not save document status." });
            setAppState(initialApplication);
        });
  };

  const handleSaveChanges = () => {
    startTransition(() => {
        if (!firestore) return;
        const appRef = doc(firestore, 'applications', appState.id);
        const originalStatus = initialApplication.status;

        const updatedData = {
            status: status,
            feedback: feedback,
            updatedAt: serverTimestamp()
        };

        updateDoc(appRef, updatedData)
        .then(() => {
            if (originalStatus !== status && appState.userId) {
                 const notificationsRef = collection(firestore, 'users', appState.userId, 'notifications');
                 addDoc(notificationsRef, {
                     userId: appState.userId,
                     title: `Application Updated`,
                     body: `Your '${appState.licenseType}' application is now ${status.replace(/_/g, ' ')}.`, 
                     href: `/applications/${appState.id}`,
                     isRead: false,
                     createdAt: serverTimestamp(),
                 }).catch(notifError => console.error("Failed to create notification:", notifError));
            }
            
            setAppState(prev => ({ ...prev, status, feedback }));
            toast({ title: "Changes Saved", description: "Application status and feedback updated." });
        })
        .catch((e: unknown) => {
          console.error('Save failed:', e);
          toast({ variant: 'destructive', title: "Save Failed", description: getErrorMessage(e) });
          setStatus(initialApplication.status);
          setFeedback(initialApplication.feedback || "");
        });
    });
  }

  const handleDownload = async (url: string) => {
    if (!url) return;
    try {
        window.open(url, '_blank');
    } catch (error) {
        console.error("Download failed:", error);
        toast({ variant: "destructive", title: "Download Failed" });
    }
  };

  // Mock requirements for visual checker - in real app these would come from license definitions
  const requirements = [
      { label: 'Total Flight Time', current: totalFlightHours, target: 150, unit: 'hrs' },
      { label: 'Pilot in Command', current: picHours, target: 70, unit: 'hrs' },
      ...(logbookFormat !== 'typeB' ? [{ label: 'Solo Flight', current: soloHours, target: 20, unit: 'hrs' }] : []),
      { label: 'Dual Instruction', current: dualHours, target: 20, unit: 'hrs' },
  ];

  return (
    <div className="pb-12">
        {/* Draft Banner */}
        {isDraft && (
            <div className="sticky top-0 z-10 flex items-center justify-center gap-2 border-b border-[var(--status-attention)]/30 bg-[var(--status-attention)]/10 px-6 py-3 text-[var(--status-attention)]">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">This application is currently a DRAFT and has not been submitted for review.</span>
            </div>
        )}

        {/* Hero Section */}
        <div className="overflow-hidden rounded-xl bg-[var(--navy)] p-7 text-white">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-white/20 shadow-sm">
                        <AvatarImage src={user?.photoURL} />
                        <AvatarFallback className="bg-white/10 text-lg text-white">{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="font-outfit text-2xl font-bold tracking-tight text-white">{user?.displayName || 'Unknown Applicant'}</h1>
                        <div className="mt-1 flex items-center gap-2 text-sm text-white/70">
                            <span>{user?.email}</span>
                            <span>•</span>
                            <span>Applied on {safeFormatDate(appState.createdAt, "PPP")}</span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 font-mono text-xs text-white/90">{appState.licenseType}</span>
                            <VvStatusBadge status={APP_STATUS_TO_BADGE[appState.status]} className="border border-white/20 bg-white/10 text-white [&>span]:bg-white">
                                {APP_STATUS_LABEL[appState.status]}
                            </VvStatusBadge>
                        </div>
                    </div>
                </div>

                {!isDraft && (
                    <div className="flex w-full items-center gap-3 md:w-auto">
                        <div className="flex w-full gap-2 md:w-auto">
                            <VvButton
                                variant="outline"
                                className="flex-1 border-white/30 bg-transparent text-white hover:bg-white/10 md:flex-none"
                                onClick={() => { setStatus('rejected'); handleSaveChanges(); }}
                                disabled={isPending || !isAdminOrHigher}
                            >
                                <X className="h-4 w-4" /> Reject
                            </VvButton>
                            <VvButton
                                variant="sky"
                                className="flex-1 md:flex-none"
                                onClick={() => { setStatus('approved'); handleSaveChanges(); }}
                                disabled={isPending || !isAdminOrHigher}
                            >
                                <Check className="h-4 w-4" /> Approve
                            </VvButton>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Main Content - Left Column */}
            <div className="space-y-6 lg:col-span-2">
                <VvTabs tabs={DETAIL_TABS} value={tab} onChange={(id) => setTab(id as typeof tab)} />

                {/* Overview Tab */}
                {tab === "overview" && (
                  <div className="space-y-6">
                        {/* Status & Feedback Card */}
                        <div className="rounded-xl border border-[var(--vv-border)] bg-white p-6">
                            <h3 className="font-outfit text-base font-semibold text-[var(--navy)]">Application status</h3>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Current status</Label>
                                    <Select value={status} onValueChange={(val) => setStatus(val as ApplicationStatus)} disabled={isDraft || !isAdminOrHigher}>
                                        <SelectTrigger className="rounded-lg border-[var(--vv-border)]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft" disabled>Draft</SelectItem>
                                            <SelectItem value="submitted">Submitted</SelectItem>
                                            <SelectItem value="in_review">In Review</SelectItem>
                                            <SelectItem value="needs_attention">Needs Attention</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Last updated</Label>
                                    <div className="flex h-10 items-center rounded-lg border border-[var(--vv-border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-secondary)]">
                                        {safeFormatDate(appState.updatedAt, "PPP p")}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 space-y-1.5">
                                <Label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Internal notes / feedback</Label>
                                <Textarea
                                    placeholder="Add notes for other admins or feedback for the applicant..."
                                    className="min-h-[120px] resize-y rounded-lg border-[var(--vv-border)] focus-visible:ring-[var(--sky)]"
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    readOnly={!isAdminOrHigher}
                                />
                            </div>
                            <div className="mt-4 flex justify-end">
                                <VvButton onClick={handleSaveChanges} disabled={isPending || !isAdminOrHigher} loading={isPending} size="sm">
                                    <Save className="h-4 w-4" />
                                    Save updates
                                </VvButton>
                            </div>
                        </div>

                        {/* Requirements Checker */}
                        <div className="rounded-xl border border-[var(--vv-border)] bg-white p-6">
                            <h3 className="font-outfit text-base font-semibold text-[var(--navy)]">Hour requirements check</h3>
                            <p className="mt-1 text-[13px] text-[var(--text-muted)]">Quick verification of minimum flight hour requirements.</p>
                            <div className="mt-5 space-y-5">
                                {requirements.map((req, i) => {
                                    const percentage = Math.min(100, Math.round((req.current / req.target) * 100));
                                    const isMet = req.current >= req.target;
                                    return (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium text-[var(--navy)]">{req.label}</span>
                                                <span className={cn(isMet ? "font-bold text-[var(--status-ready)]" : "text-[var(--text-muted)]")}>
                                                    {req.current.toFixed(1)} / {req.target} {req.unit}
                                                </span>
                                            </div>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--vv-border-soft)]">
                                                <div
                                                  className={cn("h-full rounded-full transition-[width]", isMet ? "bg-[var(--status-ready)]" : "bg-[var(--sky)]")}
                                                  style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Recency Check */}
                        <div className="rounded-xl border border-[var(--vv-border)] bg-white p-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-outfit text-base font-semibold text-[var(--navy)]">AI recency verification</h3>
                                {recencyResult?.hasRecency && (
                                  <span className="rounded-full border border-[var(--status-ready)]/30 bg-[var(--status-ready)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--status-ready)]">Verified</span>
                                )}
                            </div>
                            <div className="mt-3">
                                {isRecencyChecking ? (
                                    <div className="flex items-center gap-2 py-2 text-sm text-[var(--text-muted)]">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Analyzing recent flights...
                                    </div>
                                ) : recencyResult ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Clock className={cn("h-5 w-5", recencyResult.hasRecency ? "text-[var(--status-ready)]" : "text-[var(--status-attention)]")} />
                                            <p className="text-sm font-medium text-[var(--navy)]">
                                                {recencyResult.hasRecency
                                                    ? "Pilot meets the 6-month recency requirement."
                                                    : "Pilot does NOT meet the 6-month recency requirement."}
                                            </p>
                                        </div>
                                        <p className="pl-7 text-sm text-[var(--text-muted)]">
                                            Total hours in last 6 months: <span className="font-semibold text-[var(--navy)]">{recencyResult.totalHours.toFixed(1)}</span> (Min required: 15)
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-[var(--text-muted)]">No flight logs available to check.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                    {/* Documents Tab */}
                    {tab === "documents" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-outfit text-base font-semibold text-[var(--navy)]">Submitted documents ({appState.documents.filter(d => d.status !== 'missing').length}/{appState.documents.length})</h3>
                            <VvButton variant="outline" size="sm" onClick={handleCheckExpiry} disabled={isPending}>
                                <Bot className="h-4 w-4 text-[var(--sky)]" />
                                Run AI expiry check
                            </VvButton>
                        </div>
                        
                        <div className="grid gap-4 sm:grid-cols-2">
                            {appState.documents.filter(doc => doc.name !== "Detailed Logbook Summary").map((doc) => (
                                <DocumentReviewCard
                                    key={doc.id}
                                    doc={doc}
                                    onStatusChange={handleDocumentStatusChange}
                                    onDownload={handleDownload}
                                />
                            ))}
                        </div>
                    </div>
                    )}

                    {/* Flight Logs Tab */}
                    {tab === "flightlogs" && (
                    <div className="overflow-hidden rounded-xl border border-[var(--vv-border)] bg-white">
                            <div className="flex flex-col gap-4 border-b border-[var(--vv-border-soft)] p-6 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="font-outfit text-base font-semibold text-[var(--navy)]">Digital logbook</h3>
                                    <p className="mt-1 text-[13px] text-[var(--text-muted)]">
                                        Format detected: <span className="font-medium capitalize text-[var(--text-secondary)]">{logbookFormatDescriptions[logbookFormat] || logbookFormat}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 rounded-lg border border-[var(--vv-border)] bg-[var(--surface)] p-2.5">
                                    <div className="text-right">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Total time</p>
                                        <p className="font-outfit text-xl font-bold text-[var(--navy)]">{totalFlightHours.toFixed(1)}h</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <Table>
                                    <TableHeader className="bg-[var(--surface)]">
                                        <TableRow className="border-[var(--vv-border-soft)] hover:bg-transparent">
                                            <TableHead className="w-[120px] text-[var(--text-muted)]">Date</TableHead>
                                            <TableHead className="text-[var(--text-muted)]">Aircraft</TableHead>
                                            <TableHead className="text-[var(--text-muted)]">Type</TableHead>
                                            <TableHead className="text-right text-[var(--text-muted)]">Duration</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {appState.flightLogs && appState.flightLogs.length > 0 ? (
                                            appState.flightLogs.map(log => {
                                                let logType = 'Unknown';
                                                if (logbookFormat === 'typeA') {
                                                    if ((log.pilotInCommand || 0) > 0) logType = 'PIC';
                                                    else if ((log.solo || 0) > 0) logType = 'Solo';
                                                    else if ((log.dualReceived || 0) > 0) logType = 'Dual';
                                                } else if (logbookFormat === 'typeB') {
                                                    if ((log.pilotInCommand || 0) > 0) logType = 'PIC';
                                                    else if ((log.dualReceived || 0) > 0) logType = 'Dual';
                                                } else {
                                                    logType = log.flightType || 'Unknown';
                                                }
                                                const typeLabel = logType === 'PIC' ? `PIC${logbookFormat === 'typeB' ? ' (Incl. Solo)' : ''}` : logType;

                                                return (
                                                    <TableRow key={log.id} className="border-[var(--vv-border-soft)]">
                                                        <TableCell className="font-medium text-[var(--navy)]">{safeFormatDate(log.date, 'MMM d, yyyy')}</TableCell>
                                                        <TableCell className="text-[var(--text-secondary)]">{log.aircraft}</TableCell>
                                                        <TableCell>
                                                            <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium", TYPE_PILL_CLASS[logType] ?? TYPE_PILL_CLASS.Unknown)}>
                                                                {typeLabel}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono text-[var(--navy)]">{log.duration.toFixed(1)}</TableCell>
                                                    </TableRow>
                                                )
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-32 text-center text-[var(--text-muted)]">
                                                    No flight logs have been extracted or uploaded yet.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                    </div>
                    )}
            </div>

            {/* Sidebar - Right Column */}
            <div className="space-y-6">
                {/* Activity Feed / Timeline placeholder */}
                <div className="rounded-xl border border-[var(--vv-border)] bg-white p-6">
                    <h3 className="font-inter text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--text-muted)]">Application activity</h3>
                    <div className="mt-4 space-y-4">
                        <div className="flex gap-3 text-sm">
                            <div className="mt-1 h-fit rounded-full bg-[var(--sky-pale)] p-1.5"><Info className="h-3 w-3 text-[var(--sky)]" /></div>
                            <div>
                                <p className="font-medium text-[var(--navy)]">Application updated</p>
                                <p className="text-xs text-[var(--text-muted)]">{safeFormatDate(appState.updatedAt, "MMM d, h:mm a")}</p>
                            </div>
                        </div>
                        {appState.submittedAt && (
                            <div className="flex gap-3 text-sm">
                                <div className="mt-1 h-fit rounded-full bg-[var(--status-ready)]/15 p-1.5"><Check className="h-3 w-3 text-[var(--status-ready)]" /></div>
                                <div>
                                    <p className="font-medium text-[var(--navy)]">Application submitted</p>
                                    <p className="text-xs text-[var(--text-muted)]">{safeFormatDate(appState.submittedAt, "MMM d, h:mm a")}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex gap-3 text-sm">
                            <div className="mt-1 h-fit rounded-full bg-[var(--surface)] p-1.5"><FileIcon className="h-3 w-3 text-[var(--text-muted)]" /></div>
                            <div>
                                <p className="font-medium text-[var(--navy)]">Draft created</p>
                                <p className="text-xs text-[var(--text-muted)]">{safeFormatDate(appState.createdAt, "MMM d, h:mm a")}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Info */}
                <div className="rounded-xl border border-[var(--vv-border)] bg-white p-6">
                    <h3 className="font-inter text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--text-muted)]">Quick info</h3>
                    <div className="mt-4 space-y-1 text-sm">
                        <div className="flex justify-between border-b border-[var(--vv-border-soft)] py-2">
                            <span className="text-[var(--text-muted)]">License type</span>
                            <span className="font-medium text-[var(--navy)]">{appState.licenseType}</span>
                        </div>
                        <div className="flex justify-between border-b border-[var(--vv-border-soft)] py-2">
                            <span className="text-[var(--text-muted)]">Total docs</span>
                            <span className="font-medium text-[var(--navy)]">{appState.documents.length}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-[var(--text-muted)]">Flight rows</span>
                            <span className="font-medium text-[var(--navy)]">{appState.flightLogs?.length || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
