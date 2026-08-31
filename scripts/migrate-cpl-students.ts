/**
 * One-off migration of the "VAA_CPL Conversion" Airtable base (Students +
 * Sub-tasks) into Van-Vert's Firestore, as the initial dataset for the new
 * /students collection. Airtable was a proof of concept only and is not kept
 * live after this runs — this is not a recurring sync.
 *
 * Source data: scripts/data/airtable-cpl-export.json — a raw export of the
 * base's Students and Sub-tasks tables (Airtable base appBmvkGVZ8oY4o7N),
 * pulled once via the Airtable API. Re-export that file if the source data
 * changes before this script is run.
 *
 * Firestore doc IDs are the source Airtable record IDs (e.g. "recHAW..."),
 * so the script is idempotent/safe to re-run with --write: it always
 * overwrites the same documents rather than creating duplicates.
 *
 * Field mapping notes:
 *  - priorityLevel / conversionStatus / taskStatus: Airtable select option
 *    names -> the lowercase/snake enum values in src/types/index.ts.
 *  - "Sold" (Student) / "Owner" (Sub-task) Airtable collaborators: matched
 *    against Van-Vert's /users collection by email -> soldByUserId /
 *    ownerUserId. Falls back to storing the display name only
 *    (soldByName / ownerName) when no matching account is found.
 *  - Sub-tasks without a linked student in Airtable (the source base
 *    contains several — leftover template rows unrelated to any real
 *    candidate, e.g. "Analyze feedback", "Write user stories") are NOT
 *    written; they're logged for manual review instead.
 *  - One source Student record (recbTL2umg9CELWbb) has no name, priority, or
 *    status set in Airtable (an incomplete/test row) — it's migrated with
 *    placeholder values and flagged in the summary rather than dropped,
 *    since real Sub-tasks are linked to it.
 *
 * Usage:
 *   npx tsx scripts/migrate-cpl-students.ts            (dry run, logs only)
 *   npx tsx scripts/migrate-cpl-students.ts --write    (applies the writes)
 */

import * as fs from 'fs';
import * as path from 'path';
import admin from 'firebase-admin';
import { adminFirestore } from '../src/firebase/admin-init';
import type { ConversionStatus, PriorityLevel, TaskStatus } from '../src/types';

type AirtableExport = {
  fieldMap: {
    students: Record<string, string>;
    subtasks: Record<string, string>;
  };
  students: Array<{ id: string; cellValuesByFieldId: Record<string, unknown> }>;
  subtasks: Array<{ id: string; cellValuesByFieldId: Record<string, unknown> }>;
};

const PRIORITY_MAP: Record<string, PriorityLevel> = {
  High: 'high',
  Medium: 'medium',
  Low: 'low',
};

const CONVERSION_STATUS_MAP: Record<string, ConversionStatus> = {
  Pipeline: 'pipeline',
  Onboarded: 'onboarded',
  'Waiting for docs': 'waiting_for_docs',
  'Ready to Fly': 'ready_to_fly',
  Flying: 'flying',
  'CPL Application': 'cpl_application',
  Done: 'done',
};

const TASK_STATUS_MAP: Record<string, TaskStatus> = {
  'Not Started': 'not_started',
  'In Progress': 'in_progress',
  Completed: 'completed',
};

function selectName(value: unknown): string | undefined {
  if (value && typeof value === 'object' && 'name' in (value as Record<string, unknown>)) {
    return String((value as Record<string, unknown>).name);
  }
  return undefined;
}

function collaboratorInfo(value: unknown): { name?: string; email?: string } {
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    return { name: v.name as string | undefined, email: v.email as string | undefined };
  }
  return {};
}

function linkedRecordIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => (v && typeof v === 'object' && 'id' in (v as object) ? String((v as { id: string }).id) : null))
      .filter((v): v is string => !!v);
  }
  return [];
}

async function resolveUserIdByEmail(email: string | undefined, cache: Map<string, string | null>): Promise<string | null> {
  if (!email) return null;
  if (cache.has(email)) return cache.get(email) ?? null;

  const snap = await adminFirestore.collection('users').where('email', '==', email).limit(1).get();
  const userId = snap.empty ? null : snap.docs[0].id;
  cache.set(email, userId);
  return userId;
}

