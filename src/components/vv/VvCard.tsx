import * as React from "react";

import { cn } from "@/lib/utils";

const VvCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-xl border border-[var(--vv-border)] bg-white p-7", className)}
      {...props}
    />
  )
);
VvCard.displayName = "VvCard";

export { VvCard };
