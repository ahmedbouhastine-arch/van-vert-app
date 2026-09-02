'use client';

import { useMemo, useState } from "react";
import { collection, orderBy, query } from "firebase/firestore";
import { Plus, Search } from "lucide-react";

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import type { WithId } from "@/firebase/firestore/use-collection";
import type { Student } from "@/types";
import { PageTransition } from "@/components/PageTransition";
import { VvPageHeader } from "@/components/vv/VvPageHeader";
import { VvButton } from "@/components/vv/VvButton";
import { VvTabs } from "@/components/vv/VvTabs";
import { Input } from "@/components/ui/input";

import { StudentTable } from "./_components/StudentTable";
import { StudentKanban } from "./_components/StudentKanban";
import { StudentDetailPanel } from "./_components/StudentDetailPanel";
import { NewStudentDialog } from "./_components/NewStudentDialog";
import { FilterSelect } from "./_components/FilterSelect";
import { CONVERSION_STATUS_LABEL, CONVERSION_STATUS_ORDER } from "./_components/ConversionStatusBadge";

const ALL = "all";

export default function ConversionPipelinePage() {
  const firestore = useFirestore();
  const studentsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, "students"), orderBy("createdAt", "desc")) : null),
    [firestore]
  );
  const { data: students, isLoading } = useCollection<Student>(studentsQuery);

  const [view, setView] = useState<"table" | "kanban">("table");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [priorityFilter, setPriorityFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [repFilter, setRepFilter] = useState(ALL);

  const [selectedStudent, setSelectedStudent] = useState<WithId<Student> | null>(null);
  const [newStudentOpen, setNewStudentOpen] = useState(false);

  const reps = useMemo(() => {
    const names = new Set<string>();
    (students ?? []).forEach((s) => s.soldByName && names.add(s.soldByName));
    return Array.from(names).sort();
  }, [students]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (students ?? []).filter((s) => {
      if (q && !s.cadetName.toLowerCase().includes(q)) return false;
      if (typeFilter !== ALL && s.conversionType !== typeFilter) return false;
      if (priorityFilter !== ALL && s.priorityLevel !== priorityFilter) return false;
      if (repFilter !== ALL && s.soldByName !== repFilter) return false;
      return true;
    });
  }, [students, search, typeFilter, priorityFilter, repFilter]);

  const tableFiltered = useMemo(
    () => filtered.filter((s) => statusFilter === ALL || s.conversionStatus === statusFilter),
    [filtered, statusFilter]
  );

  return (
    <PageTransition className="flex flex-col gap-6">
      <div>
        <VvPageHeader
          kicker="Admin"
          title="Conversion Pipeline"
          sub="Track license conversion candidates through onboarding, documents, flight time and issuance."
          actions={
            <VvButton onClick={() => setNewStudentOpen(true)}>
              <Plus className="h-4 w-4" />
              New Student
            </VvButton>
          }
        />

        <VvTabs
          tabs={[
            { id: "table", label: "Table", count: tableFiltered.length },
            { id: "kanban", label: "Kanban" },
          ]}
          value={view}
          onChange={(id) => setView(id as "table" | "kanban")}
        />

        {view === "table" ? (
          <div className="mb-[18px] flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px] max-w-[280px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cadets..."
                className="h-[38px] rounded-lg border-[var(--vv-border)] pl-8 text-[13px]"
              />
            </div>
            <FilterSelect
              label="Type"
              value={typeFilter}
              onChange={setTypeFilter}
              options={[{ value: ALL, label: "All" }, { value: "CPL", label: "CPL" }, { value: "ATPL", label: "ATPL" }, { value: "PPL", label: "PPL" }]}
            />
            <FilterSelect
              label="Priority"
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={[{ value: ALL, label: "All" }, { value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }]}
            />
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[{ value: ALL, label: "All" }, ...CONVERSION_STATUS_ORDER.map((s) => ({ value: s, label: CONVERSION_STATUS_LABEL[s] }))]}
            />
            <FilterSelect
              label="Rep"
              value={repFilter}
              onChange={setRepFilter}
              options={[{ value: ALL, label: "All" }, ...reps.map((r) => ({ value: r, label: r }))]}
            />
          </div>
        ) : (
          <div className="mb-2 flex flex-wrap items-center gap-2.5">
            <FilterSelect
              label="Rep"
              value={repFilter}
              onChange={setRepFilter}
              options={[{ value: ALL, label: "All" }, ...reps.map((r) => ({ value: r, label: r }))]}
            />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-sm text-[var(--text-muted)]">Loading students…</div>
      ) : view === "table" ? (
        <StudentTable students={tableFiltered} onRowClick={setSelectedStudent} />
      ) : (
        <StudentKanban
          students={filtered}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          onCardClick={setSelectedStudent}
        />
      )}

      <StudentDetailPanel student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      <NewStudentDialog
        open={newStudentOpen}
        onOpenChange={setNewStudentOpen}
        onCreated={(student) => {
          setNewStudentOpen(false);
          setSelectedStudent(student);
        }}
      />
    </PageTransition>
  );
}
