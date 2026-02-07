
import type { User as FirebaseUser } from 'firebase/auth';

export type UserProfile = {
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'applicant' | 'admin' | 'head-admin' | 'reviewer';
  createdAt: any; // Firestore server timestamp
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
  uploadedAt?: any;
  requiresExpiry: boolean;
  expiryDate?: string;
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
  submittedAt?: any;
  updatedAt: any;
  createdAt?: any;
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
  timestamp: any;
  details?: string;
};

    