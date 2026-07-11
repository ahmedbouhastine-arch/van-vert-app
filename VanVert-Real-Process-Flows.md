# VanVert — Real Process Flows

> Extracted directly from source code. Field names, status values, and function names are quoted verbatim from the codebase. Do not modify without re-verifying against the source.

---

## Table of Contents

1. [Application Creation](#1-application-creation)
2. [Document Upload](#2-document-upload)
3. [Flight Log Entry](#3-flight-log-entry)
4. [Application Submission](#4-application-submission)
5. [Admin Review Flow](#5-admin-review-flow)
6. [Reference: Status Values](#6-reference-status-values)

---

## 1. Application Creation

**Entry point:** `/applications/new`
**Source:** `src/app/(app)/applications/new/page.tsx`, `src/app/actions.ts`, `src/lib/licensing.ts`

### Access Control

- Users with role `'reviewer'`, `'admin'`, or `'head-admin'` are **redirected** to `/admin`.
- Only regular authenticated users reach this page.

### Step 1 — License Type Selection

The page displays three license types as selectable cards. Each card shows `license.name` and `license.description`.

| License ID | Display Name     |
|------------|-----------------|
| `ppl`      | PPL Conversion  |
| `cpl`      | CPL Conversion  |
| `atpl`     | ATPL Conversion |

**User action:** Click "Start Application" on a card.

### Step 2 — Application Created

**Server action:** `createApplicationAction(licenseType.id, idToken)` (`src/app/actions.ts` line 187)

The application document is written to Firestore with these initial fields:

| Field             | Initial Value                          |
|-------------------|----------------------------------------|
| `id`              | `uuidv4()` (UUID v4)                  |
| `userId`          | From authenticated token               |
| `licenseType`     | e.g. `"PPL Conversion"`               |
| `status`          | `'draft'`                             |
| `documents`       | Array initialized with `status: 'missing'` per requirement |
| `flightLogs`      | `[]`                                  |
| `flightLogPdfUrl` | `""`                                  |
| `logbookFormat`   | `'simple'`                            |
| `feedback`        | `""`                                  |
| `createdAt`       | Firestore `serverTimestamp()`         |
| `updatedAt`       | Firestore `serverTimestamp()`         |

**Side effect:** `sendApplicationReceivedEmail(userRecord.email, userRecord.displayName, newAppId)` is called.

**Redirect:** User is sent to `/applications/{applicationId}`.

### Step 3 — Document Requirements Initialized

Documents are auto-populated based on `licenseType`. Each entry has `status: 'missing'` initially.

#### PPL Conversion — Document Requirements

| ID                    | Name                                  | Requires Expiry |
|-----------------------|---------------------------------------|-----------------|
| `photoId`             | Passport or National ID               | Yes             |
| `pplLicense`          | Existing PPL License                  | Yes             |
| `licenseVerification` | License Verification Letter           | No              |
| `logbookPPL`          | Pilot Logbook                         | No              |
| `medicalCertClass2`   | Class 2 Medical Certificate           | Yes             |
| `englishProficiency`  | English Proficiency Certificate       | Yes             |
| `photos`              | Passport-Style Photos                 | No              |
| `airLawExam`          | Air Law Exam Proof                    | No              |
| `rtLicense`           | Radio Telephony License               | Yes             |
| `applicationForm`     | Application Form & Payment Receipt    | No              |

#### CPL Conversion — Document Requirements

| ID                    | Name                                  | Requires Expiry |
|-----------------------|---------------------------------------|-----------------|
| `photoId`             | Passport or National ID               | Yes             |
| `cplLicense`          | Existing CPL License                  | Yes             |
| `licenseVerification` | License Verification Letter           | No              |
| `medicalCertClass1`   | Class 1 Medical Certificate           | Yes             |
| `instrumentRating`    | Instrument Rating Certificate         | Yes             |
| `multiEngineRating`   | Multi-Engine Rating Certificate       | Yes             |
| `atplTheoryCPL`       | ATPL Theory Credits or Conversion Exam Results | No     |
| `englishProficiency`  | English Proficiency Certificate       | Yes             |
| `photos`              | Passport-Style Photos                 | No              |
| `applicationForm`     | Application Form & Payment Receipt    | No              |

#### ATPL Conversion — Document Requirements

| ID                    | Name                                          | Requires Expiry |
|-----------------------|-----------------------------------------------|-----------------|
| `photoId`             | Passport or National ID                       | Yes             |
| `atplLicense`         | Existing ATPL or "Frozen" ATPL License        | Yes             |
| `licenseVerification` | License Verification Letter                   | No              |
| `logbookATPL`         | Complete Flight Time Breakdown                | No              |
| `medicalCertClass1`   | Class 1 Medical Certificate                   | Yes             |
| `typeRating`          | Type Rating Certificates                      | Yes             |
| `simRecords`          | Simulator Proficiency or Recurrent Training Records | No        |
| `operatorExperience`  | Operator Experience Letters                   | No              |
| `advancedTheoryATPL`  | Advanced Theory Conversion Exam Results       | No              |
| `englishProficiency`  | English Proficiency Certificate               | Yes             |
| `photos`              | Passport-Style Photos                         | No              |
| `applicationForm`     | Application Form & Payment Receipt            | No              |

---

## 2. Document Upload

**Source:** `src/app/(app)/applications/[id]/_components/ApplicationClient.tsx`

### Constraints

| Constraint         | Value                                              |
|--------------------|----------------------------------------------------|
| Max file size      | 50 MB (`MAX_FILE_SIZE_MB = 50`)                   |
| Max PDF pages      | 64 pages (`MAX_PDF_PAGES = 64`)                   |
| Accepted formats   | `image/png`, `image/jpeg`, `image/webp`, `application/pdf` |

### Document Status Values

| Value              | Meaning                                           | Set By  |
|--------------------|---------------------------------------------------|---------|
| `'missing'`        | No file uploaded                                  | System (initial) |
| `'uploaded'`       | File received, awaiting review                    | User upload |
| `'needs_attention'`| Flagged (e.g. expiring within 90 days)            | Admin (AI check) |
| `'approved'`       | Admin accepted the document                       | Admin   |
| `'rejected'`       | Admin rejected the document                       | Admin   |

### Upload Steps

#### Step 1 — File Selection

- User clicks "Upload Document" or "Replace" button on a `DocumentCard`.
- Handler: `handleUploadClick(docId: string)` — sets `activeUploadDocId`.
- A hidden `<input type="file">` referenced by `fileInputRef` is triggered.

#### Step 2 — Client-Side Validation

- **Size check:** `file.size > MAX_FILE_SIZE_BYTES` → error toast shown, upload aborted.
- **PDF page check:** For PDF files only, `countPdfPages(file)` counts `/Type /Page` occurrences. If `pageCount > 64` → error toast, upload aborted.

#### Step 3 — Upload to Firebase Storage

- **Storage path:** `applications/{applicationId}/{docId}/{fileName}`
- File is uploaded via `uploadBytes(storageRef, file)`.
- Public URL retrieved via `getDownloadURL(snapshot.ref)`.

#### Step 4 — AI Expiry Date Extraction (conditional)

**Condition:** `docDefinition.requiresExpiry === true` AND file type is `image/*` or `application/pdf`.

- Server action: `extractExpiryDateAction({ applicationId, documentUrl, idToken })` (`src/app/actions.ts` line 235)
- AI flow: `src/ai/flows/extract-expiry-date.ts`
- Model: `vertexai/gemini-2.0-flash`, temperature `0.1`
- Prompt: *"You are an expert at processing official documents. Find and extract the expiry date from the provided document. Look for labels like 'Expiry Date', 'Expires', 'Valid Until', or similar. Return ONLY in YYYY-MM-DD format, or null if not found."*
- If detected, `expiryDate` is auto-populated.

#### Step 5 — Document State Update

Document object is updated with:

| Field         | Value                                    |
|---------------|------------------------------------------|
| `status`      | `'uploaded'`                            |
| `fileName`    | `file.name`                             |
| `fileType`    | `file.type \|\| ''`                     |
| `fileUrl`     | Firebase Storage public URL             |
| `uploadedAt`  | `new Date().toISOString()`              |
| `expiryDate`  | AI-detected date, or existing value, or `''` |

#### Step 6 — Persistence

- `handlePersistChanges({ documents: newDocuments }, successToast)`
- Firestore: `updateDoc(appRef, { documents: newDocuments, updatedAt: serverTimestamp() })`
- Toast: "Upload Successful" with filename.

### Manual Expiry Date Entry

- **UI:** Date `<input type="date">` rendered for any document where `doc.requiresExpiry === true`.
- **Input ID:** `expiry-{docId}`
- **Handler:** `handleDateChange(docId, dateString)` — saves to Firestore.
- **Clear button:** X button calls `handleClearDate(docId)` to remove the date.

### AI Check Expiry (Per Document)

- **Button:** "AI Check Expiry" — visible for documents where `status !== 'missing'`.
- **Handler:** `handleCheckSingleExpiry(docId)` → `getExpiryDateForSingleDocumentAction(appState.id, docId, idToken)`
- **Result:** Updates `expiryDate` on the document.

### Expiry Warning Indicator

- **Source field:** `doc.isExpiringSoon?: boolean` (set by admin's AI expiry check).
- **UI:** Orange alert box with text: *"This document is expiring soon. Please upload a renewed version."*

---

## 3. Flight Log Entry

**Source:** `src/app/(app)/applications/[id]/_components/ApplicationClient.tsx`, `src/app/actions.ts`, `src/ai/flows/extract-flight-logs.ts`, `src/ai/flows/check-recency.ts`

### Flight Log Data Structure

Each entry in the `flightLogs` array:

| Field                      | Type                                  | Notes                            |
|----------------------------|---------------------------------------|----------------------------------|
| `id`                       | `string` (UUID)                      | Generated by `uuidv4()`         |
| `date`                     | `string` (YYYY-MM-DD)                | `"YYYY-MM-00"` = unknown day    |
| `duration`                 | `number` (hours, decimal)            | Auto-calculated as sum of components |
| `aircraft`                 | `string`                             | Normalized (e.g. `"C-172"`)     |
| `flightType`               | `'PIC' \| 'Solo' \| 'Dual' \| 'Unknown'` |                              |
| `dualReceived`             | `number` (optional)                  | Dual instruction hours           |
| `pilotInCommand`           | `number` (optional)                  | PIC hours                        |
| `solo`                     | `number` (optional)                  | Solo hours                       |
| `instrumentSimulatedHours` | `number` (optional)                  | Simulated instrument hours       |

### Logbook Formats

| Value      | Description                                          |
|------------|------------------------------------------------------|
| `'typeA'`  | Separate columns for PIC, Solo, Dual (all distinct)  |
| `'typeB'`  | PIC column includes Solo, separate Dual column       |
| `'simple'` | Single duration column only                          |

---

### PDF Upload Flow (AI Extraction)

#### Step 1 — PDF Selection

- User clicks "Upload Log PDF" or "Replace PDF".
- Handler: `onClick={() => logPdfInputRef.current?.click()}`
- Hidden `<input type="file" accept="application/pdf">`.
- Toast shown immediately: *"AI Processing Started - Your flight log is being analyzed. This may take a moment."*

#### Step 2 — Client-Side Validation

- Max 50 MB size check.
- Max 64 PDF pages via `countPdfPages(file)`.

#### Step 3 — Server-Side AI Extraction

- **Server action:** `uploadFlightLogAction(formData, idToken)` (`src/app/actions.ts` line 116)
- PDF uploaded to Firebase Storage at `applications/{applicationId}/flight-log-{uuid}.pdf`.
- **Document AI processor:** `projects/157949929417/locations/us/processors/47422f02bcaec722/processorVersions/1e5684bc4378fc3e`

#### Step 4 — Entity Extraction (`src/ai/flows/extract-flight-logs.ts`)

Document AI detects these entity types from the PDF:

| Entity Type            | Meaning                                  |
|------------------------|------------------------------------------|
| `'Date'`               | Flight date                              |
| `'year'`               | Year context                             |
| `'aircraft_type'`      | Aircraft registration/type               |
| `'dual_hours'`         | Dual instruction hours                   |
| `'PIC_hours_solo_incl'`| PIC hours (may include solo)             |
| `'instrument_hours'`   | Simulated instrument hours               |
| `'solo_incl'`          | Solo hours indicator (triggers typeB)    |

**Date parsing rules:**
- `"02 16"` or `"0216"` → month=02, day=16
- `"02/16"` or `"02-16"` → month=02, day=16
- `"216"` → month=02, day=16
- Already valid YYYY-MM-DD passes through
- Page offset added for PDFs > 15 pages
- Missing day → `"YYYY-MM-00"` placeholder for manual correction

**Aircraft normalization:**
- `"(-172"` → `"C-172"`
- `"0-172"` → `"C-172"`
- Lowercase `"c-"` → `"C-"`

**Hour parsing rules:**
- `"1.3"` → `1.3`
- `"1 3"` → `1.3`
- `"13"` → `1.3` (first digit = whole, second = tenths)
- Single digit `"8"` where digit ≤ 8 → `0.8`

**Logbook format detection:**
- `solo_incl` entity found → `'typeB'`
- `PIC_hours_solo_incl` entity found (no `solo_incl`) → `'typeA'`
- Neither → `'simple'`

**Flight filter — only include rows where:**
1. Date is valid YYYY-MM-DD or `"YYYY-MM-00"`
2. Date year is 1990–present
3. `duration > 0`

#### Step 5 — State Update

`setAppState(prev => ({ ...prev, flightLogs: extractedLogs, flightLogPdfUrl: publicUrl, logbookFormat: logbookFormat }))`

Saved via `handlePersistChanges({ flightLogs, flightLogPdfUrl, logbookFormat }, { title: "AI Analysis Complete", description: "${extractedLogs.length} recent flight logs have been extracted and saved." })`

---

### Manual Entry / Edit Flow

#### Entering Edit Mode

- Button "Review & Edit" — visible only when: flights exist AND application is not submitted AND not already in review mode.
- Handler: `handleToggleReviewMode()`
- Effect: Opens an editable table view.

#### Editable Table Columns

| Column       | Input Type           | Notes                                     |
|--------------|----------------------|-------------------------------------------|
| Date         | `text`               | YYYY-MM-DD format expected                |
| Aircraft     | `text`               |                                           |
| Dual         | `number`, `step=0.1` | `dualReceived`                           |
| PIC          | `number`, `step=0.1` | `pilotInCommand`                         |
| Solo         | `number`, `step=0.1` | `solo` — only shown for `'typeA'` logbooks |
| Inst / Sim   | `number`, `step=0.1` | `instrumentSimulatedHours`               |
| Delete       | Button               | Trash icon, calls `handleRemoveEditableFlight(id)` |

**Auto-calculation:** When Dual, PIC, or Solo is changed, `duration` is recalculated as their sum.

#### Add Flight Row

- Button: "Add Flight Row" (dashed border)
- Handler: `handleAddEditableFlight()`
- New entry template:

```
{
  id: uuidv4(),
  date: today (YYYY-MM-DD),
  duration: 0,
  aircraft: 'Unknown',
  flightType: 'Unknown',
  dualReceived: 0,
  pilotInCommand: 0,
  solo: 0,
  instrumentSimulatedHours: 0
}
```

#### Save Changes

- Button: "Save Changes"
- Handler: `handleSaveReviewChanges()`
- Server action: `updateFlightLogsAction(appState.id, editableFlights, idToken)` (`src/app/actions.ts` line 162)

---

### Flight Log Display (Read-Only)

#### Summary Cards

| Card                       | Color  | Notes                                      |
|----------------------------|--------|--------------------------------------------|
| Total Hours                | —      | Sum of all `duration` values               |
| PIC Hours                  | Green  | Shows "Incl. Solo" note for `'typeB'`      |
| Solo Hours                 | Purple | Only shown for `'typeA'` logbooks          |
| Dual Hours                 | Blue   |                                            |
| Simulated Instrument Hours | Amber  |                                            |

#### Recency Check (`src/ai/flows/check-recency.ts`)

- Runs automatically via `useEffect` when `appState.flightLogs` changes.
- Logic: filters flights within last 6 months (`subMonths(new Date(), 6)`), sums `duration`.
- **Pass threshold:** total hours ≥ 15.

| State     | Display                                                                 |
|-----------|-------------------------------------------------------------------------|
| Checking  | Spinner: "AI is analyzing flight logs..."                               |
| Met       | Green box: "Recency Requirement Met — You have logged X hours in the last 6 months." |
| Not met   | Red box: "Recency Requirement Not Met — Your logged flights are outside the 6-month window." |

#### Flight Type Filter Buttons

`selectedFlightTypeFilter` state: `'All' | 'PIC' | 'Solo' | 'Dual' | 'Instrument'`

Buttons: All / PIC (or "PIC (Incl. Solo)" for typeB) / Solo (typeA only) / Dual / Instrument

#### Pagination

- Items per page: `ITEMS_PER_PAGE = 20`
- Controls: Previous / Next / page numbers
- Label: "Showing X–Y of Z flights"

---

## 4. Application Submission

**Source:** `src/app/(app)/applications/[id]/_components/ApplicationClient.tsx`

### Pre-Submission Conditions

The Submit button is **enabled** only when ALL of the following are true:

| Condition                        | Code reference                                         |
|----------------------------------|--------------------------------------------------------|
| Application status is `'draft'`  | `isSubmitted = appState.status !== 'draft'`           |
| All documents are not `'missing'`| `allDocsUploaded = appState.documents.every(doc => doc.status !== 'missing')` |
| No pending async operation       | `!isPending`                                           |

The Submit button is only **visible** when `status === 'draft'`.

### Submission Steps

#### Step 1 — Validation

- Verify `appState.status === 'draft'`
- Verify Firestore reference exists

#### Step 2 — Build Final State

| Field             | Value                                              |
|-------------------|----------------------------------------------------|
| `status`          | `'submitted'`                                     |
| `submittedAt`     | Firestore `serverTimestamp()`                     |
| `updatedAt`       | Firestore `serverTimestamp()`                     |
| `totalFlightHours`| Calculated sum from `flightLogs[].duration`       |

#### Step 3 — Firestore Update

`updateDoc(doc(firestore, 'applications', appState.id), finalState)`

#### Step 4 — Notification Created

Written to `users/{userId}/notifications`:

| Field       | Value                                                                 |
|-------------|-----------------------------------------------------------------------|
| `userId`    | `appState.userId`                                                    |
| `title`     | `'Application Submitted'`                                            |
| `body`      | `"Your '{licenseType}' application has been submitted for review."`  |
| `href`      | `/applications/{appState.id}`                                        |
| `isRead`    | `false`                                                              |
| `createdAt` | Firestore `serverTimestamp()`                                        |

#### Step 5 — User Feedback

- Toast: *"Application Submitted! — Your application has been submitted for review."*
- Local state updated: `setAppState(prev => ({...prev, ...finalState}))`

### Error Handling

| Error Type        | Behavior                                                         |
|-------------------|------------------------------------------------------------------|
| Permission error  | `FirestorePermissionError` emitted via `errorEmitter`; toast: "Submission failed — Could not submit your application." |
| Any error         | State rolled back to `initialApplication`                        |

### Post-Submission State

Once `status !== 'draft'`:
- Document upload buttons → disabled
- Flight log PDF upload → disabled
- Admin feedback field → visible (read-only to user)
- Flight logs → read-only view only

---

## 5. Admin Review Flow

**Source:** `src/app/(app)/admin/applications/[id]/_components/AdminApplicationClient.tsx`, `src/app/(app)/admin/applications/page.tsx`

### Role-Based Access

| Role           | Can view | Can change status | Can edit feedback |
|----------------|----------|-------------------|-------------------|
| `'reviewer'`   | Yes      | No                | No                |
| `'admin'`      | Yes      | Yes               | Yes               |
| `'head-admin'` | Yes      | Yes               | Yes               |

Check: `isAdminOrHigher = claims?.role === 'admin' || claims?.role === 'head-admin'`

### Application List Page (`/admin/applications`)

#### Search

- Text input, filters by `displayName` or `email` (case-insensitive).
- State: `setSearchTerm(e.target.value)`

#### Sections

| Section                 | Filter                        |
|-------------------------|-------------------------------|
| Submitted Applications  | `app.status !== 'draft'`      |
| Draft Applications      | `app.status === 'draft'`      |

Draft cards have an amber left border and a "DRAFT" badge overlay.

Each card shows: avatar, display name, email, total flight hours, last updated (relative), status badge. Click → `/admin/applications/{id}`.

---

### Admin Application Detail — Three Tabs

#### TAB 1: Overview

##### Draft Banner

- **Visible when:** `status === 'draft'`
- Color: Amber with warning triangle
- Text: *"This application is currently a DRAFT and has not been submitted for review."*

##### Hero Section

Displays: applicant avatar, name, email, created date, license type badge, status badge.

**Quick action buttons** (only visible when not draft):

| Button    | Action                                              |
|-----------|-----------------------------------------------------|
| "Reject"  | `setStatus('rejected')` then `handleSaveChanges()` |
| "Approve" | `setStatus('approved')` then `handleSaveChanges()` |

##### Status Selector

- Type: `<Select>` dropdown
- Label: "Current Status"
- **Disabled when:** application is draft OR role is not admin/head-admin

Available status values:

| Value              | Badge Color | Icon         |
|--------------------|-------------|--------------|
| `'draft'`          | Gray        | File         |
| `'submitted'`      | Blue        | Clock        |
| `'in_review'`      | Yellow      | Clock        |
| `'needs_attention'`| Orange      | Alert        |
| `'approved'`       | Green       | Check circle |
| `'rejected'`       | Red         | X circle     |

##### Internal Notes / Feedback Field

- Type: `<Textarea>`, `min-h-[120px]`, `resize-y`
- Placeholder: *"Add notes for other admins or feedback for the applicant..."*
- **Read-only when:** role is not admin/head-admin
- Handler: `onChange={(e) => setFeedback(e.target.value)}`

##### Save Handler: `handleSaveChanges()` (`AdminApplicationClient.tsx` line 311–347)

Firestore update payload:
```
{ status, feedback, updatedAt: serverTimestamp() }
```

**Notification triggered** (when status changed AND application not draft):

| Field       | Value                                                          |
|-------------|----------------------------------------------------------------|
| `title`     | `'Application Updated'`                                       |
| `body`      | `"Your '{licenseType}' application is now {status}."`        |
| `href`      | `/applications/{applicationId}`                              |
| `isRead`    | `false`                                                       |
| `createdAt` | Firestore `serverTimestamp()`                                |

**Email notifications triggered by status:**

| Status              | Email function called                                                    |
|---------------------|--------------------------------------------------------------------------|
| `'approved'`        | `sendApplicationApprovedEmail(email, displayName, dashboardUrl)`         |
| `'rejected'`        | `sendApplicationRejectedEmail(email, displayName, reason)` — reason from `feedback` field |
| `'needs_attention'` | `sendApplicationNeedsMoreInfoEmail(email, displayName, requiredInfo)` — from `feedback` field |

Toast: *"Changes Saved — Application status and feedback updated."*

##### Hour Requirements Checker

Progress bars for minimum flight hour requirements (hardcoded targets):

| Requirement           | Target   | Notes                              |
|-----------------------|----------|------------------------------------|
| Total Flight Time     | 150 hrs  |                                    |
| Pilot in Command      | 70 hrs   |                                    |
| Solo Flight           | 20 hrs   | Only shown for non-`'typeB'` logbooks |
| Dual Instruction      | 20 hrs   |                                    |

Progress bar color: green if met, gray if not. Label format: `"50.5 / 150 hrs"`.

##### AI Recency Verification (auto-runs on load)

| State        | Display                                                            |
|--------------|--------------------------------------------------------------------|
| Met          | Green "Verified" badge; *"Pilot meets the 6-month recency requirement."* |
| Not met      | Amber icon; *"Pilot does NOT meet…"*                              |
| No logs      | *"No flight logs available to check."*                            |

Sub-label: `"Total hours in last 6 months: X (Min required: 15)"`

---

#### TAB 2: Documents

**Header:** "Submitted Documents (X/Y)" — X = count where `status !== 'missing'`, Y = total count.

##### "Run AI Expiry Check" Button

- Handler: `handleCheckExpiry()` (`AdminApplicationClient.tsx` line 256–293)
- Calls `flagExpiringDocuments({ documents, daysUntilExpiry: 90 })`
- For each document: if `expiryDate` is within 90 days → set `status: 'needs_attention'` and `isExpiringSoon: true`
- Saves to Firestore
- Toast shows count of flagged documents

##### Document Review Cards (`DocumentReviewCard` component)

Layout: 2-column grid.

Each card shows:

| Element            | Detail                                               |
|--------------------|------------------------------------------------------|
| Name               | Document name (truncated)                            |
| Status badge       | Colored by current status value (see table below)   |
| Description        | 2-line max, truncated                                |
| File info          | Icon + filename + download button (if not missing)  |
| Expiry date        | Calendar icon + "Expiry: MMM d, yyyy" — orange background if `isExpiringSoon`, gray otherwise |
| Status dropdown    | Options: `'uploaded'`, `'needs_attention'`, `'approved'`, `'rejected'` |

Status badge colors:

| Status              | Color  |
|---------------------|--------|
| `'uploaded'`        | Indigo |
| `'approved'`        | Green  |
| `'rejected'`        | Red    |
| `'needs_attention'` | Orange |
| `'missing'`         | Red    |

**Status change handler:** `handleDocumentStatusChange(docId, newStatus)` (`AdminApplicationClient.tsx` line 295–309)
- Updates document in state
- Persists to Firestore
- Toast: *"Document Status Updated"*

---

#### TAB 3: Flight Logs

**Logbook Format Display:**

| Value      | Description shown to admin                                   |
|------------|--------------------------------------------------------------|
| `'typeA'`  | "Type A (Separate columns for PIC, Solo, Dual)"              |
| `'typeB'`  | "Type B (Combined PIC includes Solo, separate Dual)"         |
| `'simple'` | "Simple (Single duration column only)"                       |

**Flight Hours Summary:** "Total Time: XXX.Xh" in an emphasized box.

**Table columns:** Date (formatted `"MMM d, yyyy"`) / Aircraft / Type (badge) / Duration (right-aligned, monospace)

Flight type badge colors:

| Type    | Badge style |
|---------|-------------|
| PIC     | Blue (`"PIC"` or `"PIC (Incl. Solo)"` for typeB) |
| Solo    | Green       |
| Dual    | Orange      |
| Unknown | Gray        |

**Empty state:** *"No flight logs have been extracted or uploaded yet."*

---

#### Sidebar

**Activity Timeline** (reverse chronological):
1. "Application Updated" — `updatedAt` timestamp
2. "Application Submitted" — `submittedAt` timestamp (only if exists)
3. "Draft Created" — `createdAt` timestamp

**Quick Info Card:**
- License Type
- Total Docs (count)
- Flight Rows (count of `flightLogs`)

---

## 6. Reference: Status Values

### `ApplicationStatus` (`src/types/index.ts` line 38)

```
'draft' | 'submitted' | 'in_review' | 'needs_attention' | 'approved' | 'rejected'
```

### `DocumentStatus` (`src/types/index.ts` line 21)

```
'missing' | 'uploaded' | 'needs_attention' | 'approved' | 'rejected'
```

### `LogbookFormat`

```
'simple' | 'typeA' | 'typeB'
```

### Document Requirement IDs (by license)

| License | IDs used |
|---------|----------|
| All     | `photoId`, `licenseVerification`, `englishProficiency`, `photos`, `applicationForm` |
| PPL     | `pplLicense`, `logbookPPL`, `medicalCertClass2`, `airLawExam`, `rtLicense` |
| CPL     | `cplLicense`, `medicalCertClass1`, `instrumentRating`, `multiEngineRating`, `atplTheoryCPL` |
| ATPL    | `atplLicense`, `logbookATPL`, `medicalCertClass1`, `typeRating`, `simRecords`, `operatorExperience`, `advancedTheoryATPL` |
