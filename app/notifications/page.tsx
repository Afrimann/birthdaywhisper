export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Bell, Gift } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default async function NotificationsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  }).catch(() => null);
  if (!user) redirect("/onboarding");

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  }).catch(() => []);

  // Mark all as read
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  }).catch(() => null);

  return (
    <div className="min-h-screen bg-canvas text-cream">
      <nav className="border-b border-[rgba(242,193,78,0.08)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="text-gold w-5 h-5" />
          <span className="font-fraunces text-lg font-bold text-cream tracking-tight">Notifications</span>
        </div>
        <Link href="/dashboard" className="text-stone hover:text-cream text-sm transition-colors">
          ← Dashboard
        </Link>
      </nav>

      <main className="max-w-lg mx-auto px-6 py-10">
        {notifications.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center animate-fade-rise">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(242,193,78,0.07)] border border-[rgba(242,193,78,0.15)] flex items-center justify-center mx-auto mb-4">
              <Gift className="w-7 h-7 text-gold opacity-50" />
            </div>
            <p className="text-stone text-sm">No notifications yet. When someone reacts to your message you&apos;ll see it here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n, i) => {
              const p = n.payload as Record<string, string>;
              return (
                <div
                  key={n.id}
                  className="glass rounded-2xl p-4 flex items-start gap-4 animate-fade-rise"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="w-10 h-10 rounded-xl bg-[rgba(242,193,78,0.08)] border border-[rgba(242,193,78,0.18)] flex items-center justify-center flex-shrink-0 text-xl leading-none">
                    {p.emoji ?? "💌"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-cream text-sm">
                      <span className="font-semibold">{p.recipientName}</span>
                      {" reacted "}
                      <span>{p.emoji}</span>
                      {" to your birthday message"}
                    </p>
                    <p className="text-ghost text-xs mt-1">{timeAgo(new Date(n.createdAt))}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
