import { cn } from "@/lib/utils";

export interface VvTabItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  count?: number;
}

export function VvTabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: VvTabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("mb-7 flex gap-1 border-b border-[var(--vv-border)]", className)}>
      {tabs.map((tab) => {
        const active = value === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm transition-colors",
              active
                ? "border-[var(--sky)] font-semibold text-[var(--sky)]"
                : "border-transparent font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            {Icon && <Icon className="h-[15px] w-[15px]" />}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-[7px] py-px text-[11px] font-semibold",
                  active ? "bg-[var(--sky-pale)] text-[var(--sky)]" : "bg-[var(--surface)] text-[var(--text-muted)]"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
