
import type { User as FirebaseUser } from 'firebase/auth';

// A more specific type for Firestore Timestamps to avoid 'any'.
export type FirebaseTimestamp = {
  seconds: number;
  nanoseconds: number;
  toDate: () => Date;
};

export type UserProfile = {
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'user' | 'admin' | 'head-admin' | 'reviewer';
  createdAt: FirebaseTimestamp;
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
  filePath?: string;
  fileName?: string;
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
  remarks: string;
};

export type Application = {
  id: string;
  userId: string;
  licenseType: string;
  status: ApplicationStatus;
  documents: ApplicationDocument[];
  flightLogs?: FlightLog[];
  submittedAt?: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
  createdAt?: FirebaseTimestamp;
  feedback?: string;
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
