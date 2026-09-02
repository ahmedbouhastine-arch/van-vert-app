import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import type { ConversionType } from "@/types";

const conversionTypeBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-[11px] py-[5px] text-xs font-medium",
  {
    variants: {
      type: {
        CPL: "bg-conversionType-cpl-bg text-conversionType-cpl-text",
        ATPL: "bg-conversionType-atpl-bg text-conversionType-atpl-text",
        PPL: "bg-conversionType-ppl-bg text-conversionType-ppl-text",
      },
    },
  }
);

export interface ConversionTypeBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof conversionTypeBadgeVariants> {
  type: ConversionType;
}

export function ConversionTypeBadge({ type, className, ...props }: ConversionTypeBadgeProps) {
  return (
    <span className={cn(conversionTypeBadgeVariants({ type }), className)} {...props}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {type}
    </span>
  );
}
