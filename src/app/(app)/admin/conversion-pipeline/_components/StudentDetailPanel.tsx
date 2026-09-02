'use client';

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { Check, ChevronRight, Circle, Clock, ExternalLink, FileText, Plus, Trash2 } from "lucide-react";

import { useFirestore, useCollection, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import type { WithId } from "@/firebase/firestore/use-collection";
import type { Application, ConversionStatus, ConversionType, HoursRequirement, PriorityLevel, Student, SubTask } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VvButton } from "@/components/vv/VvButton";
import { VvAvatar } from "@/components/vv/VvAvatar";
import { PriorityBadge } from "./PriorityBadge";
import { ConversionTypeBadge } from "./ConversionTypeBadge";
import { ConversionStatusBadge, CONVERSION_STATUS_LABEL, CONVERSION_STATUS_ORDER } from "./ConversionStatusBadge";
import { DateField } from "./DateField";

type Draft = Pick<
  Student,
  | "cadetName"
  | "conversionType"
  | "priorityLevel"
  | "conversionStatus"
  | "recencyDate"
  | "onboardingDate"
  | "email"
  | "phone"
  | "source"
  | "soldByName"
  | "googleDriveUrl"
  | "notes"
> & { hoursNeeded: HoursRequirement[]; linkedApplicationIdInput: string };

function draftFromStudent(student: WithId<Student>): Draft {
  return {
    cadetName: student.cadetName,
    conversionType: student.conversionType,
    priorityLevel: student.priorityLevel,
    conversionStatus: student.conversionStatus,
    recencyDate: student.recencyDate,
    onboardingDate: student.onboardingDate,
    email: student.email,
    phone: student.phone,
    source: student.source,
    soldByName: student.soldByName,
    googleDriveUrl: student.googleDriveUrl,
    notes: student.notes,
    hoursNeeded: student.hoursNeeded ?? [],
    linkedApplicationIdInput: student.linkedApplicationId ?? "",
  };
}

const APP_STATUS_LABEL: Record<Application["status"], string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In review",
  needs_attention: "Needs attention",
  approved: "Approved",
  rejected: "Rejected",
};

