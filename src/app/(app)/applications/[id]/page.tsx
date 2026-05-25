
import { notFound, redirect } from "next/navigation";
import { ApplicationClient } from "./_components/ApplicationClient";
import { getAuthenticatedAppForUser } from "@/firebase/server-auth-actions";
import type { Application } from "@/types";
import { headers } from "next/headers";
import { PageTransition } from "@/components/PageTransition";

// Helper to serialize Firestore Timestamps
function serializeTimestamps(obj: unknown): unknown {
  if (!obj) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(serializeTimestamps);
  }

  const record = obj as Record<string, unknown>;
  if (typeof record.toDate === 'function') {
    return (record as { toDate: () => Date }).toDate().toISOString();
  }

  const newObj: Record<string, unknown> = {};
  for (const key in record) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      newObj[key] = serializeTimestamps(record[key]);
    }
  }
  return newObj;
}

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { currentUser, firestore } = await getAuthenticatedAppForUser() || {};

  if (!currentUser || !firestore) {
    // This should not happen if routes are protected by middleware
    // but as a fallback, redirect to login
    const headersList = await headers();
    const pathname = headersList.get("next-url") || "/login";
    return redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  try {
    const appSnapshot = await firestore.collection('applications').doc(id).get();

    if (!appSnapshot.exists) {
      notFound();
      return;
    }

    const applicationData = appSnapshot.data() as Application;

    // Ensure the user is authorized to view this application
    if (applicationData.userId !== currentUser.uid) {
        // You could show a specific "access denied" page or just a 404
        notFound();
        return;
    }
    
    const serializedApplication = serializeTimestamps(applicationData) as Application;

    return (
      <PageTransition className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold font-headline tracking-tight">
                  Application Details
              </h1>
              <p className="text-muted-foreground">
                  Manage your application for the {applicationData.licenseType}.
              </p>
          </div>
        <ApplicationClient application={serializedApplication} />
      </PageTransition>
    );
  } catch (error) {
    console.error("Failed to fetch application:", error);
    // On any other error, you might want to show a generic error page
    // or redirect. For now, we'll treat it as not found.
    notFound();
  }
}
