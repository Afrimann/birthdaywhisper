export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Gift, Wallet, Clock } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { koboToNaira } from "@/lib/utils";
import AppShell from "@/app/_components/AppShell";

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
    <AppShell>
      <div className="max-w-lg">
        <h1 className="font-fraunces text-3xl md:text-4xl font-bold text-accent-900 mb-6">Notifications</h1>
        {notifications.length === 0 ? (
          <div className="card rounded-xl p-10 text-center animate-fade-rise">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(193,97,61,0.07)] border border-[rgba(193,97,61,0.15)] flex items-center justify-center mx-auto mb-4">
              <Gift className="w-7 h-7 text-accent-500 opacity-50" />
            </div>
            <p className="text-accent-700 text-sm">No notifications yet. When someone reacts to your message or gifts you, you&apos;ll see it here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n, i) => {
              const p = n.payload as Record<string, string>;
              return (
                <div
                  key={n.id}
                  className="card rounded-xl p-4 flex items-start gap-4 animate-fade-rise"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {n.type === "PAYOUT_ACCOUNT_MISSING" ? (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-[rgba(193,97,61,0.08)] border border-[rgba(193,97,61,0.18)] flex items-center justify-center flex-shrink-0">
                        <Wallet className="w-4 h-4 text-accent-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-accent-900 text-sm">
                          You have{" "}
                          <span className="font-semibold">
                            {koboToNaira(Number(p.totalKobo))}
                          </span>{" "}
                          in gift{Number(p.giftCount) !== 1 ? "s" : ""} waiting — add your bank details to receive them.
                        </p>
                        <Link
                          href="/payouts"
                          className="text-accent-500 hover:text-accent-600 text-xs underline underline-offset-2 transition-colors"
                        >
                          Add bank account →
                        </Link>
                        <p className="text-ghost text-xs mt-1">{timeAgo(new Date(n.createdAt))}</p>
                      </div>
                    </>
                  ) : n.type === "GIFTS_READY_TO_WITHDRAW" ? (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-[rgba(193,97,61,0.08)] border border-[rgba(193,97,61,0.18)] flex items-center justify-center flex-shrink-0">
                        <Gift className="w-4 h-4 text-accent-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-accent-900 text-sm">
                          It&apos;s your birthday!{" "}
                          <span className="font-semibold">
                            {koboToNaira(Number(p.totalKobo))}
                          </span>{" "}
                          in gift{Number(p.giftCount) !== 1 ? "s" : ""} is ready to withdraw.
                        </p>
                        <Link
                          href="/payouts"
                          className="text-accent-500 hover:text-accent-600 text-xs underline underline-offset-2 transition-colors"
                        >
                          Withdraw now →
                        </Link>
                        <p className="text-ghost text-xs mt-1">{timeAgo(new Date(n.createdAt))}</p>
                      </div>
                    </>
                  ) : n.type === "TRANSFER_FAILED" ? (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-[rgba(193,97,61,0.08)] border border-[rgba(193,97,61,0.18)] flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-accent-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-accent-900 text-sm">
                          We couldn&apos;t send a{" "}
                          <span className="font-semibold">{koboToNaira(Number(p.amountKobo))}</span>{" "}
                          gift just now — head to Payouts and try withdrawing again.
                        </p>
                        <Link
                          href="/payouts"
                          className="text-accent-500 hover:text-accent-600 text-xs underline underline-offset-2 transition-colors"
                        >
                          Try again →
                        </Link>
                        <p className="text-ghost text-xs mt-1">{timeAgo(new Date(n.createdAt))}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-[rgba(193,97,61,0.08)] border border-[rgba(193,97,61,0.18)] flex items-center justify-center flex-shrink-0 text-xl leading-none">
                        {p.emoji ?? "💌"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-accent-900 text-sm">
                          <span className="font-semibold">{p.recipientName}</span>
                          {" reacted "}
                          <span>{p.emoji}</span>
                          {" to your birthday message"}
                        </p>
                        <p className="text-ghost text-xs mt-1">{timeAgo(new Date(n.createdAt))}</p>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
