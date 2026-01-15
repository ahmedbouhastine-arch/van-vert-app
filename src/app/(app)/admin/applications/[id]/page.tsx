
import { applications, users } from "@/lib/data";
import { notFound } from "next/navigation";
import { AdminApplicationClient } from "./_components/AdminApplicationClient";

export default function AdminApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const application = applications.find((app) => app.id === params.id);
  
  if (!application) {
    notFound();
  }

  const user = users.find(u => u.id === application.userId);

  return (
    <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold font-headline tracking-tight">
                Review Application
            </h1>
            <p className="text-muted-foreground">
                Reviewing {user?.name}'s application for {application.licenseType}.
            </p>
        </div>
        <AdminApplicationClient application={application} user={user} />
    </div>
  );
}
