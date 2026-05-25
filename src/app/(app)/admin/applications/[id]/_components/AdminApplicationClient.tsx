
"use client";

import { useState, useTransition, useEffect, useMemo, useCallback } from "react";
import type { Application, ApplicationDocument, ApplicationStatus, UserProfile, DocumentStatus, FirebaseTimestamp, LogbookFormat, FlightLog } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, statusConfig } from "@/components/StatusBadge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";


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
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between gap-4 bg-muted/30 p-4 pb-2 border-b">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-sm font-semibold truncate" title={doc.name}>{doc.name}</CardTitle>
        </div>
        <div className="flex-shrink-0">
            {doc.status !== "missing" ? (
                <StatusBadge status={doc.status} className="text-[10px] px-2 py-0.5 h-auto" />
            ) : (
                <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">Missing</Badge>
            )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-3 flex-1 flex flex-col gap-3">
        <p className="text-xs text-muted-foreground line-clamp-2" title={doc.description}>{doc.description}</p>
        
        {doc.status !== "missing" ? (
          <div className="mt-auto space-y-3">
            <div className="flex items-center justify-between text-xs bg-muted/50 p-2 rounded-md">
                <span className="flex items-center gap-1.5 text-muted-foreground truncate max-w-[120px]" title={doc.fileName}>
                    <FileIcon className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{doc.fileName}</span>
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6 ml-2" onClick={() => doc.fileUrl && onDownload(doc.fileUrl)}>
                    <Download className="h-3 w-3" />
                </Button>
            </div>

            {doc.requiresExpiry && (
                <div className={cn("text-xs flex items-center justify-between p-2 rounded-md", 
                    doc.isExpiringSoon ? "bg-orange-50 text-orange-800" : "bg-muted/50 text-muted-foreground")}>
                    <span className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        <span>Expiry:</span>
                    </span>
                    <span className="font-medium">{safeFormatDate(doc.expiryDate, "MMM d, yyyy")}</span>
                </div>
            )}

            <div className="pt-2 border-t">
                <Label className="text-[10px] uppercase text-muted-foreground mb-1.5 block">Review Status</Label>
                <Select
                    value={doc.status}
                    onValueChange={(val) => onStatusChange(doc.id, val as DocumentStatus)}
                >
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {documentStatuses.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs capitalize">
                                {statusConfig[s].label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
        ) : (
            <div className="mt-auto flex items-center justify-center h-24 bg-muted/20 rounded-md border border-dashed">
                <p className="text-xs text-muted-foreground italic">No file uploaded</p>
            </div>
        )}
      </CardContent>
    </Card>
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
    <div className="min-h-screen bg-background pb-12">
        {/* Draft Banner */}
        {isDraft && (
            <div className="bg-amber-100 border-b border-amber-200 text-amber-900 px-6 py-3 flex items-center justify-center gap-2 sticky top-0 z-10">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">This application is currently a DRAFT and has not been submitted for review.</span>
            </div>
        )}

        {/* Hero Section */}
        <div className="bg-muted/30 border-b px-6 py-8">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                        <AvatarImage src={user?.photoURL} />
                        <AvatarFallback className="text-lg bg-primary/10 text-primary">{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">{user?.displayName || 'Unknown Applicant'}</h1>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1 text-sm">
                            <span>{user?.email}</span>
                            <span>•</span>
                            <span>Applied on {safeFormatDate(appState.createdAt, "PPP")}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                            <Badge variant="outline" className="font-mono text-xs">{appState.licenseType}</Badge>
                            <StatusBadge status={appState.status} className="px-2.5 py-0.5 text-xs" />
                        </div>
                    </div>
                </div>
                
                {!isDraft && (
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex gap-2 w-full md:w-auto">
                            <Button 
                                variant="outline" 
                                className="border-red-200 hover:bg-red-50 hover:text-red-700 text-red-600 flex-1 md:flex-none"
                                onClick={() => { setStatus('rejected'); handleSaveChanges(); }}
                                disabled={isPending || !isAdminOrHigher}
                            >
                                <X className="mr-2 h-4 w-4" /> Reject
                            </Button>
                            <Button 
                                className="bg-green-600 hover:bg-green-700 text-white flex-1 md:flex-none"
                                onClick={() => { setStatus('approved'); handleSaveChanges(); }}
                                disabled={isPending || !isAdminOrHigher}
                            >
                                <Check className="mr-2 h-4 w-4" /> Approve
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Left Column */}
            <div className="lg:col-span-2 space-y-8">
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 p-1">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                        <TabsTrigger value="flightlogs">Flight Logs</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6 animate-in fade-in-50 duration-300">
                        {/* Status & Feedback Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Application Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Current Status</Label>
                                        <Select value={status} onValueChange={(val) => setStatus(val as ApplicationStatus)} disabled={isDraft || !isAdminOrHigher}>
                                            <SelectTrigger>
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
                                    <div className="space-y-2">
                                        <Label>Last Updated</Label>
                                        <div className="h-10 px-3 py-2 border rounded-md bg-muted/20 text-sm flex items-center text-muted-foreground">
                                            {safeFormatDate(appState.updatedAt, "PPP p")}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Internal Notes / Feedback</Label>
                                    <Textarea 
                                        placeholder="Add notes for other admins or feedback for the applicant..." 
                                        className="min-h-[120px] resize-y"
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        readOnly={!isAdminOrHigher}
                                    />
                                </div>
                                <div className="flex justify-end pt-2">
                                    <Button onClick={handleSaveChanges} disabled={isPending || !isAdminOrHigher} size="sm">
                                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Save Updates
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Requirements Checker */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Hour Requirements Check</CardTitle>
                                <CardDescription>Quick verification of minimum flight hour requirements.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {requirements.map((req, i) => {
                                    const percentage = Math.min(100, Math.round((req.current / req.target) * 100));
                                    const isMet = req.current >= req.target;
                                    return (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium">{req.label}</span>
                                                <span className={cn(isMet ? "text-green-600 font-bold" : "text-muted-foreground")}>
                                                    {req.current.toFixed(1)} / {req.target} {req.unit}
                                                </span>
                                            </div>
                                            <Progress value={percentage} className={cn("h-2", isMet ? "[&>div]:bg-green-600" : "")} />
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>
                        
                        {/* Recency Check */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center justify-between">
                                    AI Recency Verification
                                    {recencyResult?.hasRecency && <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Verified</Badge>}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isRecencyChecking ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Analyzing recent flights...
                                    </div>
                                ) : recencyResult ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Clock className={cn("h-5 w-5", recencyResult.hasRecency ? "text-green-600" : "text-amber-500")} />
                                            <p className="text-sm font-medium">
                                                {recencyResult.hasRecency 
                                                    ? "Pilot meets the 6-month recency requirement." 
                                                    : "Pilot does NOT meet the 6-month recency requirement."}
                                            </p>
                                        </div>
                                        <p className="text-sm text-muted-foreground pl-7">
                                            Total hours in last 6 months: <span className="font-semibold text-foreground">{recencyResult.totalHours.toFixed(1)}</span> (Min required: 15)
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No flight logs available to check.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Documents Tab */}
                    <TabsContent value="documents" className="space-y-6 animate-in fade-in-50 duration-300">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Submitted Documents ({appState.documents.filter(d => d.status !== 'missing').length}/{appState.documents.length})</h3>
                            <Button variant="outline" size="sm" onClick={handleCheckExpiry} disabled={isPending}>
                                <Bot className="mr-2 h-4 w-4 text-primary" />
                                Run AI Expiry Check
                            </Button>
                        </div>
                        
                        <div className="grid sm:grid-cols-2 gap-4">
                            {appState.documents.filter(doc => doc.name !== "Detailed Logbook Summary").map((doc) => (
                                <DocumentReviewCard 
                                    key={doc.id} 
                                    doc={doc} 
                                    onStatusChange={handleDocumentStatusChange} 
                                    onDownload={handleDownload} 
                                />
                            ))}
                        </div>
                    </TabsContent>

                    {/* Flight Logs Tab */}
                    <TabsContent value="flightlogs" className="space-y-6 animate-in fade-in-50 duration-300">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-lg">Digital Logbook</CardTitle>
                                        <CardDescription className="mt-1">
                                            Format Detected: <span className="font-medium text-foreground capitalize">{logbookFormatDescriptions[logbookFormat] || logbookFormat}</span>
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-4 bg-muted/40 p-2 rounded-lg border">
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground uppercase font-semibold">Total Time</p>
                                            <p className="text-xl font-bold">{totalFlightHours.toFixed(1)}h</p>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="border-t">
                                    <Table>
                                        <TableHeader className="bg-muted/40">
                                            <TableRow>
                                                <TableHead className="w-[120px]">Date</TableHead>
                                                <TableHead>Aircraft</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead className="text-right">Duration</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {appState.flightLogs && appState.flightLogs.length > 0 ? (
                                                appState.flightLogs.map(log => {
                                                    // Simple helper to determine badge
                                                    let typeBadge = <Badge variant="outline" className="bg-gray-100">Unknown</Badge>;
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

                                                    if (logType === 'PIC') typeBadge = <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">PIC {logbookFormat === 'typeB' ? '(Incl. Solo)' : ''}</Badge>;
                                                    if (logType === 'Solo') typeBadge = <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Solo</Badge>;
                                                    if (logType === 'Dual') typeBadge = <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">Dual</Badge>;

                                                    return (
                                                        <TableRow key={log.id}>
                                                            <TableCell className="font-medium">{safeFormatDate(log.date, 'MMM d, yyyy')}</TableCell>
                                                            <TableCell>{log.aircraft}</TableCell>
                                                            <TableCell>{typeBadge}</TableCell>
                                                            <TableCell className="text-right font-mono">{log.duration.toFixed(1)}</TableCell>
                                                        </TableRow>
                                                    )
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                                        No flight logs have been extracted or uploaded yet.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Sidebar - Right Column */}
            <div className="space-y-6">
                {/* Activity Feed / Timeline placeholder */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm uppercase text-muted-foreground">Application Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-3 text-sm">
                            <div className="mt-1 bg-primary/20 p-1.5 rounded-full h-fit"><Info className="h-3 w-3 text-primary" /></div>
                            <div>
                                <p className="font-medium">Application Updated</p>
                                <p className="text-xs text-muted-foreground">{safeFormatDate(appState.updatedAt, "MMM d, h:mm a")}</p>
                            </div>
                        </div>
                        {appState.submittedAt && (
                            <div className="flex gap-3 text-sm">
                                <div className="mt-1 bg-green-100 p-1.5 rounded-full h-fit"><Check className="h-3 w-3 text-green-600" /></div>
                                <div>
                                    <p className="font-medium">Application Submitted</p>
                                    <p className="text-xs text-muted-foreground">{safeFormatDate(appState.submittedAt, "MMM d, h:mm a")}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex gap-3 text-sm">
                            <div className="mt-1 bg-muted p-1.5 rounded-full h-fit"><FileIcon className="h-3 w-3 text-muted-foreground" /></div>
                            <div>
                                <p className="font-medium">Draft Created</p>
                                <p className="text-xs text-muted-foreground">{safeFormatDate(appState.createdAt, "MMM d, h:mm a")}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm uppercase text-muted-foreground">Quick Info</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-3">
                        <div className="flex justify-between py-1 border-b">
                            <span className="text-muted-foreground">License Type</span>
                            <span className="font-medium">{appState.licenseType}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                            <span className="text-muted-foreground">Total Docs</span>
                            <span className="font-medium">{appState.documents.length}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                            <span className="text-muted-foreground">Flight Rows</span>
                            <span className="font-medium">{appState.flightLogs?.length || 0}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
