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

  return <AdminApplicationClient application={application} user={user} />;
}
