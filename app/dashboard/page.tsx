export const dynamic = "force-dynamic";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Gift, Lock, Clock, Share2, BookOpen, Star, Settings } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { daysUntilBirthday, formatBirthday, isBirthdayToday } from "@/lib/utils";
import CopyLinkButton from "./CopyLinkButton";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      _count: { select: { messages: { where: { status: "PENDING" } } } },
    },
  }).catch(() => null);

  if (!user) redirect("/onboarding");

  const messageCount = user._count.messages;
  const isToday = isBirthdayToday(user.birthdayMonth, user.birthdayDay);
  const days = daysUntilBirthday(user.birthdayMonth, user.birthdayDay);
  const birthdayLabel = formatBirthday(user.birthdayMonth, user.birthdayDay);
  const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/b/${user.username}`;

  return (
    <div className="min-h-screen bg-canvas text-cream">
      {/* Nav */}
      <nav className="border-b border-[rgba(242,193,78,0.08)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="text-gold w-5 h-5" />
          <span className="font-fraunces text-lg font-bold text-cream tracking-tight">BirthdayWhisper</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-stone text-sm hidden sm:block">
            Hi, {clerkUser?.firstName ?? user.displayName}
          </span>
          <Link href="/settings">
            <Settings className="w-5 h-5 text-stone hover:text-cream transition-colors" />
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-4">
        {/* Birthday today banner */}
        {isToday && (
          <div className="bg-gradient-to-r from-gold to-gold-bright rounded-2xl p-6 text-center animate-fade-rise">
            <p className="font-fraunces text-2xl font-bold text-canvas mb-1">Happy Birthday!</p>
            <p className="text-canvas/70 text-sm">Your messages are unlocked. Open your birthday book!</p>
            <Link
              href="/reveal"
              className="inline-block mt-4 bg-canvas text-gold font-semibold px-6 py-2 rounded-full hover:bg-canvas/90 transition-colors min-h-[44px] leading-[44px] py-0"
            >
              Open My Whispers
            </Link>
          </div>
        )}

        {/* Share link card */}
        <div className="glass rounded-2xl p-6 animate-fade-rise">
          <p className="text-stone text-xs font-semibold uppercase tracking-wider mb-3">Your Birthday Link</p>
          <div className="flex items-center gap-3 bg-[rgba(11,11,13,0.6)] rounded-xl px-4 py-3 mb-4 border border-[rgba(242,193,78,0.07)]">
            <span className="text-cream text-sm flex-1 truncate">{profileUrl}</span>
            <CopyLinkButton url={profileUrl} />
          </div>
          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 border border-[rgba(242,193,78,0.15)] hover:border-[rgba(242,193,78,0.4)] text-stone hover:text-cream text-sm py-2.5 rounded-xl transition-all min-h-[44px]">
              <Share2 className="w-4 h-4" /> Share
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Leave me a secret birthday message! 🎂 ${profileUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-green-600/20 border border-green-600/30 text-green-400 hover:bg-green-600/30 text-sm py-2.5 rounded-xl transition-all min-h-[44px]"
            >
              WhatsApp
            </a>
          </div>
        </div>

        {/* Message count */}
        <div className="glass rounded-2xl p-6 animate-fade-rise" style={{ animationDelay: "60ms" }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-stone text-xs font-semibold uppercase tracking-wider mb-1">Whispers Waiting</p>
              <p className="font-fraunces text-4xl font-bold text-cream">{messageCount}</p>
              <p className="text-stone text-sm mt-1">
                {messageCount === 0
                  ? "No messages yet — share your link!"
                  : messageCount === 1
                  ? "1 secret message sealed for you"
                  : `${messageCount} secret messages sealed for you`}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[rgba(242,193,78,0.08)] border border-[rgba(242,193,78,0.18)] flex items-center justify-center">
              <Lock className="w-5 h-5 text-gold" />
            </div>
          </div>

          {messageCount > 0 && (
            <div className="h-1.5 bg-pitch rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold to-gold-bright rounded-full transition-all"
                style={{ width: `${Math.min((messageCount / 20) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Countdown */}
        <div className="glass rounded-2xl p-6 animate-fade-rise" style={{ animationDelay: "120ms" }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-stone text-xs font-semibold uppercase tracking-wider mb-1">Your Birthday</p>
              <p className="text-cream font-semibold">{birthdayLabel}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[rgba(242,193,78,0.08)] border border-[rgba(242,193,78,0.18)] flex items-center justify-center">
              <Clock className="w-5 h-5 text-gold" />
            </div>
          </div>
          {isToday ? (
            <p className="text-gold font-semibold text-lg">It&apos;s your birthday today!</p>
          ) : (
            <div className="flex gap-4">
              {[{ value: days, label: "days" }].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="font-fraunces text-4xl font-bold text-gold">{value}</div>
                  <div className="text-ghost text-xs mt-1">{label} to go</div>
                </div>
              ))}
            </div>
          )}
          {!isToday && (
            <Link
              href="/reveal"
              className="mt-4 inline-flex items-center gap-2 text-stone hover:text-cream text-sm transition-colors"
            >
              <BookOpen className="w-4 h-4" /> See your countdown page
            </Link>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-3 animate-fade-rise" style={{ animationDelay: "180ms" }}>
          {[
            { href: "/jar",      icon: BookOpen,  label: "Memory Jar" },
            { href: "/wishlist", icon: Star,      label: "Wishlist"   },
            { href: "/settings", icon: Settings,  label: "Settings"   },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="glass rounded-xl p-4 flex flex-col items-center gap-2 text-center transition-all hover:border-[rgba(242,193,78,0.3)] group min-h-[80px] justify-center"
            >
              <Icon className="w-5 h-5 text-stone group-hover:text-gold transition-colors" />
              <span className="text-stone group-hover:text-cream text-xs transition-colors">{label}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
