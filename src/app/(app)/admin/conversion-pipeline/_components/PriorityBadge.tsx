import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import type { PriorityLevel } from "@/types";

// Follows VvStatusBadge's pill shape/cva pattern — kept local to this route
// since it's specific to the Conversion Pipeline feature, not a shared
// app-wide primitive.
const priorityBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-[11px] py-[5px] text-xs font-medium",
  {
    variants: {
      priority: {
        high: "bg-priority-high-bg text-priority-high-text",
        medium: "bg-priority-medium-bg text-priority-medium-text",
        low: "bg-priority-low-bg text-priority-low-text",
      },
    },
  }
);

const PRIORITY_LABEL: Record<PriorityLevel, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export interface PriorityBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof priorityBadgeVariants> {
  priority: PriorityLevel;
}

export function PriorityBadge({ priority, className, ...props }: PriorityBadgeProps) {
  return (
    <span className={cn(priorityBadgeVariants({ priority }), className)} {...props}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
