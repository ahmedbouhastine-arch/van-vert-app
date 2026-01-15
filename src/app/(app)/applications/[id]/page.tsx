
import { applications } from "@/lib/data";
import { notFound } from "next/navigation";
import { ApplicationClient } from "./_components/ApplicationClient";

export default function ApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const application = applications.find((app) => app.id === params.id);

  if (!application) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold font-headline tracking-tight">
                Application Details
            </h1>
            <p className="text-muted-foreground">
                Manage your application for the {application.licenseType}.
            </p>
        </div>
      <ApplicationClient application={application} />
    </div>
  );
}
