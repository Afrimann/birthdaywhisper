export const dynamic = "force-dynamic";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Lock, Clock, BookOpen } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { daysUntilBirthday, formatBirthday, isBirthdayToday } from "@/lib/utils";
import { getShareUrl } from "@/lib/url";
import AppShell from "@/app/_components/AppShell";
import CopyLinkButton from "./CopyLinkButton";
import ShareButton from "./ShareButton";

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

  const follows = user
    ? await prisma.birthdayFollow.findMany({
        where: { followerId: user.id },
        include: {
          followed: {
            select: {
              displayName: true,
              username: true,
              birthdayMonth: true,
              birthdayDay: true,
            },
          },
        },
        take: 5,
      }).catch(() => [])
    : [];

  if (!user) redirect("/onboarding");

  const upcomingFollows = follows
    .map((f) => ({
      ...f,
      days: daysUntilBirthday(f.followed.birthdayMonth, f.followed.birthdayDay),
      isToday: isBirthdayToday(f.followed.birthdayMonth, f.followed.birthdayDay),
      label: formatBirthday(f.followed.birthdayMonth, f.followed.birthdayDay),
    }))
    .sort((a, b) => a.days - b.days);

  const messageCount = user._count.messages;
  const isToday = isBirthdayToday(user.birthdayMonth, user.birthdayDay);
  const days = daysUntilBirthday(user.birthdayMonth, user.birthdayDay);
  const birthdayLabel = formatBirthday(user.birthdayMonth, user.birthdayDay);
  const profileUrl = getShareUrl(user.username);

  return (
    <AppShell>
      <div className="space-y-4">
        <p className="text-accent-700 text-sm mb-2">Hi, {clerkUser?.firstName ?? user.displayName}</p>

        {/* Birthday today banner */}
        {isToday && (
          <div className="bg-gradient-to-r from-accent-500 to-accent-400 rounded-xl p-6 text-center animate-fade-rise">
            <p className="font-fraunces text-2xl font-bold text-canvas mb-1">Happy Birthday!</p>
            <p className="text-canvas/70 text-sm">Your messages are unlocked. Open your birthday book!</p>
            <Link
              href="/reveal"
              className="inline-flex items-center mt-4 bg-canvas text-accent-500 font-semibold px-6 py-3 rounded-full hover:bg-canvas/90 transition-colors min-h-[44px]"
            >
              Open My Whispers
            </Link>
          </div>
        )}

        {/* Share link card */}
        <div className="card rounded-xl p-6 animate-fade-rise">
          <p className="text-accent-700 text-xs font-semibold uppercase tracking-wider mb-3">Your Birthday Link</p>
          <div className="flex items-center gap-3 bg-[rgba(255,255,255,0.6)] rounded-xl px-4 py-3 mb-4 border border-sand">
            <span className="text-accent-900 text-sm flex-1 truncate">{profileUrl}</span>
            <CopyLinkButton url={profileUrl} />
          </div>
          <div className="flex gap-3">
            <ShareButton url={profileUrl} title="Leave me a secret birthday message!" />
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Leave me a secret birthday message! 🎂 ${profileUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-green-600/20 border border-green-600/30 text-green-400 hover:bg-green-600/30 text-sm py-2.5 rounded-xl transition-all min-h-[44px]"
            >
              WhatsApp
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Leave me a secret birthday message! 🎂 ${profileUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 border border-sand hover:border-[rgba(193,97,61,0.4)] text-accent-700 hover:text-accent-900 text-sm py-2.5 rounded-xl transition-all min-h-[44px]"
            >
              𝕏
            </a>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Message count */}
          <div className="card rounded-xl p-6 animate-fade-rise" style={{ animationDelay: "60ms" }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-accent-700 text-xs font-semibold uppercase tracking-wider mb-1">Whispers Waiting</p>
                <p className="font-fraunces text-5xl font-bold text-accent-900">{messageCount}</p>
                <p className="text-accent-700 text-sm mt-1">
                  {messageCount === 0
                    ? "No messages yet — share your link!"
                    : messageCount === 1
                    ? "1 secret message sealed for you"
                    : `${messageCount} secret messages sealed for you`}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[rgba(193,97,61,0.08)] border border-[rgba(193,97,61,0.18)] flex items-center justify-center">
                <Lock className="w-5 h-5 text-accent-500" />
              </div>
            </div>

            {messageCount > 0 && (
              <div className="h-1.5 bg-blush rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent-500 to-accent-400 rounded-full transition-all"
                  style={{ width: `${Math.min((messageCount / 20) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Countdown */}
          <div className="card rounded-xl p-6 animate-fade-rise" style={{ animationDelay: "100ms" }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-accent-700 text-xs font-semibold uppercase tracking-wider mb-1">Your Birthday</p>
                <p className="text-accent-900 font-semibold">{birthdayLabel}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[rgba(111,122,74,0.1)] border border-[rgba(111,122,74,0.2)] flex items-center justify-center">
                <Clock className="w-5 h-5 text-gold" />
              </div>
            </div>
            {isToday ? (
              <p className="text-accent-500 font-semibold text-lg">It&apos;s your birthday today!</p>
            ) : (
              <div className="flex gap-4">
                {[{ value: days, label: "days" }].map(({ value, label }) => (
                  <div key={label} className="text-center">
                    <div className="font-fraunces text-5xl font-bold text-accent-500">{value}</div>
                    <div className="text-ghost text-xs mt-1">{label} to go</div>
                  </div>
                ))}
              </div>
            )}
            {!isToday && (
              <Link
                href="/reveal"
                className="mt-4 inline-flex items-center gap-2 text-accent-700 hover:text-accent-900 text-sm transition-colors"
              >
                <BookOpen className="w-4 h-4" /> See your countdown page
              </Link>
            )}
          </div>
        </div>

        {/* Upcoming birthdays */}
        {upcomingFollows.length > 0 && (
          <div className="card rounded-xl p-6 animate-fade-rise" style={{ animationDelay: "160ms" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-accent-700 text-xs font-semibold uppercase tracking-wider">Upcoming Birthdays</p>
              <Link href="/following" className="text-accent-500 text-xs hover:text-accent-600 transition-colors">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingFollows.map(({ followed, days, isToday: fIsToday, label, id }) => (
                <Link
                  key={id}
                  href={`/b/${followed.username}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-full bg-[rgba(193,97,61,0.1)] border border-[rgba(193,97,61,0.2)] flex items-center justify-center flex-shrink-0">
                    <span className="font-fraunces text-xs font-bold text-accent-500">
                      {followed.displayName[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-accent-900 text-sm font-medium truncate group-hover:text-accent-600 transition-colors">{followed.displayName}</p>
                    <p className="text-ghost text-xs">{label}</p>
                  </div>
                  <span className="text-accent-500 text-sm font-bold font-fraunces flex-shrink-0">
                    {fIsToday ? "🎂" : `${days}d`}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
