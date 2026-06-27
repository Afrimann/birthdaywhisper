"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import Link from "next/link";

function useNotifications() {
  return useQuery<{ notifications: { read: boolean }[] }>({
    queryKey: ["notifications"],
    queryFn: () => fetch("/api/notifications").then((r) => r.json()),
  });
}

export default function NotificationBell() {
  const { data } = useNotifications();
  const unread = Array.isArray(data?.notifications)
    ? data.notifications.filter((n) => !n.read).length
    : 0;

  return (
    <Link
      href="/notifications"
      className="relative text-stone hover:text-cream transition-colors"
      aria-label="Notifications"
    >
      <Bell className="w-5 h-5" />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold flex items-center justify-center text-[10px] font-bold text-canvas leading-none">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
