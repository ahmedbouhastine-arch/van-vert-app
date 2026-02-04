
import type { UserProfile, LicenseType, Application, AnalyticsDataPoint, AuditLogEntry } from '@/types';

// This file contains mock data. In a real application, this would come from a database.

export const documentRequirements = {
    // Common
    photoId: { id: 'doc1', name: 'Passport or National ID', description: 'A clear, valid copy of your passport or national ID.', requiresExpiry: true },
    applicationForm: { id: 'doc2', name: 'Application Form & Payment', description: 'Completed application form and proof of payment.', requiresExpiry: false },
    photos: { id: 'doc3', name: 'Passport-Style Photos', description: 'Two recent, identical passport-style photographs.', requiresExpiry: false },
    licenseVerification: { id: 'doc4', name: 'License Verification Letter', description: 'An official verification letter from the license-issuing authority.', requiresExpiry: false },
    englishProficiency: { id: 'doc5', name: 'English Proficiency Certificate', description: 'Proof of English proficiency, ICAO Level 4 or higher.', requiresExpiry: true },
    
    // PPL
    pplLicense: { id: 'doc6', name: 'Existing PPL License', description: 'A copy of your current Private Pilot License.', requiresExpiry: true },
    logbookPPL: { id: 'doc7', name: 'Pilot Logbook', description: 'Copies showing total hours and recent flights.', requiresExpiry: false },
    medicalCertClass2: { id: 'doc8', name: 'Class 2 Medical Certificate', description: 'A valid Class 2 or higher medical certificate.', requiresExpiry: true },
    airLawExam: { id: 'doc9', name: 'Air Law Exam Proof', description: 'Proof of passing the local air law or regulations exam.', requiresExpiry: false },
    rtLicense: { id: 'doc10', name: 'Radio Telephony (RT) License', description: 'Your current Radio Telephony license or certificate, if applicable.', requiresExpiry: true },
    
    // CPL
    cplLicense: { id: 'doc11', name: 'Existing CPL License', description: 'A copy of your current Commercial Pilot License.', requiresExpiry: true },
    logbookCPL: { id: 'doc12', name: 'Detailed Logbook Summary', description: 'Logbook copies showing PIC, cross-country, night, and instrument hours.', requiresExpiry: false },
    medicalCertClass1: { id: 'doc13', name: 'Class 1 Medical Certificate', description: 'A valid Class 1 medical certificate.', requiresExpiry: true },
    instrumentRating: { id: 'doc14', name: 'Instrument Rating Certificate', description: 'Your current Instrument Rating certificate, if held.', requiresExpiry: true },
    multiEngineRating: { id: 'doc15', name: 'Multi-Engine Rating Certificate', description: 'Your current Multi-Engine rating certificate, if held.', requiresExpiry: true },
    atplTheory: { id: 'doc16', name: 'ATPL Theory Credits', description: 'Exam results for ATPL theory credits or conversion exams.', requiresExpiry: false },
  
    // ATPL
    atplLicense: { id: 'doc17', name: 'Existing ATPL License', description: 'A copy of your current ATPL or "Frozen" ATPL.', requiresExpiry: true },
    logbookATPL: { id: 'doc18', name: 'Flight Time Breakdown', description: 'A complete, certified breakdown of your flight time (e.g., from your airline).', requiresExpiry: false },
    typeRating: { id: 'doc19', name: 'Type Rating Certificates', description: 'Copies of all current type rating certificates.', requiresExpiry: true },
    simRecords: { id: 'doc20', name: 'Simulator Training Records', description: 'Recent simulator proficiency or recurrent training records.', requiresExpiry: false },
    operatorExperience: { id: 'doc21', name: 'Operator Experience Letters', description: 'Letters of employment or records from previous operators.', requiresExpiry: false },
    advancedTheory: { id: 'doc22', name: 'Advanced Theory Exam Results', description: 'Results from any required advanced theory conversion exams.', requiresExpiry: false },
  };

