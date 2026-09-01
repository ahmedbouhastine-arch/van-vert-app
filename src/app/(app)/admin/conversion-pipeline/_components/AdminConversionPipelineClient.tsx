'use client';

import { useMemo, useState, type DragEvent } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { Plus, Search, ExternalLink, Trash2 } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Student, SubTask, ConversionType, ConversionStatus, PriorityLevel, TaskStatus, UserProfile } from '@/types';
import { VvButton } from '@/components/vv/VvButton';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

/* ── Static lookups (mirrors src/types ConversionStatus / ConversionType) ── */

const PIPELINE: ConversionStatus[] = ['pipeline', 'onboarded', 'waiting_for_docs', 'ready_to_fly', 'flying', 'license_application', 'done'];

const STATUS_LABEL: Record<ConversionStatus, string> = {
  pipeline: 'Pipeline',
  onboarded: 'Onboarded',
  waiting_for_docs: 'Waiting for Docs',
  ready_to_fly: 'Ready to Fly',
  flying: 'Flying',
  license_application: 'License Application',
  done: 'Done',
};

const STATUS_BADGE: Record<ConversionStatus, { bg: string; color: string }> = {
  pipeline: { bg: '#f1f5f9', color: '#64748b' },
  onboarded: { bg: '#e0f2fe', color: '#0369a1' },
  waiting_for_docs: { bg: '#fef3c7', color: '#d97706' },
  ready_to_fly: { bg: '#e1f4f7', color: '#0078a5' },
  flying: { bg: '#dbeafe', color: '#1d4ed8' },
  license_application: { bg: '#ede9fe', color: '#7c3aed' },
  done: { bg: '#dcfce7', color: '#16a34a' },
};

const PRIORITY_BADGE: Record<PriorityLevel, { bg: string; color: string; label: string }> = {
  high: { bg: '#fee2e2', color: '#dc2626', label: 'High' },
  medium: { bg: '#fef3c7', color: '#d97706', label: 'Medium' },
  low: { bg: '#dcfce7', color: '#16a34a', label: 'Low' },
};
const PRIORITY_RANK: Record<PriorityLevel, number> = { high: 0, medium: 1, low: 2 };

const TYPE_BADGE: Record<ConversionType, { bg: string; color: string }> = {
  CPL: { bg: '#e0f2fe', color: '#0369a1' },
  ATPL: { bg: '#e1e7f5', color: '#002d78' },
  PPL: { bg: '#f3e8ff', color: '#7c3aed' },
};

const TASK_STATE: Record<TaskStatus, { bg: string; color: string }> = {
  not_started: { bg: '#f1f5f9', color: '#64748b' },
  in_progress: { bg: '#fef3c7', color: '#d97706' },
  completed: { bg: '#dcfce7', color: '#16a34a' },
};

function fmtDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong.';
}

type SortKey = 'cadetName' | 'conversionType' | 'priorityLevel' | 'conversionStatus' | 'recencyDate' | 'onboardingDate' | 'soldByName';

/* ── Component ─────────────────────────────────────────────────────── */

