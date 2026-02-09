
import type { Application, UserProfile, DocumentRequirement, ApplicationDocument, DocumentStatus } from "@/types";
import { licenseTypes } from "@/lib/licensing";

export const mockUsers: Record<string, UserProfile & { id: string }> = {
    'user1': { id: 'user1', displayName: 'Amelia Pilot', email: 'amelia.pilot@example.com', photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', role: 'user', createdAt: { seconds: 0, nanoseconds: 0, toDate: () => new Date() } },
    'user2': { id: 'user2', displayName: 'John Flyer', email: 'john.flyer@example.com', photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', role: 'user', createdAt: { seconds: 0, nanoseconds: 0, toDate: () => new Date() } },
    'user3': { id: 'user3', displayName: 'Chuck Yeager', email: 'chuck.yeager@example.com', photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', role: 'user', createdAt: { seconds: 0, nanoseconds: 0, toDate: () => new Date() } },
};

// A helper to generate realistic dates
const pastDate = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const futureDate = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const getDocsForLicense = (licenseId: 'ppl' | 'cpl' | 'atpl', userId: string): ApplicationDocument[] => {
    const license = licenseTypes.find(l => l.id === licenseId);
    if (!license) return [];

    const user = mockUsers[userId];
    const userName = user ? user.displayName?.toLowerCase().replace(' ', '_') : 'user';

    return license.documentRequirements.map((req: DocumentRequirement, index: number) => {
        // Make some documents missing for more realistic scenarios
        if (licenseId === 'ppl' && (req.id === 'doc9' || req.id === 'doc10')) { // Air Law Exam & RT License
             return {
                id: req.id,
                docRequirementId: req.id,
                name: req.name,
                description: req.description,
                status: 'missing',
                requiresExpiry: req.requiresExpiry,
             };
        }
        if (licenseId === 'cpl' && req.id === 'doc15') { // Multi-Engine, let's say this user doesn't have it.
             return {
                id: req.id,
                docRequirementId: req.id,
                name: req.name,
                description: req.description,
                status: 'missing',
                requiresExpiry: req.requiresExpiry,
             };
        }

        let status: DocumentStatus = 'approved';
        let expiry: string | undefined;
        let isExpiringSoon = false;

        // Make medical certs expiring soon
        if (req.requiresExpiry && (req.id === 'doc8' || req.id === 'doc13')) { 
            expiry = futureDate(80).toISOString().split('T')[0]; // Expiring soon
            status = 'needs_attention';
            isExpiringSoon = true;
        } else if (req.requiresExpiry) {
            expiry = futureDate(400).toISOString().split('T')[0]; // Not expiring soon
        }
        
        if(index % 4 === 0) status = 'uploaded';
        if (req.id === 'doc4') status = 'needs_attention'; // License verification often needs checking

        return {
            id: req.id,
            docRequirementId: req.id,
            name: req.name,
            description: req.description,
            status: status,
            requiresExpiry: req.requiresExpiry,
            fileName: `${userName}_${req.name.toLowerCase().replace(/ /g, '_').replace(/&/g, 'and')}.pdf`,
            uploadedAt: pastDate(index * 5 + 10).toISOString(),
            storagePath: `mock/${userId}/${req.id}.pdf`,
            expiryDate: expiry,
            isExpiringSoon: isExpiringSoon
        };
    });
}


export const mockApplications: (Omit<Application, 'user'> & { user?: UserProfile })[] = [
    { 
        id: 'mock-app1', 
        userId: 'user1', 
        licenseType: 'PPL Conversion', 
        status: 'in_review', 
        submittedAt: { toDate: () => pastDate(60), seconds: 0, nanoseconds: 0 }, 
        updatedAt: { toDate: () => pastDate(5), seconds: 0, nanoseconds: 0 }, 
        documents: getDocsForLicense('ppl', 'user1'), 
        user: mockUsers['user1'],
        flightLogs: [
            { id: 'log1', date: pastDate(30).toISOString().split('T')[0], duration: 2.5, aircraft: 'Cessna 172', remarks: 'VFR maneuvers and pattern work at KPAO.' },
            { id: 'log2', date: pastDate(45).toISOString().split('T')[0], duration: 5.1, aircraft: 'Piper PA-28', remarks: 'Cross-country from KSQL to KMRY and back.' },
            { id: 'log3', date: pastDate(90).toISOString().split('T')[0], duration: 3.0, aircraft: 'Cessna 172', remarks: 'Night flight, city tour and 3 takeoffs/landings.' },
            { id: 'log4', date: pastDate(120).toISOString().split('T')[0], duration: 4.5, aircraft: 'Cessna 172', remarks: 'Simulated instrument flight under VFR.' },
            { id: 'log5', date: pastDate(150).toISOString().split('T')[0], duration: 1.2, aircraft: 'Piper PA-28', remarks: 'Review of emergency procedures.' },
        ],
        feedback: "Your medical certificate is expiring soon. Please upload a new one. Also, you are missing your Air Law Exam and RT License."
    },
    { 
        id: 'mock-app2', 
        userId: 'user2', 
        licenseType: 'CPL Conversion', 
        status: 'needs_attention', 
        submittedAt: { toDate: () => pastDate(50), seconds: 0, nanoseconds: 0 }, 
        updatedAt: { toDate: () => pastDate(3), seconds: 0, nanoseconds: 0 }, 
        documents: getDocsForLicense('cpl', 'user2'), 
        user: mockUsers['user2'],
        flightLogs: Array.from({ length: 10 }).map((_, i) => ({
             id: `log${i}`, date: pastDate((i+1) * 15).toISOString().split('T')[0], duration: 1.8, aircraft: 'DA42', remarks: `Multi-engine training flight #${10 - i}`
        })),
        feedback: "Your Class 1 Medical Certificate is expiring in less than 90 days. We require this to be renewed before we can proceed. The multi-engine rating document is also missing."
    },
    { 
        id: 'mock-app3', 
        userId: 'user3', 
        licenseType: 'ATPL Conversion', 
        status: 'approved', 
        submittedAt: { toDate: () => pastDate(30), seconds: 0, nanoseconds: 0 }, 
        updatedAt: { toDate: () => pastDate(10), seconds: 0, nanoseconds: 0 }, 
        documents: getDocsForLicense('atpl', 'user3'), 
        user: mockUsers['user3'],
        flightLogs: [
             { id: 'log-atpl-1', date: pastDate(70).toISOString().split('T')[0], duration: 6.7, aircraft: 'Airbus A320', remarks: 'JFK-LAX, line operating experience.' },
             { id: 'log-atpl-2', date: pastDate(78).toISOString().split('T')[0], duration: 5.5, aircraft: 'Airbus A320', remarks: 'LAX-ORD, long haul sector.' },
             { id: 'log-atpl-3', date: pastDate(92).toISOString().split('T')[0], duration: 1.5, aircraft: 'Boeing 737 Sim', remarks: 'Recurrent training, engine out procedure.' },
        ],
        feedback: "Congratulations! Your ATPL conversion has been approved. Welcome."
    },
];
