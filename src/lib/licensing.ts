
import type { LicenseType, DocumentRequirement } from '@/types';
export type { LicenseType } from '@/types';

// This file contains the definitions for document requirements and license types.

export const documentRequirements: Record<string, DocumentRequirement> = {
    // Common
    photoId: { id: 'doc1', name: 'Passport or National ID', description: 'A clear, valid copy of your passport or national ID.', requiresExpiry: true },
    applicationForm: { id: 'doc2', name: 'Application Form & Payment Receipt', description: 'Completed application form and proof of payment.', requiresExpiry: false },
    photos: { id: 'doc3', name: 'Passport-Style Photos', description: 'Two recent, identical passport-style photographs.', requiresExpiry: false },
    licenseVerification: { id: 'doc4', name: 'License Verification Letter', description: 'An official verification letter from the license-issuing authority.', requiresExpiry: false },
    englishProficiency: { id: 'doc5', name: 'English Proficiency Certificate', description: 'Proof of English proficiency, ICAO Level 4 or higher.', requiresExpiry: true },
    
    // PPL
    pplLicense: { id: 'doc6', name: 'Existing PPL License', description: 'A copy of your current Private Pilot License.', requiresExpiry: true },
    logbookPPL: { id: 'doc7', name: 'Pilot Logbook', description: 'Copies showing total hours and recent flights.', requiresExpiry: false },
    medicalCertClass2: { id: 'doc8', name: 'Class 2 Medical Certificate', description: 'A valid Class 2 or higher medical certificate.', requiresExpiry: true },
    airLawExam: { id: 'doc9', name: 'Air Law or Local Regulation Exam Proof', description: 'Proof of passing the local air law or regulations exam.', requiresExpiry: false },
    rtLicense: { id: 'doc10', name: 'Radio Telephony (RT) License', description: 'Your current Radio Telephony license or certificate, if applicable.', requiresExpiry: true },
    
    // CPL
    cplLicense: { id: 'doc11', name: 'Existing CPL License', description: 'A copy of your current Commercial Pilot License.', requiresExpiry: true },
    medicalCertClass1: { id: 'doc13', name: 'Class 1 Medical Certificate', description: 'A valid Class 1 medical certificate.', requiresExpiry: true },
    instrumentRating: { id: 'doc14', name: 'Instrument Rating Certificate', description: 'Your current Instrument Rating certificate, if held.', requiresExpiry: true },
    multiEngineRating: { id: 'doc15', name: 'Multi-Engine Rating Certificate', description: 'Your current Multi-Engine rating certificate, if held.', requiresExpiry: true },
    atplTheoryCPL: { id: 'doc16', name: 'ATPL Theory Credits or Conversion Exam Results', description: 'Exam results for ATPL theory credits or conversion exams.', requiresExpiry: false },
  
    // ATPL
    atplLicense: { id: 'doc17', name: 'Existing ATPL or "Frozen" ATPL License', description: 'A copy of your current ATPL or "Frozen" ATPL.', requiresExpiry: true },
    logbookATPL: { id: 'doc18', name: 'Complete Flight Time Breakdown', description: 'A complete, certified breakdown of your flight time (e.g., from your airline).', requiresExpiry: false },
    typeRating: { id: 'doc19', name: 'Type Rating Certificates', description: 'Copies of all current type rating certificates.', requiresExpiry: true },
    simRecords: { id: 'doc20', name: 'Simulator Proficiency or Recurrent Training Records', description: 'Recent simulator proficiency or recurrent training records.', requiresExpiry: false },
    operatorExperience: { id: 'doc21', name: 'Operator Experience Letters', description: 'Letters of employment or records from previous operators.', requiresExpiry: false },
    advancedTheoryATPL: { id: 'doc22', name: 'Advanced Theory Conversion Exam Results', description: 'Results from any required advanced theory conversion exams.', requiresExpiry: false },
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
        documentRequirements.medicalCertClass1,
        documentRequirements.instrumentRating,
        documentRequirements.multiEngineRating,
        documentRequirements.atplTheoryCPL,
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
        documentRequirements.advancedTheoryATPL,
        documentRequirements.englishProficiency,
        documentRequirements.photos,
        documentRequirements.applicationForm,
    ],
  },
];
