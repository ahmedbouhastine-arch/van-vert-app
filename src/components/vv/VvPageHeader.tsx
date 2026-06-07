import { cn } from "@/lib/utils";

export function VvPageHeader({
  kicker,
  title,
  sub,
  actions,
  className,
}: {
  kicker?: string;
  title: string;
  sub?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex flex-wrap items-start justify-between gap-6", className)}>
      <div className="min-w-0">
        {kicker && (
          <div className="mb-2.5 font-inter text-[11px] font-semibold uppercase tracking-[3px] text-[var(--sky)]">
            {kicker}
          </div>
        )}
        <h1 className="font-outfit text-[30px] font-semibold tracking-[-0.02em] text-[var(--navy)]">{title}</h1>
        {sub && <p className="mt-2 max-w-[720px] text-[15px] text-[var(--text-secondary)]">{sub}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
