
"use client";

import { useState, useTransition, useEffect } from "react";
import type { Application, ApplicationDocument, ApplicationStatus, UserProfile, DocumentStatus } from "@/types";
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
  AlertCircle,
  Bot,
  Download,
  File as FileIcon,
  Save,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { flagExpiringDocuments } from "@/ai/flows/flag-expiring-documents";
import { checkRecency } from "@/ai/flows/check-recency";
import type { CheckRecencyOutput } from "@/ai/flows/check-recency";
import { cn } from "@/lib/utils";
import { useFirestore } from "@/firebase";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";

async function checkExpiryAction(documents: ApplicationDocument[]) {
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
  isReviewer,
}: {
  doc: ApplicationDocument;
  onStatusChange: (docId: string, status: DocumentStatus) => void;
  isReviewer: boolean;
}) {
  const documentStatuses: DocumentStatus[] = [
    "uploaded",
    "needs_attention",
    "approved",
    "rejected",
  ];

  const currentStatusConfig = statusConfig[doc.status];
  const Icon = currentStatusConfig.icon;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-4 bg-muted/50 p-4">
        <div className="flex-1">
          <CardTitle className="text-base font-medium">{doc.name}</CardTitle>
        </div>
        <div className="w-[150px]">
          {doc.status !== "missing" ? (
            <Select
              value={doc.status}
              onValueChange={(val) => onStatusChange(doc.id, val as DocumentStatus)}
              disabled={isReviewer}
            >
              <SelectTrigger
                className={cn(
                  "h-9 capitalize text-xs font-medium border-0",
                  currentStatusConfig.className
                )}
              >
                <div className="flex items-center gap-1.5 w-full">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="truncate">{currentStatusConfig.label}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {documentStatuses.map((s) => {
                  const itemConfig = statusConfig[s];
                  const ItemIcon = itemConfig.icon;
                  return (
                    <SelectItem 
                      key={s} 
                      value={s} 
                      className={cn(
                        "capitalize", 
                        itemConfig.className, 
                        "border-transparent focus:bg-accent focus:text-accent-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <ItemIcon className="h-3.5 w-3.5" />
                        <span>{itemConfig.label}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          ) : (
            <StatusBadge status="missing" />
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 text-sm space-y-4">
        {doc.status === "missing" ? (
          <p className="text-muted-foreground">Document not uploaded.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 text-muted-foreground">
              <FileIcon className="h-5 w-5" />
              <span className="font-medium text-foreground">{doc.fileName}</span>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            </div>
            {doc.requiresExpiry && doc.expiryDate && (
              <p className="text-xs">
                Expiry Date: {format(parseISO(doc.expiryDate), "PPP")}
              </p>
            )}
          </div>
        )}
        {doc.isExpiringSoon && (
          <Alert
            variant="destructive"
            className="bg-orange-50 border-orange-200 text-orange-700 [&>svg]:text-orange-700"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-semibold text-orange-800">
              Expiry Warning
            </AlertTitle>
            <AlertDescription className="text-orange-700">
              AI check has flagged this document as expiring soon.
            </AlertDescription>
          </Alert>
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
  claims: any;
}) {
  const [appState, setAppState] = useState<Application>(initialApplication);
  const [feedback, setFeedback] = useState(initialApplication.feedback || "");
  const [status, setStatus] = useState<ApplicationStatus>(initialApplication.status);
  const [isPending, startTransition] = useTransition();
  const [recencyResult, setRecencyResult] = useState<CheckRecencyOutput | null>(null);
  const [isRecencyChecking, setIsRecencyChecking] = useState(true);
  const { toast } = useToast();
  const isReviewer = claims?.role === 'reviewer';
  const firestore = useFirestore();

  useEffect(() => {
    const handleRecencyCheck = async () => {
        if (!appState.flightLogs || appState.flightLogs.length === 0) {
            setIsRecencyChecking(false);
            return;
        }
        try {
            const result = await checkRecency({
                flights: appState.flightLogs.map(f => ({ date: f.date, duration: f.duration }))
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
  
  const handleCheckExpiry = () => {
    startTransition(async () => {
        toast({ title: 'AI Check In Progress...', description: 'Checking for documents that are expiring soon.' });
        const results = await checkExpiryAction(appState.documents);

        if (results.length === 0) {
            toast({ title: 'AI Check Complete', description: 'No documents are expiring within 90 days.' });
            return;
        }

        setAppState(prev => ({
            ...prev,
            documents: prev.documents.map(doc => {
                const checkResult = results.find(r => r.name === doc.name);
                if (checkResult?.isExpiringSoon) {
                    return { ...doc, isExpiringSoon: true, status: 'needs_attention' };
                }
                return doc;
            })
        }));
        
        toast({
            variant: "destructive",
            title: "Expiry Warning",
            description: `${results.filter(r => r.isExpiringSoon).length} document(s) flagged for review.`,
          });
    });
  };

  const handleDocumentStatusChange = (docId: string, newStatus: DocumentStatus) => {
    setAppState((prev) => ({
      ...prev,
      documents: prev.documents.map((doc) =>
        doc.id === docId ? { ...doc, status: newStatus } : doc
      ),
    }));
  };

  const handleSaveChanges = () => {
    startTransition(async () => {
        if (!firestore) return;
        const appRef = doc(firestore, 'applications', appState.id);
        try {
            await updateDoc(appRef, {
                status: status,
                feedback: feedback,
                documents: appState.documents,
                updatedAt: serverTimestamp()
            });
            setAppState(prev => ({ ...prev, status, feedback }));
            toast({
                title: "Changes Saved",
                description: "Application status and document statuses have been updated.",
            });
        } catch(e: any) {
            toast({
                variant: 'destructive',
                title: "Save Failed",
                description: e.message,
            });
        }
    });
  }

  const applicationStatuses: ApplicationStatus[] = ['draft', 'submitted', 'in_review', 'needs_attention', 'approved', 'rejected'];

  return (
    <div className="grid gap-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-headline">{appState.licenseType}</CardTitle>
            <StatusBadge status={appState.status} />
          </div>
          <CardDescription>
            Applicant: {user?.displayName} ({user?.email}) | Last updated on {appState.updatedAt ? format(appState.updatedAt.toDate ? appState.updatedAt.toDate() : parseISO(appState.updatedAt), "PPP") : 'N/A'}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="grid gap-4">
            <h2 className="font-semibold text-lg">Uploaded Documents</h2>
            {appState.documents.map((doc) => (
            <DocumentReviewCard key={doc.id} doc={doc} onStatusChange={handleDocumentStatusChange} isReviewer={isReviewer} />
            ))}
        </div>
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>AI Pilot Recency Check</CardTitle>
                    <CardDescription>
                        Verifies if the pilot has at least 15 hours of flight time in the last 6 months.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isRecencyChecking ? (
                         <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>AI is analyzing flight logs...</span>
                         </div>
                    ) : recencyResult ? (
                        <div className={`p-4 rounded-md flex items-start gap-4 ${recencyResult.hasRecency ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                            {recencyResult.hasRecency ? <Check className="h-5 w-5 flex-shrink-0" /> : <X className="h-5 w-5 flex-shrink-0" />}
                            <div>
                                <h4 className="font-semibold">
                                    {recencyResult.hasRecency ? 'Recency Requirement Met' : 'Recency Requirement Not Met'}
                                </h4>
                                <p className="text-sm">
                                    Pilot has logged <strong>{recencyResult.totalHours} hours</strong> in the last 6 months.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No flight logs available for this application to perform a recency check.</p>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Admin Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label htmlFor="status" className="mb-2 block">Application Status</Label>
                        <Select value={status} onValueChange={(val) => setStatus(val as ApplicationStatus)} disabled={isReviewer}>
                            <SelectTrigger id="status">
                                <SelectValue placeholder="Change status..." />
                            </SelectTrigger>
                            <SelectContent>
                                {applicationStatuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label htmlFor="feedback" className="mb-2 block">Feedback for Applicant</Label>
                        <Textarea 
                            id="feedback"
                            placeholder="Provide feedback or request changes..." 
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={5}
                            readOnly={isReviewer}
                        />
                    </div>
                    <Button onClick={handleCheckExpiry} disabled={isPending} variant="secondary" className="w-full">
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                        AI Check Document Expiry
                    </Button>
                    <Button onClick={handleSaveChanges} disabled={isPending || isReviewer} className="w-full">
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
