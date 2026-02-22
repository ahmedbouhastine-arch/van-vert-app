"use client";

import { Bell, BellDot, Check, Mailbox } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, orderBy, query, writeBatch, where, updateDoc } from "firebase/firestore";
import type { Notification } from "@/types";
import { formatDistanceToNow, isToday, isYesterday } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

function NotificationItem({ item }: { item: Notification }) {
  const firestore = useFirestore();

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    if (item.isRead || !firestore) return;
    e.preventDefault();
    const notifRef = doc(firestore, `users/${item.userId}/notifications/${item.id}`);
    await updateDoc(notifRef, { isRead: true });
  };

  return (
    <Link href={item.href || '#'} passHref>
      <a className="block p-3 hover:bg-muted/50 rounded-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">{item.title}</p>
            <p className="text-sm text-muted-foreground">{item.body}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true })}
            </p>
          </div>
          {!item.isRead && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={handleMarkAsRead}
              title="Mark as read"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </a>
    </Link>
  );
}

export function NotificationBell() {
  const { user } = useUser();
  const firestore = useFirestore();

  const notifsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc")
    );
  }, [firestore, user]);

  const { data: notifications } = useCollection<Notification>(notifsQuery);

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  const handleMarkAllAsRead = async () => {
    if (!firestore || !user || !notifications) return;

    const unreadNotifs = notifications.filter((n) => !n.isRead);
    if (unreadNotifs.length === 0) return;

    const batch = writeBatch(firestore);
    unreadNotifs.forEach((notif) => {
      const notifRef = doc(firestore, `users/${user.uid}/notifications/${notif.id}`);
      batch.update(notifRef, { isRead: true });
    });

    await batch.commit();
  };

  const groupedNotifications = notifications?.reduce((acc, notif) => {
    const date = notif.createdAt.toDate();
    let groupKey: string;

    if (isToday(date)) {
      groupKey = 'Today';
    } else if (isYesterday(date)) {
      groupKey = 'Yesterday';
    } else {
      groupKey = 'Older';
    }

    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(notif);

    return acc;
  }, {} as Record<string, Notification[]>);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          {unreadCount > 0 ? <BellDot /> : <Bell />}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-2" align="end">
        <div className="grid gap-1">
          <div className="p-3 flex items-center justify-between font-semibold text-sm border-b">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Button variant="link" size="sm" onClick={handleMarkAllAsRead} className="h-auto p-0">
                Mark all as read
              </Button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {groupedNotifications && Object.keys(groupedNotifications).length > 0 ? (
              Object.entries(groupedNotifications).map(([group, notifs]) => (
                <div key={group}>
                  <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground">{group}</h3>
                  {notifs.map((item) => (
                    <NotificationItem key={item.id} item={item} />
                  ))}
                </div>
              ))
            ) : (
                <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-4">
                <Mailbox className="h-12 w-12 text-gray-400" />
                <p className="font-semibold">You&apos;re all caught up!</p>
                <p>You have no new notifications.</p>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