function LinkedApplicationRow({
  applicationId,
  onOpen,
}: {
  applicationId: string;
  onOpen: () => void;
}) {
  const firestore = useFirestore();
  const appRef = useMemoFirebase(
    () => (firestore ? doc(firestore, "applications", applicationId) : null),
    [firestore, applicationId]
  );
  const { data: application, isLoading } = useDoc<Application>(appRef);

  if (isLoading) {
    return (
      <div className="mt-3.5 rounded-lg border border-[var(--vv-border)] bg-[var(--surface)] px-3.5 py-3 text-[13px] text-[var(--text-muted)]">
        Loading linked application…
      </div>
    );
  }

  if (!application) {
    return (
      <div className="mt-3.5 rounded-lg border border-[var(--vv-border)] bg-[var(--surface)] px-3.5 py-3 text-[13px] text-[var(--status-missing)]">
        Linked application not found — check the application ID.
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="mt-3.5 flex w-full items-center gap-3 rounded-lg border border-[var(--vv-border)] bg-[var(--surface)] px-3.5 py-3 text-left transition-colors hover:border-[var(--sky)]"
    >
      <FileText className="h-[17px] w-[17px] shrink-0 text-[var(--sky)]" />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-[var(--text-primary)]">
          DGCA Application &middot; {application.licenseType}
        </div>
        <div className="mt-0.5 text-xs text-[var(--text-muted)]">Open the linked application record</div>
      </div>
      <span className="shrink-0 rounded-full bg-[var(--sky-pale)] px-2.5 py-1 text-[11px] font-medium text-[var(--sky)]">
        {APP_STATUS_LABEL[application.status]}
      </span>
      <ChevronRight className="h-[15px] w-[15px] shrink-0 text-[var(--text-muted)]" />
    </button>
  );
}

function SubtasksSection({ studentId }: { studentId: string }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const subtasksQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "students", studentId, "subtasks") : null),
    [firestore, studentId]
  );
  const { data: subtasks } = useCollection<SubTask>(subtasksQuery);
  const [newTaskName, setNewTaskName] = useState("");

  const sorted = useMemo(
    () => [...(subtasks ?? [])].sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0)),
    [subtasks]
  );
  const completedCount = sorted.filter((t) => t.completed).length;

  async function syncCounts(list: SubTask[]) {
    if (!firestore) return;
    const studentRef = doc(firestore, "students", studentId);
    const completed = list.filter((t) => t.completed).length;
    updateDoc(studentRef, {
      subtaskCompletedCount: completed,
      subtaskTotalCount: list.length,
      updatedAt: serverTimestamp(),
    }).catch(() => {
      // Non-critical denormalized counter — table/kanban will just show a
      // slightly stale count until the next successful sync.
    });
  }

  function handleToggle(task: WithId<SubTask>) {
    if (!firestore) return;
    const taskRef = doc(firestore, "students", studentId, "subtasks", task.id);
    const nextCompleted = !task.completed;
    updateDoc(taskRef, {
      completed: nextCompleted,
      taskStatus: nextCompleted ? "completed" : "not_started",
      updatedAt: serverTimestamp(),
    })
      .then(() => syncCounts(sorted.map((t) => (t.id === task.id ? { ...t, completed: nextCompleted } : t))))
      .catch((_error: unknown) => {
        errorEmitter.emit(
          "permission-error",
          new FirestorePermissionError({ path: taskRef.path, operation: "update" })
        );
        toast({ variant: "destructive", title: "Couldn't update subtask" });
      });
  }

  function handleAdd() {
    const taskName = newTaskName.trim();
    if (!taskName || !firestore) return;
    const subtasksRef = collection(firestore, "students", studentId, "subtasks");
    addDoc(subtasksRef, {
      taskName,
      taskStatus: "not_started",
      completed: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
      .then(() => {
        setNewTaskName("");
        syncCounts([...sorted, { id: "", taskName, taskStatus: "not_started", completed: false } as WithId<SubTask>]);
      })
      .catch((_error: unknown) => {
        errorEmitter.emit(
          "permission-error",
          new FirestorePermissionError({ path: subtasksRef.path, operation: "create", requestResourceData: { taskName } })
        );
        toast({ variant: "destructive", title: "Couldn't add subtask" });
      });
  }

  function handleDelete(task: WithId<SubTask>) {
    if (!firestore) return;
    const taskRef = doc(firestore, "students", studentId, "subtasks", task.id);
    deleteDoc(taskRef)
      .then(() => syncCounts(sorted.filter((t) => t.id !== task.id)))
      .catch((_error: unknown) => {
        errorEmitter.emit(
          "permission-error",
          new FirestorePermissionError({ path: taskRef.path, operation: "delete" })
        );
        toast({ variant: "destructive", title: "Couldn't delete subtask" });
      });
  }

  return (
    <div>
      <h3 className="mb-3.5 font-outfit text-sm font-semibold text-[var(--navy)]">
        Subtasks &middot; {completedCount} / {sorted.length}
      </h3>
      <div>
        {sorted.map((task) => (
          <div
            key={task.id}
            className="group flex items-center gap-2.5 border-b border-[var(--vv-border-soft)] py-2.5 last:border-b-0"
          >
            <button type="button" onClick={() => handleToggle(task)} className="shrink-0">
              {task.completed ? (
                <Check className="h-[17px] w-[17px] rounded-full border-2 border-[var(--status-ready)] bg-[var(--status-ready)]/10 p-[1px] text-[var(--status-ready)]" />
              ) : task.taskStatus === "in_progress" ? (
                <Clock className="h-[17px] w-[17px] text-[var(--status-attention)]" />
              ) : (
                <Circle className="h-[17px] w-[17px] text-[var(--text-muted)]" />
              )}
            </button>
            <div
              className={cn(
                "flex-1 text-[13px]",
                task.completed ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]"
              )}
            >
              {task.taskName}
            </div>
            {task.ownerName && <span className="shrink-0 text-[11.5px] text-[var(--text-muted)]">{task.ownerName}</span>}
            <button
              type="button"
              onClick={() => handleDelete(task)}
              className="shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity hover:text-[var(--status-missing)] group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="py-2 text-[13px] text-[var(--text-muted)]">No subtasks yet.</div>
        )}
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <Input
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Add a subtask…"
          className="h-9 rounded-lg border-[var(--vv-border)] text-[13px]"
        />
        <VvButton type="button" variant="ghost" size="sm" onClick={handleAdd} disabled={!newTaskName.trim()}>
          <Plus className="h-3.5 w-3.5" />
          Add
        </VvButton>
      </div>
    </div>
  );
}

export function StudentDetailPanel({
  student,
  onClose,
}: {
  student: WithId<Student> | null;
  onClose: () => void;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (student) setDraft(draftFromStudent(student));
    // Re-sync the draft only when the panel switches to a different
    // student, not on every field change within `student` itself
    // (avoids clobbering in-progress edits on background snapshot updates).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id]);

  if (!student || !draft) return null;

  function updateField<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateHoursRow(id: string, patch: Partial<HoursRequirement>) {
    setDraft((prev) =>
      prev ? { ...prev, hoursNeeded: prev.hoursNeeded.map((row) => (row.id === id ? { ...row, ...patch } : row)) } : prev
    );
  }

  function addHoursRow() {
    setDraft((prev) =>
      prev
        ? { ...prev, hoursNeeded: [...prev.hoursNeeded, { id: crypto.randomUUID(), label: "", hoursNeeded: 0 }] }
        : prev
    );
  }

  function removeHoursRow(id: string) {
    setDraft((prev) => (prev ? { ...prev, hoursNeeded: prev.hoursNeeded.filter((row) => row.id !== id) } : prev));
  }

  const hoursTotal = draft.hoursNeeded.reduce((sum, row) => sum + (Number(row.hoursNeeded) || 0), 0);

  function handleSave() {
    if (!firestore || !student || !draft) return;
    setSaving(true);
    const studentRef = doc(firestore, "students", student.id);
    const { linkedApplicationIdInput, ...rest } = draft;
    const payload = {
      ...rest,
      hoursNeeded: draft.hoursNeeded.filter((row) => row.label.trim().length > 0),
      linkedApplicationId: linkedApplicationIdInput.trim() || undefined,
      updatedAt: serverTimestamp(),
    };
    updateDoc(studentRef, payload)
      .then(() => {
        toast({ title: "Student updated" });
        onClose();
      })
      .catch((_error: unknown) => {
        errorEmitter.emit(
          "permission-error",
          new FirestorePermissionError({ path: studentRef.path, operation: "update", requestResourceData: payload })
        );
        toast({ variant: "destructive", title: "Couldn't save changes" });
      })
      .finally(() => setSaving(false));
  }

  return (
    <Sheet open={Boolean(student)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[460px]">
        {/* Header */}
        <div className="flex shrink-0 items-start gap-3.5 border-b border-[var(--vv-border)] px-7 py-6">
          <VvAvatar name={draft.cadetName} size={44} />
          <div className="min-w-0 flex-1">
            <div className="font-outfit text-lg font-semibold text-[var(--text-primary)]">{draft.cadetName || "Untitled cadet"}</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <ConversionTypeBadge type={draft.conversionType} />
              <PriorityBadge priority={draft.priorityLevel} />
              <ConversionStatusBadge status={draft.conversionStatus} />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6">
          <div className="flex flex-col gap-6">
            {/* Details */}
            <div>
              <h3 className="mb-3.5 font-outfit text-sm font-semibold text-[var(--navy)]">Details</h3>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">Cadet name</label>
                  <Input
                    value={draft.cadetName}
                    onChange={(e) => updateField("cadetName", e.target.value)}
                    className="h-auto rounded-lg border-[var(--vv-border)] px-3 py-2.5 text-[13.5px]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">Conversion type</label>
                  <Select value={draft.conversionType} onValueChange={(v) => updateField("conversionType", v as ConversionType)}>
                    <SelectTrigger className="h-auto rounded-lg border-[var(--vv-border)] px-3 py-2.5 text-[13.5px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CPL">CPL</SelectItem>
                      <SelectItem value="ATPL">ATPL</SelectItem>
                      <SelectItem value="PPL">PPL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">Priority</label>
                  <Select value={draft.priorityLevel} onValueChange={(v) => updateField("priorityLevel", v as PriorityLevel)}>
                    <SelectTrigger className="h-auto rounded-lg border-[var(--vv-border)] px-3 py-2.5 text-[13.5px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">Conversion status</label>
                  <Select
                    value={draft.conversionStatus}
                    onValueChange={(v) => updateField("conversionStatus", v as ConversionStatus)}
                  >
                    <SelectTrigger className="h-auto rounded-lg border-[var(--vv-border)] px-3 py-2.5 text-[13.5px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONVERSION_STATUS_ORDER.map((s) => (
                        <SelectItem key={s} value={s}>
                          {CONVERSION_STATUS_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">Recency date</label>
                  <DateField value={draft.recencyDate} onChange={(v) => updateField("recencyDate", v)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">Onboarding date</label>
                  <DateField value={draft.onboardingDate} onChange={(v) => updateField("onboardingDate", v)} />
                </div>
              </div>

              {/* Linked DGCA application */}
              {draft.linkedApplicationIdInput ? (
                <LinkedApplicationRow
                  applicationId={draft.linkedApplicationIdInput}
                  onOpen={() => window.open(`/admin/applications/${draft.linkedApplicationIdInput}`, "_blank")}
                />
              ) : null}
              <div className="mt-2.5 flex items-center gap-2">
                <Input
                  value={draft.linkedApplicationIdInput}
                  onChange={(e) => updateField("linkedApplicationIdInput", e.target.value)}
                  placeholder="Application ID to link…"
                  className="h-9 flex-1 rounded-lg border-[var(--vv-border)] text-[13px]"
                />
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
              </div>
            </div>

            {/* Flight hours needed */}
            <div>
              <h3 className="mb-3.5 font-outfit text-sm font-semibold text-[var(--navy)]">Flight hours needed</h3>
              <div className="overflow-hidden rounded-lg border border-[var(--vv-border)]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border-b border-[var(--vv-border)] bg-[var(--surface)] px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                        Requirement
                      </th>
                      <th className="w-[90px] border-b border-[var(--vv-border)] bg-[var(--surface)] px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                        Hrs needed
                      </th>
                      <th className="w-8 border-b border-[var(--vv-border)] bg-[var(--surface)]" />
                    </tr>
                  </thead>
                  <tbody>
                    {draft.hoursNeeded.map((row) => (
                      <tr key={row.id} className="group">
                        <td className="border-b border-[var(--vv-border-soft)] px-3 py-1.5">
                          <input
                            value={row.label}
                            onChange={(e) => updateHoursRow(row.id, { label: e.target.value })}
                            placeholder="e.g. Dual cross-country"
                            className="w-full bg-transparent text-[13px] text-[var(--text-primary)] outline-none"
                          />
                        </td>
                        <td className="border-b border-[var(--vv-border-soft)] px-3 py-1.5">
                          <input
                            type="number"
                            min={0}
                            value={row.hoursNeeded}
                            onChange={(e) => updateHoursRow(row.id, { hoursNeeded: Number(e.target.value) })}
                            className="w-full bg-transparent text-right text-[13px] tabular-nums text-[var(--text-primary)] outline-none"
                          />
                        </td>
                        <td className="border-b border-[var(--vv-border-soft)] px-1 text-center">
                          <button
                            type="button"
                            onClick={() => removeHoursRow(row.id)}
                            className="text-[var(--text-muted)] opacity-0 transition-opacity hover:text-[var(--status-missing)] group-hover:opacity-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {draft.hoursNeeded.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-3 py-3 text-center text-[13px] text-[var(--text-muted)]">
                          No requirements added yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="px-3 py-2.5 text-[13px] font-semibold text-[var(--navy)]">Total</td>
                      <td className="px-3 py-2.5 text-right text-[13px] font-semibold tabular-nums text-[var(--navy)]">
                        {hoursTotal}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
              <button
                type="button"
                onClick={addHoursRow}
                className="mt-2.5 flex items-center gap-1.5 text-[13px] text-[var(--sky)] hover:text-[var(--navy)]"
              >
                <Plus className="h-3.5 w-3.5" />
                Add requirement
              </button>
            </div>

            {/* Contact */}
            <div>
              <h3 className="mb-3.5 font-outfit text-sm font-semibold text-[var(--navy)]">Contact</h3>
              <div className="mb-3.5 grid grid-cols-2 gap-3.5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">Email</label>
                  <Input
                    value={draft.email ?? ""}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="h-auto rounded-lg border-[var(--vv-border)] px-3 py-2.5 text-[13.5px]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">Phone</label>
                  <Input
                    value={draft.phone ?? ""}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="h-auto rounded-lg border-[var(--vv-border)] px-3 py-2.5 text-[13.5px]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">Source</label>
                  <Input
                    value={draft.source ?? ""}
                    onChange={(e) => updateField("source", e.target.value)}
                    className="h-auto rounded-lg border-[var(--vv-border)] px-3 py-2.5 text-[13.5px]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">Sold by</label>
                  <Input
                    value={draft.soldByName ?? ""}
                    onChange={(e) => updateField("soldByName", e.target.value)}
                    className="h-auto rounded-lg border-[var(--vv-border)] px-3 py-2.5 text-[13.5px]"
                  />
                </div>
              </div>
            </div>

            {/* Documents & notes */}
            <div>
              <h3 className="mb-3.5 font-outfit text-sm font-semibold text-[var(--navy)]">Documents &amp; notes</h3>
              <div className="mb-3.5">
                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">Google Drive folder</label>
                <Input
                  value={draft.googleDriveUrl ?? ""}
                  onChange={(e) => updateField("googleDriveUrl", e.target.value)}
                  placeholder="https://drive.google.com/…"
                  className="h-auto rounded-lg border-[var(--vv-border)] px-3 py-2.5 text-[13.5px]"
                />
              </div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">Notes</label>
              <Textarea
                value={draft.notes ?? ""}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
                className="resize-none rounded-lg border-[var(--vv-border)] text-[13.5px]"
              />
            </div>

            {/* Subtasks */}
            <SubtasksSection studentId={student.id} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end gap-2.5 border-t border-[var(--vv-border)] px-7 py-4">
          <VvButton type="button" variant="outline" onClick={onClose}>
            Cancel
          </VvButton>
          <VvButton type="button" onClick={handleSave} loading={saving}>
            Save changes
          </VvButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}