export const licenseTypes: LicenseType[] = [
  {
    id: 'ppl',
    name: 'PPL Conversion',
    description: 'Convert your foreign Private Pilot License.',
    documentRequirements: [
        documentRequirements.photoId,
        documentRequirements.pplLicense,
        documentRequirements.licenseVerification,
        documentRequirements.logbookPPL,
        documentRequirements.medicalCertClass2,
        documentRequirements.englishProficiency,
        documentRequirements.photos,
        documentRequirements.airLawExam,
        documentRequirements.rtLicense,
        documentRequirements.applicationForm,
    ],
  },
  {
    id: 'cpl',
    name: 'CPL Conversion',
    description: 'Convert your foreign Commercial Pilot License.',
    documentRequirements: [
        documentRequirements.photoId,
        documentRequirements.cplLicense,
        documentRequirements.licenseVerification,
        documentRequirements.logbookCPL,
        documentRequirements.medicalCertClass1,
        documentRequirements.instrumentRating,
        documentRequirements.multiEngineRating,
        documentRequirements.atplTheory,
        documentRequirements.englishProficiency,
        documentRequirements.photos,
        documentRequirements.applicationForm,
    ],
  },
  {
    id: 'atpl',
    name: 'ATPL Conversion',
    description: 'Convert your foreign Airline Transport Pilot License.',
    documentRequirements: [
        documentRequirements.photoId,
        documentRequirements.atplLicense,
        documentRequirements.licenseVerification,
        documentRequirements.logbookATPL,
        documentRequirements.medicalCertClass1,
        documentRequirements.typeRating,
        documentRequirements.simRecords,
        documentRequirements.operatorExperience,
        documentRequirements.advancedTheory,
        documentRequirements.englishProficiency,
        documentRequirements.photos,
        documentRequirements.applicationForm,
    ],
  },
];

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
      { id: 'appdoc1', docRequirementId: 'doc1', name: 'Passport or National ID', description: 'A clear, valid copy of your passport or national ID.', status: 'uploaded', requiresExpiry: true, fileName: 'passport.pdf', uploadedAt: new Date().toISOString(), expiryDate: nextYear.toISOString().split('T')[0] },
      { id: 'appdoc2', docRequirementId: 'doc17', name: 'Existing ATPL License', description: 'A copy of your current ATPL or "Frozen" ATPL.', status: 'missing', requiresExpiry: true },
      { id: 'appdoc3', docRequirementId: 'doc4', name: 'License Verification Letter', description: 'An official verification letter from the license-issuing authority.', status: 'missing', requiresExpiry: false },
      { id: 'appdoc4', docRequirementId: 'doc18', name: 'Flight Time Breakdown', description: 'A complete, certified breakdown of your flight time (e.g., from your airline).', status: 'missing', requiresExpiry: false },
      { id: 'appdoc5', docRequirementId: 'doc13', name: 'Class 1 Medical Certificate', description: 'A valid Class 1 medical certificate.', status: 'uploaded', requiresExpiry: true, fileName: 'medical.pdf', uploadedAt: new Date().toISOString(), expiryDate: nextYear.toISOString().split('T')[0] },
      { id: 'appdoc6', docRequirementId: 'doc19', name: 'Type Rating Certificates', description: 'Copies of all current type rating certificates.', status: 'missing', requiresExpiry: true },
      { id: 'appdoc7', docRequirementId: 'doc20', name: 'Simulator Training Records', description: 'Recent simulator proficiency or recurrent training records.', status: 'missing', requiresExpiry: false },
      { id: 'appdoc8', docRequirementId: 'doc21', name: 'Operator Experience Letters', description: 'Letters of employment or records from previous operators.', status: 'missing', requiresExpiry: false },
      { id: 'appdoc9', docRequirementId: 'doc22', name: 'Advanced Theory Exam Results', description: 'Results from any required advanced theory conversion exams.', status: 'missing', requiresExpiry: false },
      { id: 'appdoc10', docRequirementId: 'doc5', name: 'English Proficiency Certificate', description: 'Proof of English proficiency, ICAO Level 4 or higher.', status: 'uploaded', requiresExpiry: true, fileName: 'english_test.pdf', uploadedAt: new Date().toISOString(), expiryDate: nextYear.toISOString().split('T')[0] },
      { id: 'appdoc11', docRequirementId: 'doc3', name: 'Passport-Style Photos', description: 'Two recent, identical passport-style photographs.', status: 'missing', requiresExpiry: false },
      { id: 'appdoc12', docRequirementId: 'doc2', name: 'Application Form & Payment', description: 'Completed application form and proof of payment.', status: 'missing', requiresExpiry: false },
    ],
  },
];

export const mockUsers: (UserProfile & { id: string, photoURL?: string })[] = [];

export const analyticsData: AnalyticsDataPoint[] = [
    { date: 'Jan 24', submitted: 15, approved: 10, rejected: 2 },
    { date: 'Feb 24', submitted: 20, approved: 15, rejected: 3 },
    { date: 'Mar 24', submitted: 25, approved: 20, rejected: 4 },
    { date: 'Apr 24', submitted: 30, approved: 22, rejected: 5 },
    { date: 'May 24', submitted: 28, approved: 25, rejected: 1 },
    { date: 'Jun 24', submitted: 35, approved: 30, rejected: 3 },
];

export const auditLogs: AuditLogEntry[] = [
    {
        id: 'log1',
        adminId: 'admin_user_id_1',
        adminName: 'Alice Admin',
        adminEmail: 'alice.admin@example.com',
        action: 'Approved Application',
        details: 'Application #app4 for CPL Conversion',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'log2',
        adminId: 'head_admin_user_id',
        adminName: 'admin test',
        adminEmail: 'admin.test@example.com',
        action: 'Updated User Role',
        details: 'Changed role of Jane Aviation to Admin',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'log3',
        adminId: 'admin_user_id_1',
        adminName: 'Alice Admin',
        adminEmail: 'alice.admin@example.com',
        action: 'Rejected Application',
        details: 'Application #app5 for ATPL Conversion',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
     {
        id: 'log4',
        adminId: 'head_admin_user_id',
        adminName: 'admin test',
        adminEmail: 'admin.test@example.com',
        action: 'Viewed Audit Log',
        details: '',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
];
