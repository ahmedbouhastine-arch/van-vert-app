'use client';

import { Bell } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { VvPageHeader } from "@/components/vv/VvPageHeader";
import { VvEmptyState } from "@/components/vv/VvEmptyState";

export default function NotificationsPage() {
  return (
    <PageTransition>
      <VvPageHeader
        kicker="Activity"
        title="Notifications"
        sub="A full history of updates on your applications, documents, and account."
      />
      <VvEmptyState
        icon={Bell}
        title="Notifications page coming soon"
        sub="This page is a placeholder. For now, use the bell icon in the top bar to view your recent notifications."
      />
    </PageTransition>
  );
}
