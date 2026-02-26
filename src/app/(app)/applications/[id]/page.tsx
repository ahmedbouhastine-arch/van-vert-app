
import { notFound, redirect } from "next/navigation";
import { ApplicationClient } from "./_components/ApplicationClient";
import { getAuthenticatedAppForUser } from "@/firebase/server-auth-actions";
import { doc, getDoc } from "firebase/firestore";
import type { Application } from "@/types";
import { headers } from "next/headers";

// Helper to serialize Firestore Timestamps
function serializeTimestamps(obj: any): any {
  if (!obj) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(serializeTimestamps);
  }

  // Handle Firestore Timestamp
  if (obj.toDate && typeof obj.toDate === 'function') {
    return obj.toDate().toISOString();
  }

  const newObj: { [key: string]: any } = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[key] = serializeTimestamps(obj[key]);
    }
  }
  return newObj;
}

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { currentUser, firestore } = await getAuthenticatedAppForUser() || {};

  if (!currentUser || !firestore) {
    // This should not happen if routes are protected by middleware
    // but as a fallback, redirect to login
    const pathname = headers().get("next-url") || "/login";
    return redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  try {
    const appRef = doc(firestore, 'applications', id);
    const appSnapshot = await getDoc(appRef);

    if (!appSnapshot.exists()) {
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
    
    const serializedApplication = serializeTimestamps(applicationData);

    return (
      <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold font-headline tracking-tight">
                  Application Details
              </h1>
              <p className="text-muted-foreground">
                  Manage your application for the {applicationData.licenseType}.
              </p>
          </div>
        <ApplicationClient application={serializedApplication} />
      </div>
    );
  } catch (error) {
    console.error("Failed to fetch application:", error);
    // On any other error, you might want to show a generic error page
    // or redirect. For now, we'll treat it as not found.
    notFound();
  }
}

