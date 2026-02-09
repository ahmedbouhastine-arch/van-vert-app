import type { Application, UserProfile, DocumentRequirement, ApplicationDocument } from "@/types";
import { licenseTypes } from "@/lib/licensing";

export const mockUsers: Record<string, UserProfile & { id: string }> = {
    'user1': { id: 'user1', displayName: 'Amelia Pilot', email: 'amelia.pilot@example.com', photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', role: 'user', createdAt: { seconds: 0, nanoseconds: 0, toDate: () => new Date() } },
    'user2': { id: 'user2', displayName: 'John Flyer', email: 'john.flyer@example.com', photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', role: 'user', createdAt: { seconds: 0, nanoseconds: 0, toDate: () => new Date() } },
    'user3': { id: 'user3', displayName: 'Chuck Yeager', email: 'chuck.yeager@example.com', photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', role: 'user', createdAt: { seconds: 0, nanoseconds: 0, toDate: () => new Date() } },
};

const getDocsForLicense = (licenseId: 'ppl' | 'cpl' | 'atpl'): ApplicationDocument[] => {
    const license = licenseTypes.find(l => l.id === licenseId);
    if (!license) return [];
    return license.documentRequirements.map((req: DocumentRequirement, index: number) => ({
        id: `doc${index + 1}`,
        docRequirementId: req.id,
        name: req.name,
        description: req.description,
        status: index % 3 === 0 ? 'approved' : (index % 3 === 1 ? 'uploaded' : 'needs_attention'),
        requiresExpiry: req.requiresExpiry,
        fileName: 'mock_document.pdf',
        uploadedAt: new Date().toISOString(),
        storagePath: '/mock/path',
        expiryDate: req.requiresExpiry ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
    }));
}


export const mockApplications: (Application & { user: UserProfile })[] = [
    { 
        id: 'mock-app1', 
        userId: 'user1', 
        licenseType: 'PPL Conversion', 
        status: 'in_review', 
        submittedAt: { toDate: () => new Date('2023-10-26T10:00:00Z'), seconds: 0, nanoseconds: 0 }, 
        updatedAt: { toDate: () => new Date('2023-10-28T10:00:00Z'), seconds: 0, nanoseconds: 0 }, 
        documents: getDocsForLicense('ppl'), 
        user: mockUsers['user1'],
        flightLogs: [
            { id: 'log1', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], duration: 2.5, aircraft: 'Cessna 172', remarks: 'Local flight training' },
            { id: 'log2', date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], duration: 5.1, aircraft: 'Piper PA-28', remarks: 'Cross-country to KSQL' },
            { id: 'log3', date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], duration: 3.0, aircraft: 'Cessna 172', remarks: 'Night flight' },
            { id: 'log4', date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], duration: 4.5, aircraft: 'Cessna 172', remarks: 'Instrument approaches' },

        ],
        feedback: "Please double-check the expiry date on your medical certificate. It seems to be incorrect."
    },
    { 
        id: 'mock-app2', 
        userId: 'user2', 
        licenseType: 'CPL Conversion', 
        status: 'needs_attention', 
        submittedAt: { toDate: () => new Date('2023-10-25T10:00:00Z'), seconds: 0, nanoseconds: 0 }, 
        updatedAt: { toDate: () => new Date('2023-10-29T10:00:00Z'), seconds: 0, nanoseconds: 0 }, 
        documents: getDocsForLicense('cpl'), 
        user: mockUsers['user2'],
        flightLogs: Array.from({ length: 10 }).map((_, i) => ({
             id: `log${i}`, date: new Date(Date.now() - (i+1) * 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], duration: 1.8, aircraft: 'DA42', remarks: 'Multi-engine training'
        })),
        feedback: "Your English proficiency certificate seems to be missing. Please upload it."
    },
    { 
        id: 'mock-app3', 
        userId: 'user3', 
        licenseType: 'ATPL Conversion', 
        status: 'approved', 
        submittedAt: { toDate: () => new Date('2023-11-01T10:00:00Z'), seconds: 0, nanoseconds: 0 }, 
        updatedAt: { toDate: () => new Date('2023-11-20T10:00:00Z'), seconds: 0, nanoseconds: 0 }, 
        documents: getDocsForLicense('atpl'), 
        user: mockUsers['user3'],
        flightLogs: [],
        feedback: "Congratulations! Your ATPL conversion has been approved."
    },
];