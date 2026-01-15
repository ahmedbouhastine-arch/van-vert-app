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

  return <ApplicationClient application={application} />;
}
