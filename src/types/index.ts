
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
};

export type Application = {
  id: string;
  userId: string;
  licenseType: string;
  status: ApplicationStatus;
  documents: ApplicationDocument[];
  flightLogs: FlightLog[];
  flightLogPdfUrl?: string;
  logbookFormat?: 'standard' | 'combined' | 'simple'; // New field to infer AI interpretation
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

export type Notification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  href?: string;
  isRead: boolean;
  createdAt: FirebaseTimestamp;
};
