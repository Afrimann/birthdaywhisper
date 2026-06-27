export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { BookOpen, Gift } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

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
    <div className="min-h-screen bg-canvas text-cream">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[240px] bg-[rgba(242,193,78,0.04)] rounded-full blur-3xl pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 border-b border-[rgba(242,193,78,0.08)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="text-gold w-5 h-5" />
          <span className="font-fraunces text-lg font-bold text-cream tracking-tight">Memory Jar</span>
        </div>
        <Link href="/dashboard" className="text-stone hover:text-cream text-sm transition-colors">
          ← Dashboard
        </Link>
      </nav>

      <main className="relative z-10 max-w-2xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8 animate-fade-rise">
          <h1 className="font-fraunces text-2xl font-bold text-cream mb-1">
            {user.displayName}&apos;s Whispers
          </h1>
          <p className="text-stone text-sm">
            {messages.length === 0
              ? "No messages opened yet."
              : `${messages.length} message${messages.length !== 1 ? "s" : ""} you&apos;ve read`}
          </p>
        </div>

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="glass rounded-2xl p-10 text-center animate-fade-rise">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(242,193,78,0.07)] border border-[rgba(242,193,78,0.15)] flex items-center justify-center mx-auto mb-4">
              <Gift className="w-7 h-7 text-gold opacity-50" />
            </div>
            <p className="text-stone text-sm mb-4">
              Your opened birthday messages will live here.
            </p>
            <Link
              href="/dashboard"
              className="text-gold hover:text-gold-bright text-sm transition-colors underline underline-offset-2"
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
                className="glass rounded-2xl p-6 animate-fade-rise"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <p className="text-cream text-sm leading-relaxed mb-4">{msg.content}</p>
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
      </main>
    </div>
  );
}
