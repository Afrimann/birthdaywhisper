export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Bell, Gift } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { daysUntilBirthday, formatBirthday, isBirthdayToday } from "@/lib/utils";

export default async function FollowingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  }).catch(() => null);
  if (!user) redirect("/onboarding");

  const follows = await prisma.birthdayFollow.findMany({
    where: { followerId: user.id },
    include: {
      followed: {
        select: {
          displayName: true,
          username: true,
          avatarUrl: true,
          birthdayMonth: true,
          birthdayDay: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  const sorted = follows
    .map((f) => ({
      ...f,
      days: daysUntilBirthday(f.followed.birthdayMonth, f.followed.birthdayDay),
      isToday: isBirthdayToday(f.followed.birthdayMonth, f.followed.birthdayDay),
      label: formatBirthday(f.followed.birthdayMonth, f.followed.birthdayDay),
    }))
    .sort((a, b) => a.days - b.days);

  return (
    <div className="min-h-screen bg-canvas text-cream">
      <nav className="border-b border-[rgba(242,193,78,0.08)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="text-gold w-5 h-5" />
          <span className="font-fraunces text-lg font-bold text-cream tracking-tight">Following</span>
        </div>
        <Link href="/dashboard" className="text-stone hover:text-cream text-sm transition-colors">
          ← Dashboard
        </Link>
      </nav>

      <main className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-8 animate-fade-rise">
          <h1 className="font-fraunces text-2xl font-bold text-cream mb-1">Birthdays you follow</h1>
          <p className="text-stone text-sm">
            {follows.length === 0
              ? "You're not following any birthdays yet."
              : `You'll get a reminder ${follows[0]?.followed ? "3 days before each birthday." : ""}`}
          </p>
        </div>

        {follows.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center animate-fade-rise">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(242,193,78,0.07)] border border-[rgba(242,193,78,0.15)] flex items-center justify-center mx-auto mb-4">
              <Gift className="w-7 h-7 text-gold opacity-50" />
            </div>
            <p className="text-stone text-sm mb-4">
              Visit someone's birthday page and tap "Follow birthday" to get reminded before their big day.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map(({ followed, days, isToday, label, id }) => {
              const initials = followed.displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
              return (
                <Link
                  key={id}
                  href={`/b/${followed.username}`}
                  className="glass rounded-2xl p-4 flex items-center gap-4 hover:border-[rgba(242,193,78,0.3)] transition-all animate-fade-rise group"
                >
                  <div className="w-12 h-12 rounded-full bg-[rgba(242,193,78,0.1)] border border-[rgba(242,193,78,0.2)] flex items-center justify-center flex-shrink-0">
                    {followed.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={followed.avatarUrl} alt={followed.displayName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="font-fraunces text-sm font-bold text-gold">{initials}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-cream font-medium truncate">{followed.displayName}</p>
                    <p className="text-stone text-xs">{label}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {isToday ? (
                      <span className="text-gold text-xs font-semibold">🎂 Today!</span>
                    ) : (
                      <span className="text-gold text-sm font-bold font-fraunces">{days}d</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
