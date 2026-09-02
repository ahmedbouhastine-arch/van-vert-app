'use client';

import { useMemo, useState } from "react";
import { format, parse } from "date-fns";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { WithId } from "@/firebase/firestore/use-collection";
import type { Student } from "@/types";
import { cn } from "@/lib/utils";
import { VvAvatar } from "@/components/vv/VvAvatar";
import { PriorityBadge } from "./PriorityBadge";
import { ConversionTypeBadge } from "./ConversionTypeBadge";
import { ConversionStatusBadge } from "./ConversionStatusBadge";

type SortKey = "cadetName" | "recencyDate" | "onboardingDate";

function fmtDate(value?: string) {
  if (!value) return "—";
  try {
    return format(parse(value, "yyyy-MM-dd", new Date()), "MMM d, yyyy");
  } catch {
    return value;
  }
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide",
        active ? "text-[var(--sky)]" : "text-[var(--text-secondary)]"
      )}
    >
      {label}
      <Icon className="h-3 w-3" />
    </button>
  );
}

export function StudentTable({
  students,
  onRowClick,
}: {
  students: WithId<Student>[];
  onRowClick: (student: WithId<Student>) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("cadetName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    const copy = [...students];
    copy.sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [students, sortKey, sortDir]);

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--vv-border)] bg-white">
      <Table>
        <TableHeader>
          <TableRow className="border-[var(--vv-border)] hover:bg-transparent">
            <TableHead className="bg-[var(--surface)]">
              <SortHeader label="Cadet" active={sortKey === "cadetName"} dir={sortDir} onClick={() => toggleSort("cadetName")} />
            </TableHead>
            <TableHead className="bg-[var(--surface)] text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Type</TableHead>
            <TableHead className="bg-[var(--surface)] text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Priority</TableHead>
            <TableHead className="bg-[var(--surface)] text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Status</TableHead>
            <TableHead className="bg-[var(--surface)]">
              <SortHeader label="Recency" active={sortKey === "recencyDate"} dir={sortDir} onClick={() => toggleSort("recencyDate")} />
            </TableHead>
            <TableHead className="bg-[var(--surface)]">
              <SortHeader label="Onboarded" active={sortKey === "onboardingDate"} dir={sortDir} onClick={() => toggleSort("onboardingDate")} />
            </TableHead>
            <TableHead className="bg-[var(--surface)] text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Rep</TableHead>
            <TableHead className="bg-[var(--surface)] text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Source</TableHead>
            <TableHead className="bg-[var(--surface)] text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Subtasks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center text-[var(--text-muted)]">
                No students match these filters.
              </TableCell>
            </TableRow>
          )}
          {sorted.map((student) => (
            <TableRow
              key={student.id}
              onClick={() => onRowClick(student)}
              className="cursor-pointer border-[var(--vv-border-soft)] transition-colors hover:bg-[var(--sky-pale)]/40"
            >
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <VvAvatar name={student.cadetName} size={28} />
                  <span className="font-semibold text-[var(--text-primary)]">{student.cadetName}</span>
                </div>
              </TableCell>
              <TableCell><ConversionTypeBadge type={student.conversionType} /></TableCell>
              <TableCell><PriorityBadge priority={student.priorityLevel} /></TableCell>
              <TableCell><ConversionStatusBadge status={student.conversionStatus} /></TableCell>
              <TableCell className="text-[var(--text-secondary)]">{fmtDate(student.recencyDate)}</TableCell>
              <TableCell className="text-[var(--text-secondary)]">{fmtDate(student.onboardingDate)}</TableCell>
              <TableCell className="text-[var(--text-secondary)]">{student.soldByName ?? "—"}</TableCell>
              <TableCell className="text-[var(--text-secondary)]">{student.source ?? "—"}</TableCell>
              <TableCell className="text-[var(--text-secondary)]">
                {student.subtaskTotalCount ? `${student.subtaskCompletedCount ?? 0} / ${student.subtaskTotalCount}` : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
