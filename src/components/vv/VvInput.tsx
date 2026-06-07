"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

export interface VvInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string | boolean;
}

const VvInput = React.forwardRef<HTMLInputElement, VvInputProps>(
  ({ label, leftIcon, rightIcon, error, type, className, disabled, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === "password";
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    return (
      <div className="vv-input-group flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 text-[var(--text-muted)]">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={isPassword ? (showPassword ? "text" : "password") : type}
            disabled={disabled}
            aria-invalid={!!error}
            className={cn(
              "w-full rounded-lg border-[1.5px] border-[var(--vv-border)] bg-white px-4 py-3.5 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)]",
              "focus:border-[var(--sky)] focus:shadow-[0_0_0_4px_rgba(0,120,165,0.08)]",
              leftIcon && "pl-11",
              (isPassword || rightIcon) && "pr-11",
              error && "border-[var(--status-missing)] focus:border-[var(--status-missing)] focus:shadow-[0_0_0_4px_rgba(220,38,38,0.08)]",
              disabled && "opacity-50",
              className
            )}
            {...props}
          />
          {rightIcon ? (
            <span className="absolute right-3.5 top-1/2 flex -translate-y-1/2 text-[var(--text-muted)]">
              {rightIcon}
            </span>
          ) : (
            isPassword && (
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((show) => !show)}
                className="absolute right-3.5 top-1/2 flex -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-[var(--sky)]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )
          )}
        </div>
        {typeof error === "string" && error && (
          <span className="text-xs text-[var(--status-missing)]">{error}</span>
        )}
      </div>
    );
  }
);
VvInput.displayName = "VvInput";

export { VvInput };
