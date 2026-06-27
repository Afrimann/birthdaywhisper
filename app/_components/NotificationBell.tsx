"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.notifications)) {
          setUnread(d.notifications.filter((n: { read: boolean }) => !n.read).length);
        }
      })
      .catch(() => null);
  }, []);

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
