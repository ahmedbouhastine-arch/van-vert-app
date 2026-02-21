import { Timestamp } from 'firebase/firestore';

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
  flightHourRequirements?: FlightHourRequirement[];
};

export type FlightHourRequirement = {
  type: 'total' | 'pic' | 'solo' | 'instrument' | 'night';
  hours: number;
};

export type UserProfile = {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  claims?: Record<string, any>;
};

export type ApplicationStatus = 
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'needs_attention'
  | 'approved'
  | 'rejected';

export type DocumentStatus = 
  | 'missing'
  | 'uploaded'
  | 'needs_attention'
  | 'approved'
  | 'rejected';

export type FirebaseTimestamp = Timestamp;

export type ApplicationDocument = {
  id: string;
  docRequirementId: string;
  name: string;
  description: string;
  status: DocumentStatus;
  requiresExpiry: boolean;
  fileUrl: string;
  fileName: string;
  fileType: string;
  uploadedAt: string | FirebaseTimestamp;
  expiryDate?: string | null;
  isExpiringSoon?: boolean;
};

export type LogbookFormat = 'standard' | 'combined' | 'simple';

export type Application = {
  id: string;
  userId: string;
  licenseType: string;
  status: ApplicationStatus;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
  feedback: string;
  documents: ApplicationDocument[];
  flightLogs: FlightLog[];
  flightLogPdfUrl: string;
  logbookFormat?: LogbookFormat;
};

export type FlightLog = {
  id: string;
  date: string;
  aircraft: string;
  duration: number;
  // No longer extracting these
  // isPIC: boolean;
  // isSolo: boolean;
  // remarks: string;
};