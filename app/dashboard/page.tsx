export const dynamic = "force-dynamic";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Gift, Copy, Lock, Clock, Share2, BookOpen, Star, Settings } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { daysUntilBirthday, formatBirthday, isBirthdayToday } from "@/lib/utils";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();

  // Check if onboarding is complete
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
    <div className="min-h-screen bg-navy-800 text-white">
      {/* Nav */}
      <nav className="border-b border-navy-600/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="text-violet-500 w-5 h-5" />
          <span className="font-playfair text-lg font-bold text-white">BirthdayWhisper</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm hidden sm:block">
            Hi, {clerkUser?.firstName ?? user.displayName}
          </span>
          <Link href="/settings">
            <Settings className="w-5 h-5 text-slate-400 hover:text-white transition-colors" />
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        {/* Birthday today banner */}
        {isToday && (
          <div className="bg-gradient-to-r from-violet-600 to-amber-500 rounded-2xl p-6 text-center">
            <p className="font-playfair text-2xl font-bold text-white mb-1">Happy Birthday!</p>
            <p className="text-white/80 text-sm">Your messages are unlocked. Open your birthday book!</p>
            <Link
              href="/reveal"
              className="inline-block mt-4 bg-white text-violet-700 font-semibold px-6 py-2 rounded-full hover:bg-white/90 transition-colors"
            >
              Open My Whispers
            </Link>
          </div>
        )}

        {/* Share link card */}
        <div className="bg-navy-700 border border-navy-600 rounded-2xl p-6">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Your Birthday Link</p>
          <div className="flex items-center gap-3 bg-navy-800 rounded-xl px-4 py-3 mb-4">
            <span className="text-slate-300 text-sm flex-1 truncate">{profileUrl}</span>
            <button
              title="Copy link"
              className="text-violet-400 hover:text-violet-300 transition-colors flex-shrink-0"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 border border-navy-600 hover:border-violet-500 text-slate-300 hover:text-white text-sm py-2.5 rounded-xl transition-all">
              <Share2 className="w-4 h-4" /> Share
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Leave me a secret birthday message! 🎂 ${profileUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-green-600/20 border border-green-600/30 text-green-400 hover:bg-green-600/30 text-sm py-2.5 rounded-xl transition-all"
            >
              WhatsApp
            </a>
          </div>
        </div>

        {/* Message count */}
        <div className="bg-navy-700 border border-navy-600 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Whispers Waiting</p>
              <p className="font-playfair text-4xl font-bold text-white">{messageCount}</p>
              <p className="text-slate-400 text-sm mt-1">
                {messageCount === 0
                  ? "No messages yet — share your link!"
                  : messageCount === 1
                  ? "1 secret message sealed for you"
                  : `${messageCount} secret messages sealed for you`}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <Lock className="w-5 h-5 text-violet-400" />
            </div>
          </div>

          {/* Progress bar */}
          {messageCount > 0 && (
            <div className="h-1.5 bg-navy-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all"
                style={{ width: `${Math.min((messageCount / 20) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Countdown */}
        <div className="bg-navy-700 border border-navy-600 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Your Birthday</p>
              <p className="text-white font-semibold">{birthdayLabel}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          {isToday ? (
            <p className="text-amber-400 font-semibold text-lg">It&apos;s your birthday today!</p>
          ) : (
            <div className="flex gap-4">
              {[{ value: days, label: "days" }].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="font-playfair text-4xl font-bold text-violet-400">{value}</div>
                  <div className="text-slate-500 text-xs mt-1">{label} to go</div>
                </div>
              ))}
            </div>
          )}
          {!isToday && (
            <Link
              href="/reveal"
              className="mt-4 inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
            >
              <BookOpen className="w-4 h-4" /> See your countdown page
            </Link>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { href: "/jar", icon: BookOpen, label: "Memory Jar" },
            { href: "/wishlist", icon: Star, label: "Wishlist" },
            { href: "/settings", icon: Settings, label: "Settings" },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="bg-navy-700 border border-navy-600 hover:border-violet-500/50 rounded-xl p-4 flex flex-col items-center gap-2 text-center transition-all group"
            >
              <Icon className="w-5 h-5 text-slate-400 group-hover:text-violet-400 transition-colors" />
              <span className="text-slate-400 group-hover:text-white text-xs transition-colors">{label}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
