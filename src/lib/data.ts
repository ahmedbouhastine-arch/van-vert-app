
import type { User, LicenseType, Application } from '@/types';

// This file contains mock data. In a real application, this would come from a database.

export const documentRequirements = {
  photoId: { id: 'doc1', name: 'Photo ID', description: 'Government-issued photo ID (e.g., Passport, Driver\'s License)', requiresExpiry: true },
  pilotLicense: { id: 'doc2', name: 'Pilot License', description: 'Your current pilot license certificate', requiresExpiry: true },
  medicalCert: { id: 'doc3', name: 'Medical Certificate', description: 'Valid aviation medical certificate', requiresExpiry: true },
  logbook: { id: 'doc4', name: 'Logbook Summary', description: 'Last 5 pages of your pilot logbook', requiresExpiry: false },
  englishProficiency: { id: 'doc5', name: 'English Proficiency', description: 'English language proficiency test results (Level 4 or higher)', requiresExpiry: true },
};

export const licenseTypes: LicenseType[] = [
  {
    id: 'atpl',
    name: 'ATPL Conversion',
    description: 'Convert your foreign Airline Transport Pilot License.',
    documentRequirements: [
      documentRequirements.photoId,
      documentRequirements.pilotLicense,
      documentRequirements.medicalCert,
      documentRequirements.logbook,
      documentRequirements.englishProficiency,
    ],
  },
  {
    id: 'cpl',
    name: 'CPL Conversion',
    description: 'Convert your foreign Commercial Pilot License.',
    documentRequirements: [
      documentRequirements.photoId,
      documentRequirements.pilotLicense,
      documentRequirements.medicalCert,
      documentRequirements.logbook,
    ],
  },
  {
    id: 'ppl',
    name: 'PPL Validation',
    description: 'Validate your foreign Private Pilot License for local use.',
    documentRequirements: [
      documentRequirements.photoId,
      documentRequirements.pilotLicense,
      documentRequirements.medicalCert,
    ],
  },
];

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const nextMonth = new Date();
nextMonth.setMonth(nextMonth.getMonth() + 1);
const nextYear = new Date();
nextYear.setFullYear(nextYear.getFullYear() + 1);

export const applications: Application[] = [
  {
    id: 'app1',
    userId: 'user1',
    licenseType: 'ATPL Conversion',
    status: 'draft',
    submittedAt: undefined,
    updatedAt: new Date().toISOString(),
    feedback: "Please double-check the expiry date on your medical certificate.",
    documents: [
      { id: 'appdoc1', docRequirementId: 'doc1', name: 'Photo ID', description: 'Government-issued photo ID (e.g., Passport, Driver\'s License)', status: 'uploaded', requiresExpiry: true, fileName: 'passport.pdf', uploadedAt: new Date().toISOString(), expiryDate: nextYear.toISOString().split('T')[0] },
      { id: 'appdoc2', docRequirementId: 'doc2', name: 'Pilot License', description: 'Your current pilot license certificate', status: 'missing', requiresExpiry: true },
      { id: 'appdoc3', docRequirementId: 'doc3', name: 'Medical Certificate', description: 'Valid aviation medical certificate', status: 'needs_attention', requiresExpiry: true, fileName: 'medical.jpg', uploadedAt: new Date().toISOString(), expiryDate: tomorrow.toISOString().split('T')[0] },
      { id: 'appdoc4', docRequirementId: 'doc4', name: 'Logbook Summary', description: 'Last 5 pages of your pilot logbook', status: 'missing', requiresExpiry: false },
      { id: 'appdoc5', docRequirementId: 'doc5', name: 'English Proficiency', description: 'English language proficiency test results (Level 4 or higher)', status: 'uploaded', requiresExpiry: true, fileName: 'ielts.pdf', uploadedAt: new Date().toISOString(), expiryDate: nextMonth.toISOString().split('T')[0] },
    ],
  },
    {
    id: 'app2',
    userId: 'user1',
    licenseType: 'PPL Validation',
    status: 'submitted',
    submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    documents: [
      { id: 'appdoc6', docRequirementId: 'doc1', name: 'Photo ID', description: 'Government-issued photo ID', status: 'approved', requiresExpiry: true },
      { id: 'appdoc7', docRequirementId: 'doc2', name: 'Pilot License', description: 'Your current pilot license', status: 'approved', requiresExpiry: true },
      { id: 'appdoc8', docRequirementId: 'doc3', name: 'Medical Certificate', description: 'Valid aviation medical certificate', status: 'approved', requiresExpiry: true },
    ],
  },
];
