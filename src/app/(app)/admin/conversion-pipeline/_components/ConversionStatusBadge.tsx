import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import type { ConversionStatus } from "@/types";

const conversionStatusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-[11px] py-[5px] text-xs font-medium whitespace-nowrap",
  {
    variants: {
      status: {
        pipeline: "bg-conversionStatus-pipeline-bg text-conversionStatus-pipeline-text",
        onboarded: "bg-conversionStatus-onboarded-bg text-conversionStatus-onboarded-text",
        waiting_for_docs: "bg-conversionStatus-waiting-for-docs-bg text-conversionStatus-waiting-for-docs-text",
        ready_to_fly: "bg-conversionStatus-ready-to-fly-bg text-conversionStatus-ready-to-fly-text",
        flying: "bg-conversionStatus-flying-bg text-conversionStatus-flying-text",
        license_application: "bg-conversionStatus-license-application-bg text-conversionStatus-license-application-text",
        done: "bg-conversionStatus-done-bg text-conversionStatus-done-text",
      } satisfies Record<ConversionStatus, string>,
    },
  }
);

export const CONVERSION_STATUS_LABEL: Record<ConversionStatus, string> = {
  pipeline: "Pipeline",
  onboarded: "Onboarded",
  waiting_for_docs: "Waiting for docs",
  ready_to_fly: "Ready to fly",
  flying: "Flying",
  license_application: "License application",
  done: "Done",
};

// Pipeline order — used to drive both the kanban column order and the
// "constrained" drag rule (adjacent-stage moves only).
export const CONVERSION_STATUS_ORDER: ConversionStatus[] = [
  "pipeline",
  "onboarded",
  "waiting_for_docs",
  "ready_to_fly",
  "flying",
  "license_application",
  "done",
];

export interface ConversionStatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof conversionStatusBadgeVariants> {
  status: ConversionStatus;
}

export function ConversionStatusBadge({ status, className, ...props }: ConversionStatusBadgeProps) {
  return (
    <span className={cn(conversionStatusBadgeVariants({ status }), className)} {...props}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {CONVERSION_STATUS_LABEL[status]}
    </span>
  );
}
