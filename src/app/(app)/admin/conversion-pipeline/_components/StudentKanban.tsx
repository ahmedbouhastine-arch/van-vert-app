'use client';

import { useMemo } from "react";
import { DndContext, useDraggable, useDroppable, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";

import { useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import type { WithId } from "@/firebase/firestore/use-collection";
import type { ConversionStatus, ConversionType, Student } from "@/types";
import { cn } from "@/lib/utils";
import { VvAvatar } from "@/components/vv/VvAvatar";
import { PriorityBadge } from "./PriorityBadge";
import { ConversionTypeBadge } from "./ConversionTypeBadge";
import { CONVERSION_STATUS_LABEL, CONVERSION_STATUS_ORDER } from "./ConversionStatusBadge";

const ALL = "all";
const TYPE_CHIPS: { value: string; label: string }[] = [
  { value: ALL, label: "All types" },
  { value: "CPL", label: "CPL" },
  { value: "ATPL", label: "ATPL" },
  { value: "PPL", label: "PPL" },
];

const STATUS_DOT: Record<ConversionStatus, string> = {
  pipeline: "bg-conversionStatus-pipeline-text",
  onboarded: "bg-conversionStatus-onboarded-text",
  waiting_for_docs: "bg-conversionStatus-waiting-for-docs-text",
  ready_to_fly: "bg-conversionStatus-ready-to-fly-text",
  flying: "bg-conversionStatus-flying-text",
  license_application: "bg-conversionStatus-license-application-text",
  done: "bg-conversionStatus-done-text",
};

function StudentCard({ student, onClick }: { student: WithId<Student>; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: student.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
          : undefined
      }
      className={cn(
        "mb-2.5 cursor-grab rounded-[10px] border border-[var(--vv-border)] bg-white p-3.5 shadow-sm transition-shadow active:cursor-grabbing",
        isDragging && "opacity-60 shadow-md"
      )}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <VvAvatar name={student.cadetName} size={24} />
        <span className="text-[13px] font-semibold text-[var(--text-primary)]">{student.cadetName}</span>
      </div>
      <div className="mb-2.5 flex gap-1.5">
        <ConversionTypeBadge type={student.conversionType} className="px-2.5 py-1 text-[11px]" />
        <PriorityBadge priority={student.priorityLevel} className="px-2.5 py-1 text-[11px]" />
      </div>
      <div className="text-[11.5px] text-[var(--text-muted)]">
        {student.subtaskTotalCount
          ? `${student.subtaskCompletedCount ?? 0} / ${student.subtaskTotalCount} subtasks`
          : "No subtasks yet"}
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  students,
  onCardClick,
}: {
  status: ConversionStatus;
  students: WithId<Student>[];
  onCardClick: (student: WithId<Student>) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div className="flex w-[232px] shrink-0 flex-col">
      <div className="mb-3 flex items-center gap-2 px-0.5">
        <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
        <span className="text-[12.5px] font-semibold text-[var(--text-primary)]">{CONVERSION_STATUS_LABEL[status]}</span>
        <span className="ml-auto text-[11.5px] text-[var(--text-muted)]">{students.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "min-h-[80px] flex-1 rounded-lg transition-colors",
          isOver && "bg-[var(--sky-pale)]/50 outline-dashed outline-2 outline-[var(--sky)]"
        )}
      >
        {students.map((s) => (
          <StudentCard key={s.id} student={s} onClick={() => onCardClick(s)} />
        ))}
      </div>
    </div>
  );
}

export function StudentKanban({
  students,
  typeFilter,
  onTypeFilterChange,
  onCardClick,
}: {
  students: WithId<Student>[];
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  onCardClick: (student: WithId<Student>) => void;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const byStatus = useMemo(() => {
    const map = new Map<ConversionStatus, WithId<Student>[]>();
    CONVERSION_STATUS_ORDER.forEach((s) => map.set(s, []));
    students
      .filter((s) => typeFilter === ALL || s.conversionType === (typeFilter as ConversionType))
      .forEach((s) => map.get(s.conversionStatus)?.push(s));
    return map;
  }, [students, typeFilter]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || !firestore) return;

    const studentId = String(active.id);
    const targetStatus = over.id as ConversionStatus;
    const student = students.find((s) => s.id === studentId);
    if (!student || student.conversionStatus === targetStatus) return;

    const fromIndex = CONVERSION_STATUS_ORDER.indexOf(student.conversionStatus);
    const toIndex = CONVERSION_STATUS_ORDER.indexOf(targetStatus);

    // Constrained drag: only adjacent pipeline stages (either direction) —
    // avoids accidental multi-stage skips from a mis-drop. See the frontend
    // brief's open decision #2.
    if (Math.abs(toIndex - fromIndex) !== 1) {
      toast({
        title: "Can't skip stages",
        description: `Move "${student.cadetName}" one stage at a time — open the card to jump directly instead.`,
        variant: "destructive",
      });
      return;
    }

    updateDoc(doc(firestore, "students", studentId), {
      conversionStatus: targetStatus,
      updatedAt: serverTimestamp(),
    }).catch(() => {
      toast({ title: "Couldn't move student", description: "Please try again.", variant: "destructive" });
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        {TYPE_CHIPS.map((chip) => (
          <button
            key={chip.value}
            type="button"
            onClick={() => onTypeFilterChange(chip.value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
              typeFilter === chip.value
                ? "border-[var(--navy)] bg-[var(--navy)] text-white"
                : "border-[var(--vv-border)] bg-white text-[var(--text-secondary)] hover:bg-[var(--surface)]"
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-3">
          {CONVERSION_STATUS_ORDER.map((status) => (
            <KanbanColumn key={status} status={status} students={byStatus.get(status) ?? []} onCardClick={onCardClick} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
