import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const vvStatusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-[11px] py-[5px] text-xs font-medium",
  {
    variants: {
      status: {
        draft: "bg-status-draft-bg text-status-draft-text",
        submitted: "bg-status-submitted-bg text-status-submitted-text",
        "in-review": "bg-status-in-review-bg text-status-in-review-text",
        ready: "bg-status-ready-bg text-status-ready-text",
        "needs-attention": "bg-status-attention-bg text-status-attention-text",
        missing: "bg-status-missing-bg text-status-missing-text",
      },
    },
  }
);

export interface VvStatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof vvStatusBadgeVariants> {
  status: NonNullable<VariantProps<typeof vvStatusBadgeVariants>["status"]>;
}

function VvStatusBadge({ status, className, children, ...props }: VvStatusBadgeProps) {
  return (
    <span className={cn(vvStatusBadgeVariants({ status }), className)} {...props}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export { VvStatusBadge, vvStatusBadgeVariants };
