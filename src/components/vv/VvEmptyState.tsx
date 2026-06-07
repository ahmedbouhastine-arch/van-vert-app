import { FileText, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function VvEmptyState({
  icon: Icon = FileText,
  title,
  sub,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  sub?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-4 rounded-xl border border-[var(--vv-border)] bg-white p-14 text-center", className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--sky-pale)] text-[var(--sky)]">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-outfit text-lg font-semibold text-[var(--navy)]">{title}</h3>
      {sub && <p className="max-w-[380px] text-sm text-[var(--text-secondary)]">{sub}</p>}
      {action}
    </div>
  );
}
