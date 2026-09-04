
import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

// A more specific type for Firestore Timestamps to avoid 'any'.
export type FirebaseTimestamp = Timestamp;

export type UserProfile = {
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'user' | 'reviewer' | 'admin' | 'head-admin';
  createdAt: FirebaseTimestamp;
  birthDate?: string; // YYYY-MM-DD
  country?: string;
  notificationPrefs?: {
    applicationUpdates: boolean;
    promotional: boolean;
  };
};

export type AppUser = FirebaseUser & {
  profile: UserProfile;
};

export type DocumentStatus = 'missing' | 'uploaded' | 'needs_attention' | 'approved' | 'rejected';

export type ApplicationDocument = {
  id: string;
  docRequirementId: string;
  name: string;
  description: string;
  status: DocumentStatus;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  uploadedAt?: string; // ISO Date string
  requiresExpiry: boolean;
  expiryDate?: string; // YYYY-MM-DD
  isExpiringSoon?: boolean;
};

export type ApplicationStatus = 'draft' | 'submitted' | 'in_review' | 'needs_attention' | 'approved' | 'rejected';

export type FlightLog = {
  id: string;
  date: string; // YYYY-MM-DD
  duration: number; // in hours
  aircraft: string;
  flightType: 'PIC' | 'Solo' | 'Dual' | 'Unknown';
  dualReceived?: number; // in hours
  pilotInCommand?: number; // in hours
  solo?: number; // in hours
  instrumentHours?: number; // flight simulator device time
  simInstrumentHours?: number; // hood/foggers instrument time
  needsReview?: boolean;
  flaggedFields?: string[]; // e.g. ['aircraft', 'dual_hours'] - which fields failed the sanity check
};

// SI = PIC includes Solo, S = Solo tracked separately. HM = hours:minutes, DEC = decimal.
export type LogbookFormat = 'SI-HM' | 'SI-DEC' | 'S-HM' | 'S-DEC';

export type Application = {
  id: string;
  userId: string;
  licenseType: string;
  status: ApplicationStatus;
  documents: ApplicationDocument[];
  flightLogs: FlightLog[];
  flightLogPdfUrl?: string;
  logbookFormat?: LogbookFormat; // Updated type
  submittedAt?: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
  createdAt?: FirebaseTimestamp;
  feedback?: string;
  totalFlightHours?: number;
};

export type DocumentRequirement = {
  id: string;
  name: string;
  description: string;
  requiresExpiry: boolean;
};

export type LicenseType = {
  id: string;
  name: string;
  description: string;
  documentRequirements: DocumentRequirement[];
};

export type AnalyticsDataPoint = {
  date: string;
  submitted: number;
  approved: number;
  rejected: number;
};

export type AuditLogEntry = {
  id: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  action: string;
  timestamp: FirebaseTimestamp;
  details?: string;
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  href?: string;
  isRead: boolean;
  createdAt: FirebaseTimestamp;
};

// --- Conversion Pipeline (Students / Sub-tasks) ---
// Tracks license conversion training candidates ("cadets") through a pipeline
// distinct from the DGCA conversion `Application` above. Covers all
// conversion types (CPL, ATPL, PPL, ...), not just CPL.

// TODO: confirm final list with management — CPL and ATPL are confirmed,
// PPL is a likely third but unconfirmed. One-line change either way.
export type ConversionType = 'CPL' | 'ATPL' | 'PPL';

export type PriorityLevel = 'high' | 'medium' | 'low';

export type ConversionStatus =
  | 'pipeline'
  | 'onboarded'
  | 'waiting_for_docs'
  | 'ready_to_fly'
  | 'flying'
  | 'license_application'
  | 'done';

export type TaskStatus = 'not_started' | 'in_progress' | 'completed';

// One row of the "recommended hours still needed" table on the student
// detail panel — free-form requirement labels rather than a fixed set of
// categories, since required hours vary by conversion type and pathway.
export type HoursRequirement = {
  id: string;
  label: string; // e.g. "Dual cross-country"
  hoursNeeded: number;
};

export type Student = {
  id: string;
  cadetName: string;
  conversionType: ConversionType; // required, no default — chosen explicitly at creation
  description?: string;
  googleDriveUrl?: string;
  recencyDate?: string; // YYYY-MM-DD
  priorityLevel: PriorityLevel;
  conversionStatus: ConversionStatus;
  onboardingDate?: string; // YYYY-MM-DD
  email?: string;
  phone?: string;
  source?: string;
  soldByUserId?: string; // matched Van-Vert user id, when resolvable
  soldByName?: string; // fallback display name otherwise
  notes?: string;
  linkedApplicationId?: string; // optional link to an existing DGCA Application
  hoursNeeded?: HoursRequirement[]; // recommended remaining flight hours by category
  // Denormalized subtask progress, kept in sync by the client whenever a
  // subtask is created/toggled/deleted — avoids an N-listener fan-out to
  // show "4 / 7 done" in the table/kanban without opening each student.
  subtaskCompletedCount?: number;
  subtaskTotalCount?: number;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
};

export type SubTask = {
  id: string;
  taskName: string;
  taskStatus: TaskStatus;
  date?: string; // YYYY-MM-DD
  completed: boolean; // kept in sync with taskStatus === 'completed'
  ownerUserId?: string;
  ownerName?: string;
  notes?: string;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
};
