import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ApplicationStatus, DocumentStatus } from "@/types";
import { CheckCircle2, XCircle, AlertCircle, Clock, File, CircleDot } from "lucide-react";

type Status = ApplicationStatus | DocumentStatus;

export const statusConfig: Record<
  Status,
  { label: string; className: string; icon: React.ElementType }
> = {
  // Application Statuses
  draft: { label: "Draft", className: "border-transparent bg-gray-500/20 text-gray-800 dark:text-gray-300", icon: File },
  submitted: { label: "Submitted", className: "border-transparent bg-blue-500/20 text-blue-800 dark:text-blue-300", icon: Clock },
  in_review: { label: "In Review", className: "border-transparent bg-yellow-500/20 text-yellow-900 dark:text-yellow-300", icon: Clock },
  approved: { label: "Approved", className: "border-transparent bg-green-600/20 text-green-800 dark:text-green-300", icon: CheckCircle2 },
  rejected: { label: "Rejected", className: "border-transparent bg-red-600/20 text-red-800 dark:text-red-300", icon: XCircle },
  
  // Universal Status
  needs_attention: { label: "Needs Attention", className: "border-transparent bg-orange-500/20 text-orange-800 dark:text-orange-300", icon: AlertCircle },
  
  // Document Statuses
  missing: { label: "Missing", className: "border-transparent bg-gray-500/20 text-gray-800 dark:text-gray-300", icon: XCircle },
  uploaded: { label: "Uploaded", className: "border-transparent bg-indigo-500/20 text-indigo-800 dark:text-indigo-300", icon: CircleDot },
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
