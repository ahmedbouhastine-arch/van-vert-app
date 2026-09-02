'use client';

import { format, parse } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// Small reusable date field — mirrors the Popover + Calendar pattern already
// used for document expiry dates in applications/[id]/_components/ApplicationClient.tsx.
export function DateField({
  value,
  onChange,
  placeholder = "Select date",
}: {
  value?: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const selected = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center justify-between rounded-lg border border-[var(--vv-border)] bg-white px-3 py-2.5 text-left text-[13.5px] transition-colors hover:border-[var(--sky)]",
            value ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
          )}
        >
          {value && selected ? format(selected, "MMM d, yyyy") : placeholder}
          <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => date && onChange(format(date, "yyyy-MM-dd"))}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
