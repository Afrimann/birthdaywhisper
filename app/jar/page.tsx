export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Gift } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/_components/AppShell";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function JarPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true, displayName: true },
  }).catch(() => null);

  if (!user) redirect("/onboarding");

  const messages = await prisma.message.findMany({
    where: {
      recipientId: user.id,
      status:      "REVEALED",
      isHidden:    false,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id:            true,
      content:       true,
      senderName:    true,
      isAnonymous:   true,
      reactionEmoji: true,
      birthdayYear:  true,
      createdAt:     true,
    },
  }).catch(() => []);

  return (
    <AppShell>
      <div>
        {/* Header */}
        <div className="mb-8 animate-fade-rise">
          <h1 className="font-fraunces text-2xl font-bold text-accent-900 mb-1">
            {user.displayName}&apos;s Whispers
          </h1>
          <p className="text-accent-700 text-sm">
            {messages.length === 0
              ? "No messages opened yet."
              : `${messages.length} message${messages.length !== 1 ? "s" : ""} you've read`}
          </p>
        </div>

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="card rounded-xl p-10 text-center animate-fade-rise">
            <div className="w-16 h-16 rounded-xl bg-[rgba(193,97,61,0.07)] border border-[rgba(193,97,61,0.15)] flex items-center justify-center mx-auto mb-4">
              <Gift className="w-7 h-7 text-accent-500 opacity-50" />
            </div>
            <p className="text-accent-700 text-sm mb-4">
              Your opened birthday messages will live here.
            </p>
            <Link
              href="/dashboard"
              className="text-accent-500 hover:text-accent-600 text-sm transition-colors underline underline-offset-2"
            >
              Share your birthday link to collect whispers
            </Link>
          </div>
        )}

        {/* Message list */}
        <div className="space-y-4">
          {messages.map((msg, i) => {
            const from = msg.isAnonymous ? "Anonymous" : (msg.senderName ?? "Anonymous");
            return (
              <div
                key={msg.id}
                className="card rounded-xl p-6 animate-fade-rise"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <p className="text-accent-900 text-sm leading-relaxed mb-4">{msg.content}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-ghost text-xs">— {from}</span>
                    {msg.reactionEmoji && (
                      <span className="text-base leading-none">{msg.reactionEmoji}</span>
                    )}
                  </div>
                  <span className="text-ghost text-xs">
                    {msg.birthdayYear} · {formatDate(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
