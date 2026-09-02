'use client';

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase";
import type { WithId } from "@/firebase/firestore/use-collection";
import type { ConversionType, Student } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VvButton } from "@/components/vv/VvButton";

export function NewStudentDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (student: WithId<Student>) => void;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [cadetName, setCadetName] = useState("");
  const [conversionType, setConversionType] = useState<ConversionType | "">("");
  const [creating, setCreating] = useState(false);

  const canCreate = cadetName.trim().length > 0 && conversionType !== "";

  function reset() {
    setCadetName("");
    setConversionType("");
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function handleCreate() {
    if (!firestore || !canCreate) return;
    setCreating(true);
    const studentsRef = collection(firestore, "students");
    const payload = {
      cadetName: cadetName.trim(),
      conversionType: conversionType as ConversionType,
      priorityLevel: "medium" as const,
      conversionStatus: "pipeline" as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    addDoc(studentsRef, payload)
      .then((ref) => {
        reset();
        onCreated({ ...payload, id: ref.id } as unknown as WithId<Student>);
      })
      .catch((_error: unknown) => {
        errorEmitter.emit(
          "permission-error",
          new FirestorePermissionError({ path: studentsRef.path, operation: "create", requestResourceData: payload })
        );
        toast({ variant: "destructive", title: "Couldn't create student" });
      })
      .finally(() => setCreating(false));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[440px] gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-[var(--vv-border)] px-[26px] py-[22px] text-left">
          <DialogTitle className="font-outfit text-[17px] font-semibold text-[var(--navy)]">New student</DialogTitle>
          <DialogDescription className="text-[13px] text-[var(--text-secondary)]">
            Adds a cadet to the conversion pipeline.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-[26px] py-[22px]">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">
              Cadet name <span className="text-[var(--status-missing)]">*</span>
            </label>
            <Input
              value={cadetName}
              onChange={(e) => setCadetName(e.target.value)}
              placeholder="Full name"
              className="h-auto rounded-lg border-[var(--vv-border)] px-3 py-[11px] text-[13.5px]"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">
              Conversion type <span className="text-[var(--status-missing)]">*</span>
            </label>
            <Select value={conversionType} onValueChange={(v) => setConversionType(v as ConversionType)}>
              <SelectTrigger className="h-auto rounded-lg border-[var(--vv-border)] px-3 py-[11px] text-[13.5px]">
                <SelectValue placeholder="Select type…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CPL">CPL</SelectItem>
                <SelectItem value="ATPL">ATPL</SelectItem>
                <SelectItem value="PPL">PPL</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-2 text-xs text-[var(--text-muted)]">No default — pick CPL, ATPL or PPL explicitly.</div>
          </div>
        </div>

        <DialogFooter className="bg-[var(--surface)] px-[26px] py-[18px]">
          <VvButton type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </VvButton>
          <VvButton type="button" onClick={handleCreate} disabled={!canCreate} loading={creating}>
            Create &amp; continue
          </VvButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
