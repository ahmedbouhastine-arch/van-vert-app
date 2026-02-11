
import type { Application, UserProfile, DocumentRequirement, ApplicationDocument, DocumentStatus } from "@/types";
import { licenseTypes } from "@/lib/licensing";

export const mockUsers: Record<string, UserProfile & { id: string }> = {};

// A helper to generate realistic dates
const pastDate = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const futureDate = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const getDocsForLicense = (licenseId: 'ppl' | 'cpl' | 'atpl', userId: string): ApplicationDocument[] => {
    return [];
}


export const mockApplications: (Omit<Application, 'user'> & { user?: UserProfile })[] = [];