export function AdminConversionPipelineClient() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const studentsQuery = useMemoFirebase(
    () => query(collection(firestore, 'students'), orderBy('cadetName')),
    [firestore]
  );
  const { data: students, isLoading: studentsLoading } = useCollection<Student>(studentsQuery);

  const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users } = useCollection<UserProfile>(usersQuery);

  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRep, setFilterRep] = useState('all');
  const [kanbanType, setKanbanType] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('cadetName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [dragId, setDragId] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<{ id: string; toStatus: ConversionStatus; text: string } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<ConversionType | ''>('');

  const subtasksQuery = useMemoFirebase(
    () => (selectedId ? collection(firestore, 'students', selectedId, 'subtasks') : null),
    [firestore, selectedId]
  );
  const { data: subtasks } = useCollection<SubTask>(subtasksQuery);

  const usersById = useMemo(() => {
    const map = new Map<string, UserProfile>();
    (users ?? []).forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  const repName = (st: Student) => (st.soldByUserId && usersById.get(st.soldByUserId)?.displayName) || st.soldByName || undefined;

  function reportWriteError(path: string, operation: 'create' | 'update' | 'delete', requestResourceData: unknown, err: unknown) {
    const permissionError = new FirestorePermissionError({ path, operation, requestResourceData });
    errorEmitter.emit('permission-error', permissionError);
    toast({ variant: 'destructive', title: 'Save failed', description: getErrorMessage(err) });
  }

  function updateStudent(id: string, patch: Partial<Student>) {
    const ref = doc(firestore, 'students', id);
    updateDoc(ref, { ...patch, updatedAt: serverTimestamp() }).catch((err) =>
      reportWriteError(ref.path, 'update', patch, err)
    );
  }

  function moveStudent(id: string, toStatus: ConversionStatus) {
    const student = (students ?? []).find((s) => s.id === id);
    updateStudent(id, { conversionStatus: toStatus });
    toast({ title: 'Status updated', description: `${student?.cadetName ?? 'Student'} moved to ${STATUS_LABEL[toStatus]}.` });
  }

  function addSubtask(studentId: string) {
    const ref = collection(firestore, 'students', studentId, 'subtasks');
    const data = { taskName: 'New subtask', taskStatus: 'not_started' as TaskStatus, completed: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    addDoc(ref, data).catch((err) => reportWriteError(ref.path, 'create', data, err));
  }

  function updateSubtask(studentId: string, taskId: string, patch: Partial<SubTask>) {
    const ref = doc(firestore, 'students', studentId, 'subtasks', taskId);
    updateDoc(ref, { ...patch, updatedAt: serverTimestamp() }).catch((err) => reportWriteError(ref.path, 'update', patch, err));
  }

  function deleteSubtask(studentId: string, taskId: string) {
    const ref = doc(firestore, 'students', studentId, 'subtasks', taskId);
    deleteDoc(ref).catch((err) => reportWriteError(ref.path, 'delete', {}, err));
  }

  function confirmCreate() {
    if (!newName.trim() || !newType) return;
    const ref = collection(firestore, 'students');
    const data = {
      cadetName: newName.trim(),
      conversionType: newType,
      priorityLevel: 'medium' as PriorityLevel,
      conversionStatus: 'pipeline' as ConversionStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    addDoc(ref, data)
      .then((docRef) => {
        setCreating(false);
        setSelectedId(docRef.id);
        toast({ title: 'Student created', description: `${data.cadetName} added to Pipeline.` });
      })
      .catch((err) => reportWriteError(ref.path, 'create', data, err));
  }

  /* ── Table rows ──────────────────────────────────────────────────── */

  const term = search.toLowerCase();
  const passesCommon = (st: Student) => st.cadetName.toLowerCase().includes(term);

  const tableRows = useMemo(() => {
    let rows = (students ?? []).filter(
      (st) =>
        passesCommon(st) &&
        (filterType === 'all' || st.conversionType === filterType) &&
        (filterPriority === 'all' || st.priorityLevel === filterPriority) &&
        (filterStatus === 'all' || st.conversionStatus === filterStatus) &&
        (filterRep === 'all' || (repName(st) ?? '—') === filterRep)
    );

    const rank = (st: Student, key: SortKey): string | number => {
      if (key === 'priorityLevel') return PRIORITY_RANK[st.priorityLevel];
      if (key === 'conversionStatus') return PIPELINE.indexOf(st.conversionStatus);
      if (key === 'soldByName') return (repName(st) ?? '').toLowerCase();
      if (key === 'recencyDate' || key === 'onboardingDate') return st[key] || '';
      return (st[key] ?? '').toString().toLowerCase();
    };

    rows = rows.slice().sort((a, b) => {
      const av = rank(a, sortKey);
      const bv = rank(b, sortKey);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, search, filterType, filterPriority, filterStatus, filterRep, sortKey, sortDir, usersById]);

  const toggleSort = (key: SortKey) => {
    setSortDir((dir) => (sortKey === key ? (dir === 'asc' ? 'desc' : 'asc') : 'asc'));
    setSortKey(key);
  };
  const sortIcon = (key: SortKey) => (sortKey === key ? (sortDir === 'asc' ? '↑' : '↓') : '');

  const subtaskLabel = (id: string) => {
    if (id !== selectedId || !subtasks) return null;
    const done = subtasks.filter((t) => t.taskStatus === 'completed').length;
    return `${done}/${subtasks.length}`;
  };

  /* ── Kanban columns ──────────────────────────────────────────────── */

  const kanbanFiltered = useMemo(
    () => (students ?? []).filter((st) => passesCommon(st) && (kanbanType === 'all' || st.conversionType === kanbanType)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [students, search, kanbanType]
  );

  function handleDrop(e: DragEvent<HTMLDivElement>, status: ConversionStatus, idx: number) {
    e.preventDefault();
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const student = (students ?? []).find((s) => s.id === id);
    if (!student || student.conversionStatus === status) return;
    const fromIdx = PIPELINE.indexOf(student.conversionStatus);
    const jump = Math.abs(idx - fromIdx);
    if (jump > 1) {
      setPendingMove({
        id,
        toStatus: status,
        text: `Move ${student.cadetName} from ${STATUS_LABEL[student.conversionStatus]} to ${STATUS_LABEL[status]}? This skips ${jump - 1} stage(s).`,
      });
    } else {
      moveStudent(id, status);
    }
  }

  const repOptions = useMemo(() => {
    const names = new Set<string>();
    (students ?? []).forEach((st) => {
      const n = repName(st);
      if (n) names.add(n);
    });
    return Array.from(names);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, usersById]);

  const selectedStudent = (students ?? []).find((s) => s.id === selectedId) ?? null;

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <div>
      {/* Toolbar: view toggle + search/filters + primary action */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-full bg-[var(--sky-pale)] p-[3px]">
          <button
            type="button"
            onClick={() => setView('table')}
            className={cn(
              'rounded-full px-[18px] py-2 text-[13px] font-medium transition-all',
              view === 'table' ? 'bg-white text-[var(--navy)] shadow-sm' : 'text-[var(--text-secondary)]'
            )}
          >
            Table
          </button>
          <button
            type="button"
            onClick={() => setView('kanban')}
            className={cn(
              'rounded-full px-[18px] py-2 text-[13px] font-medium transition-all',
              view === 'kanban' ? 'bg-white text-[var(--navy)] shadow-sm' : 'text-[var(--text-secondary)]'
            )}
          >
            Kanban
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cadet name…"
              className="w-[220px] rounded-lg border border-[var(--vv-border)] bg-white py-2 pl-9 pr-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--sky)]"
            />
          </div>

          {view === 'table' ? (
            <>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-[34px] rounded-lg border border-[var(--vv-border)] bg-white px-2.5 text-[13px] text-[var(--text-primary)]"
              >
                <option value="all">All types</option>
                <option value="CPL">CPL</option>
                <option value="ATPL">ATPL</option>
                <option value="PPL">PPL</option>
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="h-[34px] rounded-lg border border-[var(--vv-border)] bg-white px-2.5 text-[13px] text-[var(--text-primary)]"
              >
                <option value="all">All priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-[34px] rounded-lg border border-[var(--vv-border)] bg-white px-2.5 text-[13px] text-[var(--text-primary)]"
              >
                <option value="all">All statuses</option>
                {PIPELINE.map((v) => (
                  <option key={v} value={v}>{STATUS_LABEL[v]}</option>
                ))}
              </select>
              <select
                value={filterRep}
                onChange={(e) => setFilterRep(e.target.value)}
                className="h-[34px] rounded-lg border border-[var(--vv-border)] bg-white px-2.5 text-[13px] text-[var(--text-primary)]"
              >
                <option value="all">All reps</option>
                {repOptions.map((rep) => (
                  <option key={rep} value={rep}>{rep}</option>
                ))}
              </select>
            </>
          ) : (
            <div className="inline-flex gap-0.5 rounded-full border border-[var(--vv-border)] bg-white p-[3px]">
              {(['all', 'CPL', 'ATPL', 'PPL'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setKanbanType(t)}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-xs font-medium transition-all',
                    kanbanType === t ? 'bg-[var(--navy)] text-white' : 'text-[var(--text-secondary)]'
                  )}
                >
                  {t === 'all' ? 'All types' : t}
                </button>
              ))}
            </div>
          )}

          <VvButton
            size="sm"
            className="ml-1"
            onClick={() => {
              setCreating(true);
              setNewName('');
              setNewType('');
            }}
          >
            <Plus className="h-4 w-4" />
            New Student
          </VvButton>
        </div>
      </div>

      {studentsLoading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!studentsLoading && view === 'table' && (
        <div className="overflow-hidden rounded-xl border border-[var(--vv-border)] bg-white">
          <div className="overflow-x-auto">
            <Table className="min-w-[1100px]">
              <TableHeader className="bg-[var(--surface)]">
                <TableRow className="border-[var(--vv-border-soft)] hover:bg-transparent">
                  {([
                    ['cadetName', 'Cadet'],
                    ['conversionType', 'Type'],
                    ['priorityLevel', 'Priority'],
                    ['conversionStatus', 'Status'],
                    ['recencyDate', 'Recency'],
                    ['onboardingDate', 'Onboarded'],
                    ['soldByName', 'Rep'],
                  ] as [SortKey, string][]).map(([key, label]) => (
                    <TableHead
                      key={key}
                      onClick={() => toggleSort(key)}
                      className="cursor-pointer whitespace-nowrap text-[var(--text-muted)]"
                    >
                      {label} {sortIcon(key)}
                    </TableHead>
                  ))}
                  <TableHead className="whitespace-nowrap text-[var(--text-muted)]">Source</TableHead>
                  <TableHead className="whitespace-nowrap text-right text-[var(--text-muted)]">Subtasks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-[var(--text-muted)]">
                      No students match your filters.
                    </TableCell>
                  </TableRow>
                )}
                {tableRows.map((st) => (
                  <TableRow
                    key={st.id}
                    onClick={() => setSelectedId(st.id)}
                    className="cursor-pointer border-[var(--vv-border-soft)] hover:bg-[var(--sky-mist)]"
                  >
                    <TableCell className="whitespace-nowrap font-outfit text-sm font-semibold text-[var(--navy)]">{st.cadetName}</TableCell>
                    <TableCell>
                      <Badge bg={TYPE_BADGE[st.conversionType].bg} color={TYPE_BADGE[st.conversionType].color}>{st.conversionType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge bg={PRIORITY_BADGE[st.priorityLevel].bg} color={PRIORITY_BADGE[st.priorityLevel].color}>{PRIORITY_BADGE[st.priorityLevel].label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge bg={STATUS_BADGE[st.conversionStatus].bg} color={STATUS_BADGE[st.conversionStatus].color}>{STATUS_LABEL[st.conversionStatus]}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-[13px] text-[var(--text-secondary)]">{fmtDate(st.recencyDate)}</TableCell>
                    <TableCell className="whitespace-nowrap text-[13px] text-[var(--text-secondary)]">{fmtDate(st.onboardingDate)}</TableCell>
                    <TableCell className="whitespace-nowrap text-[13px] text-[var(--text-primary)]">{repName(st) ?? '—'}</TableCell>
                    <TableCell className="whitespace-nowrap text-[13px] text-[var(--text-secondary)]">{st.source || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap text-right text-[13px] font-medium text-[var(--text-secondary)]">
                      {st.id === selectedId ? subtaskLabel(st.id) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {!studentsLoading && view === 'kanban' && (
        <div className="flex items-start gap-4 overflow-x-auto pb-2">
          {PIPELINE.map((status, idx) => {
            const cards = kanbanFiltered.filter((st) => st.conversionStatus === status);
            return (
              <div
                key={status}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, status, idx)}
                className="flex min-h-[200px] w-[264px] shrink-0 flex-col rounded-xl bg-[var(--sky-mist)]"
              >
                <div className="flex items-center justify-between gap-2 px-3.5 pb-2.5 pt-3.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_BADGE[status].color }} />
                    <span className="truncate font-outfit text-[13px] font-semibold text-[var(--navy)]">{STATUS_LABEL[status]}</span>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">{cards.length}</span>
                </div>
                <div className="flex flex-1 flex-col gap-2.5 px-2.5 pb-3.5">
                  {cards.map((st) => (
                    <div
                      key={st.id}
                      draggable
                      onDragStart={() => setDragId(st.id)}
                      onClick={() => setSelectedId(st.id)}
                      className="cursor-grab rounded-[10px] border border-[var(--vv-border)] bg-white p-3 shadow-sm"
                    >
                      <div className="mb-2 font-outfit text-[13px] font-semibold text-[var(--navy)]">{st.cadetName}</div>
                      <div className="mb-2 flex items-center gap-1.5">
                        <Badge bg={TYPE_BADGE[st.conversionType].bg} color={TYPE_BADGE[st.conversionType].color} small>{st.conversionType}</Badge>
                        <Badge bg={PRIORITY_BADGE[st.priorityLevel].bg} color={PRIORITY_BADGE[st.priorityLevel].color} small>{PRIORITY_BADGE[st.priorityLevel].label}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                        <span>{repName(st) ?? '—'}</span>
                        <span>{st.id === selectedId ? subtaskLabel(st.id) : ''}</span>
                      </div>
                    </div>
                  ))}
                  {cards.length === 0 && (
                    <div className="rounded-[10px] border border-dashed border-[var(--vv-border)] p-4 text-center text-xs text-[var(--text-muted)]">No cadets</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Skip-stage confirm */}
      <AlertDialog open={!!pendingMove} onOpenChange={(open) => !open && setPendingMove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-outfit text-[var(--navy)]">Skip pipeline stages?</AlertDialogTitle>
            <AlertDialogDescription>{pendingMove?.text}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingMove(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingMove) moveStudent(pendingMove.id, pendingMove.toStatus);
                setPendingMove(null);
              }}
            >
              Move anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Student modal */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="font-outfit text-[var(--navy)]">New Student</DialogTitle>
          </DialogHeader>
          <p className="-mt-2 text-[13px] text-[var(--text-muted)]">Conversion type is required — there&apos;s no default.</p>
          <div className="flex flex-col gap-3.5">
            <div>
              <div className="mb-1.5 text-xs font-semibold text-[var(--text-secondary)]">Cadet name</div>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Full name"
                className="h-[38px] w-full rounded-lg border border-[var(--vv-border)] bg-white px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--sky)]"
              />
            </div>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-[var(--text-secondary)]">Conversion type</div>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as ConversionType)}
                className="h-[38px] w-full rounded-lg border border-[var(--vv-border)] bg-white px-2.5 text-[13px] text-[var(--text-primary)]"
              >
                <option value="">Select type…</option>
                <option value="CPL">CPL</option>
                <option value="ATPL">ATPL</option>
                <option value="PPL">PPL</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <VvButton variant="outline" size="sm" onClick={() => setCreating(false)}>Cancel</VvButton>
            <VvButton size="sm" disabled={!newName.trim() || !newType} onClick={confirmCreate}>Create student</VvButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail drawer */}
      <Sheet open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-[480px]">
          {selectedStudent && (
            <StudentDetail
              student={selectedStudent}
              subtasks={subtasks ?? []}
              repDisplay={repName(selectedStudent) ?? 'Unassigned'}
              onUpdate={(patch) => updateStudent(selectedStudent.id, patch)}
              onAddSubtask={() => addSubtask(selectedStudent.id)}
              onUpdateSubtask={(taskId, patch) => updateSubtask(selectedStudent.id, taskId, patch)}
              onDeleteSubtask={(taskId) => deleteSubtask(selectedStudent.id, taskId)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ── Small presentational pieces ───────────────────────────────────── */

function Badge({ bg, color, children, small }: { bg: string; color: string; children: React.ReactNode; small?: boolean }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full font-medium', small ? 'px-2 py-0.5 text-[11px]' : 'px-[11px] py-[5px] text-xs')}
      style={{ background: bg, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

function StudentDetail({
  student,
  subtasks,
  repDisplay,
  onUpdate,
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
}: {
  student: Student;
  subtasks: SubTask[];
  repDisplay: string;
  onUpdate: (patch: Partial<Student>) => void;
  onAddSubtask: () => void;
  onUpdateSubtask: (taskId: string, patch: Partial<SubTask>) => void;
  onDeleteSubtask: (taskId: string) => void;
}) {
  const doneCount = subtasks.filter((t) => t.taskStatus === 'completed').length;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[2px] text-[var(--sky)]">Student</div>
      <input
        defaultValue={student.cadetName}
        onBlur={(e) => e.target.value.trim() && e.target.value !== student.cadetName && onUpdate({ cadetName: e.target.value.trim() })}
        className="mb-5 w-full border-none bg-transparent p-0 font-outfit text-lg font-semibold text-[var(--navy)] outline-none"
      />

      <div className="mb-5 grid grid-cols-2 gap-3.5">
        <Field label="Conversion type">
          <select
            value={student.conversionType}
            onChange={(e) => onUpdate({ conversionType: e.target.value as ConversionType })}
            className="h-9 w-full rounded-lg border border-[var(--vv-border)] bg-white px-2.5 text-[13px] text-[var(--text-primary)]"
          >
            <option value="CPL">CPL</option>
            <option value="ATPL">ATPL</option>
            <option value="PPL">PPL</option>
          </select>
        </Field>
        <Field label="Priority">
          <select
            value={student.priorityLevel}
            onChange={(e) => onUpdate({ priorityLevel: e.target.value as PriorityLevel })}
            className="h-9 w-full rounded-lg border border-[var(--vv-border)] bg-white px-2.5 text-[13px] text-[var(--text-primary)]"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </Field>
        <Field label="Status">
          <select
            value={student.conversionStatus}
            onChange={(e) => onUpdate({ conversionStatus: e.target.value as ConversionStatus })}
            className="h-9 w-full rounded-lg border border-[var(--vv-border)] bg-white px-2.5 text-[13px] text-[var(--text-primary)]"
          >
            {PIPELINE.map((v) => (
              <option key={v} value={v}>{STATUS_LABEL[v]}</option>
            ))}
          </select>
        </Field>
        <Field label="Source">
          <input
            defaultValue={student.source ?? ''}
            onBlur={(e) => onUpdate({ source: e.target.value })}
            placeholder="e.g. Referral"
            className="h-9 w-full rounded-lg border border-[var(--vv-border)] bg-white px-2.5 text-[13px] text-[var(--text-primary)] outline-none"
          />
        </Field>
        <Field label="Recency date">
          <input
            type="date"
            defaultValue={student.recencyDate ?? ''}
            onChange={(e) => onUpdate({ recencyDate: e.target.value })}
            className="h-9 w-full rounded-lg border border-[var(--vv-border)] bg-white px-2.5 text-[13px] text-[var(--text-primary)]"
          />
        </Field>
        <Field label="Onboarding date">
          <input
            type="date"
            defaultValue={student.onboardingDate ?? ''}
            onChange={(e) => onUpdate({ onboardingDate: e.target.value })}
            className="h-9 w-full rounded-lg border border-[var(--vv-border)] bg-white px-2.5 text-[13px] text-[var(--text-primary)]"
          />
        </Field>
        <Field label="Email">
          <input
            defaultValue={student.email ?? ''}
            onBlur={(e) => onUpdate({ email: e.target.value })}
            className="h-9 w-full rounded-lg border border-[var(--vv-border)] bg-white px-2.5 text-[13px] text-[var(--text-primary)] outline-none"
          />
        </Field>
        <Field label="Phone">
          <input
            defaultValue={student.phone ?? ''}
            onBlur={(e) => onUpdate({ phone: e.target.value })}
            className="h-9 w-full rounded-lg border border-[var(--vv-border)] bg-white px-2.5 text-[13px] text-[var(--text-primary)] outline-none"
          />
        </Field>
      </div>

      <div className="mb-5">
        <div className="mb-1.5 text-xs font-semibold text-[var(--text-secondary)]">Rep</div>
        <div className={cn('text-[13px]', student.soldByUserId ? 'text-[var(--sky)]' : 'text-[var(--text-muted)]')}>{repDisplay}</div>
      </div>

      <div className="mb-5">
        <div className="mb-1.5 text-xs font-semibold text-[var(--text-secondary)]">Google Drive folder</div>
        <div className="flex gap-2">
          <input
            defaultValue={student.googleDriveUrl ?? ''}
            onBlur={(e) => onUpdate({ googleDriveUrl: e.target.value })}
            placeholder="https://drive.google.com/…"
            className="h-9 flex-1 rounded-lg border border-[var(--vv-border)] bg-white px-2.5 text-[13px] text-[var(--text-primary)] outline-none"
          />
          {student.googleDriveUrl && (
            <a
              href={student.googleDriveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--vv-border)] text-[var(--sky)]"
            >
              <ExternalLink className="h-[15px] w-[15px]" />
            </a>
          )}
        </div>
      </div>

      <div className="mb-5">
        <div className="mb-1.5 text-xs font-semibold text-[var(--text-secondary)]">Description</div>
        <Textarea
          defaultValue={student.description ?? ''}
          onBlur={(e) => onUpdate({ description: e.target.value })}
          rows={2}
          placeholder="No description"
          className="resize-y text-[13px]"
        />
      </div>

      <div className="mb-5">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="text-xs font-semibold text-[var(--text-secondary)]">Subtasks · {doneCount}/{subtasks.length}</div>
          <button type="button" onClick={onAddSubtask} className="inline-flex items-center gap-1 text-xs font-medium text-[var(--sky)]">
            <Plus className="h-[13px] w-[13px]" />
            Add subtask
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {subtasks.map((t) => (
            <div key={t.id} className="rounded-[10px] border border-[var(--vv-border-soft)] p-2.5">
              <div className="mb-2 flex items-center gap-2">
                <input
                  defaultValue={t.taskName}
                  onBlur={(e) => e.target.value.trim() && onUpdateSubtask(t.id, { taskName: e.target.value.trim() })}
                  className="min-w-0 flex-1 border-none bg-transparent p-0 text-[13px] font-medium text-[var(--text-primary)] outline-none"
                />
                <button type="button" onClick={() => onDeleteSubtask(t.id)} className="shrink-0 p-0.5 text-[#c9556b]">
                  <Trash2 className="h-[14px] w-[14px]" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-full bg-slate-100 p-0.5">
                  {(['not_started', 'in_progress', 'completed'] as TaskStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onUpdateSubtask(t.id, { taskStatus: s, completed: s === 'completed' })}
                      className="rounded-full px-[9px] py-1 text-[11px] font-medium"
                      style={t.taskStatus === s ? { background: TASK_STATE[s].bg, color: TASK_STATE[s].color } : { color: '#8ba0ae' }}
                    >
                      {s === 'not_started' ? 'Not started' : s === 'in_progress' ? 'In progress' : 'Done'}
                    </button>
                  ))}
                </div>
                <input
                  type="date"
                  defaultValue={t.date ?? ''}
                  onChange={(e) => onUpdateSubtask(t.id, { date: e.target.value })}
                  className="h-7 rounded-md border border-[var(--vv-border-soft)] bg-white px-2 text-[11px] text-[var(--text-secondary)]"
                />
                <input
                  defaultValue={t.ownerName ?? ''}
                  onBlur={(e) => onUpdateSubtask(t.id, { ownerName: e.target.value })}
                  placeholder="Owner"
                  className="h-7 w-[100px] rounded-md border border-[var(--vv-border-soft)] bg-white px-2 text-[11px] text-[var(--text-secondary)] outline-none"
                />
              </div>
            </div>
          ))}
          {subtasks.length === 0 && <p className="text-xs text-[var(--text-muted)]">No subtasks yet.</p>}
        </div>
      </div>

      <div>
        <div className="mb-1.5 text-xs font-semibold text-[var(--text-secondary)]">Notes</div>
        <Textarea
          defaultValue={student.notes ?? ''}
          onBlur={(e) => onUpdate({ notes: e.target.value })}
          rows={3}
          placeholder="No notes"
          className="resize-y text-[13px]"
        />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold text-[var(--text-secondary)]">{label}</div>
      {children}
    </div>
  );
}
