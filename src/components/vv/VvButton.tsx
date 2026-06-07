import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const vvButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        navy: "bg-[var(--navy)] text-white hover:bg-[var(--navy-deep)]",
        sky: "bg-[var(--sky-bright)] text-white hover:bg-[var(--sky)]",
        outline:
          "border-[1.5px] border-[var(--navy)] bg-transparent text-[var(--navy)] hover:bg-[var(--navy)] hover:text-white",
        ghost: "bg-transparent text-[var(--sky)] hover:bg-[var(--sky-pale)]",
        danger: "bg-[var(--status-missing)] text-white hover:bg-[#b91c1c]",
      },
      size: {
        sm: "px-3.5 py-2 text-[13px]",
        md: "px-[22px] py-3 text-sm",
        lg: "px-7 py-4 text-[15px] font-semibold",
      },
    },
    defaultVariants: {
      variant: "navy",
      size: "md",
    },
  }
);

export interface VvButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof vvButtonVariants> {
  loading?: boolean;
}

const VvButton = React.forwardRef<HTMLButtonElement, VvButtonProps>(
  ({ className, variant, size, loading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(vvButtonVariants({ variant, size }), className)}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
VvButton.displayName = "VvButton";

export { VvButton, vvButtonVariants };
