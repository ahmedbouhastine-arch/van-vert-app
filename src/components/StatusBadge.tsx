import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ApplicationStatus, DocumentStatus } from "@/types";
import { CheckCircle2, XCircle, AlertCircle, Clock, File, CircleDot } from "lucide-react";

type Status = ApplicationStatus | DocumentStatus;

const statusConfig: Record<
  Status,
  { label: string; className: string; icon: React.ElementType }
> = {
  // Application Statuses
  draft: { label: "Draft", className: "bg-slate-200 text-slate-700 border-slate-300", icon: File },
  submitted: { label: "Submitted", className: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock },
  in_review: { label: "In Review", className: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
  approved: { label: "Approved", className: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
  
  // Universal Status
  needs_attention: { label: "Needs Attention", className: "bg-accent text-accent-foreground border-orange-400", icon: AlertCircle },
  
  // Document Statuses
  missing: { label: "Missing", className: "bg-gray-200 text-gray-700 border-gray-300", icon: XCircle },
  uploaded: { label: "Uploaded", className: "bg-indigo-100 text-indigo-700 border-indigo-200", icon: CircleDot },
};


export function StatusBadge({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  const config = statusConfig[status] || statusConfig.missing;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("text-xs font-medium gap-1.5", config.className, className)}>
      <Icon className="h-3.5 w-3.5" />
      <span>{config.label}</span>
    </Badge>
  );
}
