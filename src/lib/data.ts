
import type { UserProfile, LicenseType, Application } from '@/types';

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
      { id: 'appdoc6', docRequirementId: 'doc1', name: 'Photo ID', description: 'Government-issued photo ID', status: 'uploaded', requiresExpiry: true, fileName: 'id.pdf', uploadedAt: new Date().toISOString(), expiryDate: nextYear.toISOString().split('T')[0] },
      { id: 'appdoc7', docRequirementId: 'doc2', name: 'Pilot License', description: 'Your current pilot license', status: 'uploaded', requiresExpiry: true, fileName: 'license.pdf', uploadedAt: new Date().toISOString(), expiryDate: nextYear.toISOString().split('T')[0] },
      { id: 'appdoc8', docRequirementId: 'doc3', name: 'Medical Certificate', description: 'Valid aviation medical certificate', status: 'uploaded', requiresExpiry: true, fileName: 'medical.pdf', uploadedAt: new Date().toISOString(), expiryDate: nextYear.toISOString().split('T')[0] },
    ],
  },
  {
    id: 'app3',
    userId: 'user2', // A different user
    licenseType: 'CPL Conversion',
    status: 'in_review',
    submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    documents: [
      { id: 'appdoc9', docRequirementId: 'doc1', name: 'Photo ID', description: 'Government-issued photo ID', status: 'uploaded', requiresExpiry: true, fileName: 'id.pdf', uploadedAt: new Date().toISOString(), expiryDate: nextYear.toISOString().split('T')[0] },
      { id: 'appdoc10', docRequirementId: 'doc2', name: 'Pilot License', description: 'Your current pilot license', status: 'uploaded', requiresExpiry: true, fileName: 'license.pdf', uploadedAt: new Date().toISOString(), expiryDate: nextYear.toISOString().split('T')[0] },
      { id: 'appdoc11', docRequirementId: 'doc3', name: 'Medical Certificate', description: 'Valid aviation medical certificate', status: 'uploaded', requiresExpiry: true, fileName: 'med_cert.pdf', uploadedAt: new Date().toISOString(), expiryDate: nextMonth.toISOString().split('T')[0] },
      { id: 'appdoc12', docRequirementId: 'doc4', name: 'Logbook Summary', description: 'Last 5 pages of your pilot logbook', status: 'uploaded', requiresExpiry: false, fileName: 'logbook.pdf', uploadedAt: new Date().toISOString() },
    ],
  },
  {
    id: 'app4',
    userId: 'user1',
    licenseType: 'CPL Conversion',
    status: 'approved',
    submittedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    documents: [
        { id: 'appdoc13', docRequirementId: 'doc1', name: 'Photo ID', description: 'Government-issued photo ID', status: 'approved', requiresExpiry: true, fileName: 'id.pdf', uploadedAt: new Date().toISOString(), expiryDate: nextYear.toISOString().split('T')[0] },
        { id: 'appdoc14', docRequirementId: 'doc2', name: 'Pilot License', description: 'Your current pilot license', status: 'approved', requiresExpiry: true, fileName: 'license.pdf', uploadedAt: new Date().toISOString(), expiryDate: nextYear.toISOString().split('T')[0] },
        { id: 'appdoc15', docRequirementId: 'doc3', name: 'Medical Certificate', description: 'Valid aviation medical certificate', status: 'approved', requiresExpiry: true, fileName: 'med_cert.pdf', uploadedAt: new Date().toISOString(), expiryDate: nextMonth.toISOString().split('T')[0] },
        { id: 'appdoc16', docRequirementId: 'doc4', name: 'Logbook Summary', description: 'Last 5 pages of your pilot logbook', status: 'approved', requiresExpiry: false, fileName: 'logbook.pdf', uploadedAt: new Date().toISOString() },
    ],
  },
  {
    id: 'app5',
    userId: 'user2',
    licenseType: 'ATPL Conversion',
    status: 'rejected',
    submittedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    feedback: "The provided pilot license appears to be from an un-recognized authority. Please provide a valid ICAO-compliant license.",
    documents: [
      { id: 'appdoc17', docRequirementId: 'doc1', name: 'Photo ID', status: 'approved', requiresExpiry: true, description: 'Government-issued photo ID', fileName: 'id.pdf', uploadedAt: new Date().toISOString(), expiryDate: nextYear.toISOString().split('T')[0] },
      { id: 'appdoc18', docRequirementId: 'doc2', name: 'Pilot License', status: 'rejected', requiresExpiry: true, description: 'Your current pilot license certificate', fileName: 'license_invalid.pdf', uploadedAt: new Date().toISOString(), expiryDate: nextYear.toISOString().split('T')[0] },
      { id: 'appdoc19', docRequirementId: 'doc3', name: 'Medical Certificate', status: 'approved', requiresExpiry: true, description: 'Valid aviation medical certificate', fileName: 'med_cert.pdf', uploadedAt: new Date().toISOString(), expiryDate: nextMonth.toISOString().split('T')[0] },
      { id: 'appdoc20', docRequirementId: 'doc4', name: 'Logbook Summary', status: 'approved', requiresExpiry: false, description: 'Last 5 pages of your pilot logbook', fileName: 'logbook.pdf', uploadedAt: new Date().toISOString() },
      { id: 'appdoc21', docRequirementId: 'doc5', name: 'English Proficiency', status: 'approved', requiresExpiry: true, description: 'English language proficiency test results', fileName: 'english.pdf', uploadedAt: new Date().toISOString(), expiryDate: nextYear.toISOString().split('T')[0] },
    ],
  },
  {
    id: 'app6',
    userId: 'user1',
    licenseType: 'PPL Validation',
    status: 'needs_attention',
    submittedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    feedback: "Your Photo ID is expiring in less than 30 days. Please upload a renewed ID.",
    documents: [
      { id: 'appdoc22', docRequirementId: 'doc1', name: 'Photo ID', description: 'Government-issued photo ID', status: 'needs_attention', requiresExpiry: true, fileName: 'passport_expiring.pdf', uploadedAt: new Date().toISOString(), expiryDate: tomorrow.toISOString().split('T')[0] },
      { id: 'appdoc23', docRequirementId: 'doc2', name: 'Pilot License', description: 'Your current pilot license', status: 'uploaded', requiresExpiry: true, fileName: 'license.pdf', uploadedAt: new Date().toISOString(), expiryDate: nextYear.toISOString().split('T')[0] },
      { id: 'appdoc24', docRequirementId: 'doc3', name: 'Medical Certificate', description: 'Valid aviation medical certificate', status: 'uploaded', requiresExpiry: true, fileName: 'medical.pdf', uploadedAt: new Date().toISOString(), expiryDate: nextYear.toISOString().split('T')[0] },
    ],
  }
];

export const mockUsers: (UserProfile & { id: string, photoURL?: string })[] = [
    {
        id: 'user1',
        displayName: 'John Pilot',
        email: 'john.pilot@example.com',
        role: 'applicant',
        createdAt: '2023-10-01T10:00:00Z',
        photoURL: `https://picsum.photos/seed/user1/100/100`,
    },
    {
        id: 'user2',
        displayName: 'Jane Aviation',
        email: 'jane.aviation@example.com',
        role: 'applicant',
        createdAt: '2023-11-15T14:30:00Z',
        photoURL: `https://picsum.photos/seed/user2/100/100`,
    }
];
