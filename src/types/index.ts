
import type { User as FirebaseUser } from 'firebase/auth';

export type UserProfile = {
  email: string;
  displayName?: string;
  role: 'applicant' | 'admin';
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
  uploadedAt?: string;
  requiresExpiry: boolean;
  expiryDate?: string;
  isExpiringSoon?: boolean;
};

export type ApplicationStatus = 'draft' | 'submitted' | 'in_review' | 'needs_attention' | 'approved' | 'rejected';

export type Application = {
  id: string;
  userId: string;
  licenseType: string;
  status: ApplicationStatus;
  documents: ApplicationDocument[];
  submittedAt?: string;
  updatedAt: string;
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

// Remove the mock User type
// export type User = {
//   id: string;
//   name: string;
//   email: string;
//   role: 'applicant' | 'admin';
//   avatarUrl: string;
// };
