'use client';

import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, AlertCircle, Upload, FileText } from "lucide-react";
import { collection, orderBy, query, updateDoc, doc, writeBatch } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTransition } from "@/components/PageTransition";
import { VvPageHeader } from "@/components/vv/VvPageHeader";
import { VvEmptyState } from "@/components/vv/VvEmptyState";
import { VvButton } from "@/components/vv/VvButton";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import type { Notification } from "@/types";

function notifIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes("approved") || t.includes("verified")) return { Icon: CheckCircle2, tone: "ready" as const };
  if (t.includes("attention") || t.includes("feedback") || t.includes("reject")) return { Icon: AlertCircle, tone: "attention" as const };
  if (t.includes("upload")) return { Icon: Upload, tone: "default" as const };
  return { Icon: FileText, tone: "default" as const };
}

function NotificationRow({ n, onClick }: { n: Notification; onClick: (n: Notification) => void }) {
  const { Icon, tone } = notifIcon(n.title);
  return (
    <div
      onClick={() => onClick(n)}
      className={cn(
        "flex cursor-pointer items-start gap-4 rounded-xl border px-5 py-4 transition-colors",
        !n.isRead
          ? "border-[var(--sky)] border-l-[3px] bg-[var(--sky-pale)]"
          : "border-[var(--vv-border)] bg-white hover:bg-[var(--surface)]"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          tone === "ready" && "bg-[#f0fdf4] text-[var(--status-ready)]",
          tone === "attention" && "bg-[#fffbeb] text-[var(--status-attention)]",
          tone === "default" && "bg-[var(--sky-pale)] text-[var(--sky)]"
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] leading-snug text-[var(--text-primary)]">{n.title}</div>
        <div className="mt-1 text-[11px] text-[var(--text-muted)]">
          {formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true })}
        </div>
      </div>
      {!n.isRead && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--sky)]" />}
    </div>
  );
}

export default function NotificationsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const notifsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "notifications"), orderBy("createdAt", "desc"));
  }, [firestore, user]);

  const { data: notifications, isLoading } = useCollection<Notification>(notifsQuery);
  const unread = notifications?.filter((n) => !n.isRead) ?? [];
  const read = notifications?.filter((n) => n.isRead) ?? [];

  const markRead = async (n: Notification) => {
    if (!n.isRead && firestore && user) {
      await updateDoc(doc(firestore, `users/${user.uid}/notifications/${n.id}`), { isRead: true });
    }
  };

  const handleRowClick = (n: Notification) => {
    markRead(n);
    if (n.href) router.push(n.href);
  };

  const markAllAsRead = async () => {
    if (!firestore || !user || !unread.length) return;
    const batch = writeBatch(firestore);
    unread.forEach((n) => batch.update(doc(firestore, `users/${user.uid}/notifications/${n.id}`), { isRead: true }));
    await batch.commit();
  };

  return (
    <PageTransition>
      <VvPageHeader
        kicker="Activity"
        title="Notifications"
        sub="A full history of updates on your applications, documents, and account."
        actions={
          unread.length > 0 ? (
            <VvButton variant="outline" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </VvButton>
          ) : undefined
        }
      />
      {isLoading ? (
        <div className="mt-6 flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 rounded-xl border border-[var(--vv-border)] bg-white px-5 py-4">
              <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications && notifications.length > 0 ? (
        <div>
          {unread.length > 0 && (
            <div>
              <div className="mb-3 mt-6 text-[10px] font-semibold uppercase tracking-[3px] text-[var(--text-muted)]">
                New
              </div>
              <div className="flex flex-col gap-2">
                {unread.map((n) => (
                  <NotificationRow key={n.id} n={n} onClick={handleRowClick} />
                ))}
              </div>
            </div>
          )}
          {read.length > 0 && (
            <div>
              <div className="mb-3 mt-6 text-[10px] font-semibold uppercase tracking-[3px] text-[var(--text-muted)]">
                Earlier
              </div>
              <div className="flex flex-col gap-2">
                {read.map((n) => (
                  <NotificationRow key={n.id} n={n} onClick={handleRowClick} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <VvEmptyState
          icon={Bell}
          title="No notifications yet"
          sub="You'll see application updates, reviewer feedback, and document alerts here."
        />
      )}
    </PageTransition>
  );
}
