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
  draft: { label: "Draft", className: "bg-gray-500 text-white border-transparent", icon: File },
  submitted: { label: "Submitted", className: "bg-blue-500 text-white border-transparent", icon: Clock },
  in_review: { label: "In Review", className: "bg-yellow-500 text-black border-transparent", icon: Clock },
  approved: { label: "Approved", className: "bg-green-600 text-white border-transparent", icon: CheckCircle2 },
  rejected: { label: "Rejected", className: "bg-red-600 text-white border-transparent", icon: XCircle },
  
  // Universal Status
  needs_attention: { label: "Needs Attention", className: "bg-orange-500 text-white border-transparent", icon: AlertCircle },
  
  // Document Statuses
  missing: { label: "Missing", className: "bg-gray-500 text-white border-transparent", icon: XCircle },
  uploaded: { label: "Uploaded", className: "bg-indigo-500 text-white border-transparent", icon: CircleDot },
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