async function main() {
  const shouldWrite = process.argv.includes('--write');

  const exportPath = path.join(__dirname, 'data', 'airtable-cpl-export.json');
  const raw: AirtableExport = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));

  const { students: studentFieldMap, subtasks: subtaskFieldMap } = raw.fieldMap;
  const userIdCache = new Map<string, string | null>();

  const warnings: string[] = [];
  const now = admin.firestore.FieldValue.serverTimestamp();

  // --- Students ---
  console.log(`Found ${raw.students.length} student(s) in the export.`);
  const studentWrites: Array<{ id: string; data: Record<string, unknown> }> = [];

  for (const rec of raw.students) {
    const cv = rec.cellValuesByFieldId;
    const get = (fieldId: string) => cv[fieldId];

    const cadetName = (get(Object.keys(studentFieldMap).find((k) => studentFieldMap[k] === 'cadetName')!) as string) || undefined;
    const priorityRaw = selectName(get(Object.keys(studentFieldMap).find((k) => studentFieldMap[k] === 'priorityLevel')!));
    const statusRaw = selectName(get(Object.keys(studentFieldMap).find((k) => studentFieldMap[k] === 'conversionStatus')!));
    const sold = collaboratorInfo(get(Object.keys(studentFieldMap).find((k) => studentFieldMap[k] === 'sold')!));

    if (!cadetName) {
      warnings.push(`Student ${rec.id}: no cadet name in Airtable — migrated as "(unnamed — ${rec.id})". Needs manual follow-up.`);
    }
    if (!priorityRaw) {
      warnings.push(`Student ${rec.id}: no priority level in Airtable — defaulted to "medium".`);
    }
    if (!statusRaw) {
      warnings.push(`Student ${rec.id}: no conversion status in Airtable — defaulted to "pipeline".`);
    }

    const soldByUserId = await resolveUserIdByEmail(sold.email, userIdCache);
    if (sold.name && !soldByUserId) {
      warnings.push(`Student ${rec.id}: "Sold" collaborator "${sold.name}" (${sold.email ?? 'no email'}) has no matching Van-Vert account — stored as soldByName only.`);
    }

    const data: Record<string, unknown> = {
      cadetName: cadetName ?? `(unnamed — ${rec.id})`,
      priorityLevel: (priorityRaw && PRIORITY_MAP[priorityRaw]) || 'medium',
      conversionStatus: (statusRaw && CONVERSION_STATUS_MAP[statusRaw]) || 'pipeline',
      createdAt: now,
      updatedAt: now,
      _migratedFromAirtableId: rec.id,
    };

    const description = get(Object.keys(studentFieldMap).find((k) => studentFieldMap[k] === 'description')!) as string | undefined;
    const googleDriveUrl = get(Object.keys(studentFieldMap).find((k) => studentFieldMap[k] === 'googleDriveUrl')!) as string | undefined;
    const recencyDate = get(Object.keys(studentFieldMap).find((k) => studentFieldMap[k] === 'recencyDate')!) as string | undefined;
    const onboardingDate = get(Object.keys(studentFieldMap).find((k) => studentFieldMap[k] === 'onboardingDate')!) as string | undefined;
    const email = get(Object.keys(studentFieldMap).find((k) => studentFieldMap[k] === 'email')!) as string | undefined;
    const phone = get(Object.keys(studentFieldMap).find((k) => studentFieldMap[k] === 'phone')!) as string | undefined;
    const source = get(Object.keys(studentFieldMap).find((k) => studentFieldMap[k] === 'source')!) as string | undefined;
    const notes = get(Object.keys(studentFieldMap).find((k) => studentFieldMap[k] === 'notes')!) as string | undefined;

    if (description) data.description = description;
    if (googleDriveUrl) data.googleDriveUrl = googleDriveUrl;
    if (recencyDate) data.recencyDate = recencyDate;
    if (onboardingDate) data.onboardingDate = onboardingDate;
    if (email) data.email = email;
    if (phone) data.phone = phone;
    if (source) data.source = source;
    if (notes) data.notes = notes;
    if (soldByUserId) data.soldByUserId = soldByUserId;
    if (sold.name) data.soldByName = sold.name;

    studentWrites.push({ id: rec.id, data });
    console.log(`- Student ${rec.id} ("${data.cadetName}"): status=${data.conversionStatus}, priority=${data.priorityLevel}${shouldWrite ? '' : ' (dry run, not applied)'}`);
  }

  // --- Sub-tasks ---
  console.log(`\nFound ${raw.subtasks.length} sub-task(s) in the export.`);
  const validStudentIds = new Set(raw.students.map((s) => s.id));
  const subtaskWrites: Array<{ studentId: string; id: string; data: Record<string, unknown> }> = [];
  let orphanedCount = 0;

  for (const rec of raw.subtasks) {
    const cv = rec.cellValuesByFieldId;
    const get = (fieldId: string) => cv[fieldId];

    const studentLinks = linkedRecordIds(get(Object.keys(subtaskFieldMap).find((k) => subtaskFieldMap[k] === 'studentLinks')!));
    const studentId = studentLinks.find((id) => validStudentIds.has(id));

    if (!studentId) {
      orphanedCount++;
      const taskName = get(Object.keys(subtaskFieldMap).find((k) => subtaskFieldMap[k] === 'taskName')!) as string | undefined;
      warnings.push(`Sub-task ${rec.id} ("${taskName ?? 'untitled'}"): no linked student in Airtable — skipped, not migrated.`);
      continue;
    }

    const taskName = (get(Object.keys(subtaskFieldMap).find((k) => subtaskFieldMap[k] === 'taskName')!) as string) || '(untitled task)';
    const statusRaw = selectName(get(Object.keys(subtaskFieldMap).find((k) => subtaskFieldMap[k] === 'taskStatus')!));
    const date = get(Object.keys(subtaskFieldMap).find((k) => subtaskFieldMap[k] === 'date')!) as string | undefined;
    const completedFlag = get(Object.keys(subtaskFieldMap).find((k) => subtaskFieldMap[k] === 'completed')!) as boolean | undefined;
    const owner = collaboratorInfo(get(Object.keys(subtaskFieldMap).find((k) => subtaskFieldMap[k] === 'owner')!));
    // Airtable had both a "Notes" and a "Notes copy" field with identical content on every
    // record we saw — collapse to one.
    const notes = (get(Object.keys(subtaskFieldMap).find((k) => subtaskFieldMap[k] === 'notes')!) as string | undefined)
      ?? (get(Object.keys(subtaskFieldMap).find((k) => subtaskFieldMap[k] === 'notesCopy')!) as string | undefined);

    const taskStatus = (statusRaw && TASK_STATUS_MAP[statusRaw]) || 'not_started';
    const ownerUserId = await resolveUserIdByEmail(owner.email, userIdCache);
    if (owner.name && !ownerUserId) {
      warnings.push(`Sub-task ${rec.id}: owner "${owner.name}" (${owner.email ?? 'no email'}) has no matching Van-Vert account — stored as ownerName only.`);
    }

    const data: Record<string, unknown> = {
      taskName,
      taskStatus,
      completed: completedFlag ?? taskStatus === 'completed',
      createdAt: now,
      updatedAt: now,
      _migratedFromAirtableId: rec.id,
    };
    if (date) data.date = date;
    if (notes) data.notes = notes;
    if (ownerUserId) data.ownerUserId = ownerUserId;
    if (owner.name) data.ownerName = owner.name;

    subtaskWrites.push({ studentId, id: rec.id, data });
  }

  console.log(`Mapped ${subtaskWrites.length} sub-task(s) to a student; ${orphanedCount} orphaned (no linked student, skipped).`);

  // --- Write (batched, Firestore's 500-write-per-batch limit) ---
  if (shouldWrite) {
    const allWrites: Array<() => FirebaseFirestore.DocumentReference> = [];
    let batch = adminFirestore.batch();
    let opsInBatch = 0;
    const commits: Promise<unknown>[] = [];

    const addWrite = (ref: FirebaseFirestore.DocumentReference, data: Record<string, unknown>) => {
      batch.set(ref, data, { merge: false });
      opsInBatch++;
      if (opsInBatch === 450) {
        commits.push(batch.commit());
        batch = adminFirestore.batch();
        opsInBatch = 0;
      }
    };

    for (const s of studentWrites) {
      addWrite(adminFirestore.collection('students').doc(s.id), s.data);
    }
    for (const t of subtaskWrites) {
      addWrite(adminFirestore.collection('students').doc(t.studentId).collection('subtasks').doc(t.id), t.data);
    }
    if (opsInBatch > 0) commits.push(batch.commit());

    await Promise.all(commits);
    console.log(`\nWrote ${studentWrites.length} student(s) and ${subtaskWrites.length} sub-task(s) to Firestore.`);
  } else {
    console.log('\nDry run complete. Re-run with --write to apply these writes.');
  }

  if (warnings.length > 0) {
    console.log(`\n${warnings.length} item(s) need manual review:`);
    for (const w of warnings) console.log(`  - ${w}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration script failed:', err);
    process.exit(1);
  });
