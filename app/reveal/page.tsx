export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isBirthdayToday, daysUntilBirthday, formatBirthday } from "@/lib/utils";
import { Lock, Gift } from "lucide-react";
import Link from "next/link";

export default async function RevealPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      _count: { select: { messages: { where: { status: "PENDING" } } } },
    },
  });

  if (!user) redirect("/onboarding");

  const isToday = isBirthdayToday(user.birthdayMonth, user.birthdayDay);

  if (!isToday) {
    const days = daysUntilBirthday(user.birthdayMonth, user.birthdayDay);
    const birthdayLabel = formatBirthday(user.birthdayMonth, user.birthdayDay);
    const messageCount = user._count.messages;

    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-[rgba(212,83,126,0.05)] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[rgba(212,83,126,0.03)] rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-md animate-fade-rise">
          {/* Sealed lantern illustration */}
          <div className="w-32 h-32 mx-auto mb-8 relative">
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[rgba(212,83,126,0.15)] to-[rgba(255,255,255,0.8)] border border-[rgba(212,83,126,0.25)] flex items-center justify-center animate-lantern">
              <Lock className="w-12 h-12 text-accent-500" />
            </div>
            {messageCount > 0 && (
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-accent-500 flex items-center justify-center">
                <span className="text-canvas text-xs font-bold font-fraunces">{messageCount}</span>
              </div>
            )}
          </div>

          <p className="text-accent-700 text-sm italic mb-2">Your whispers are waiting...</p>
          <h1 className="font-fraunces text-3xl font-bold text-accent-900 mb-2">
            {messageCount === 0
              ? "No whispers yet"
              : `${messageCount} message${messageCount !== 1 ? "s" : ""} sealed inside`}
          </h1>
          <p className="text-accent-700 text-sm mb-8">
            Come back on{" "}
            <span className="text-accent-500 font-semibold">{birthdayLabel}</span>{" "}
            at midnight to open your book.
          </p>

          {/* Countdown */}
          <div className="glass rounded-2xl px-8 py-6 mb-8">
            <p className="text-ghost text-xs uppercase tracking-widest mb-4">Opens in</p>
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <div className="font-fraunces text-6xl font-bold text-accent-500">{days}</div>
                <div className="text-ghost text-xs mt-2 uppercase tracking-wider">days</div>
              </div>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-accent-700 hover:text-accent-900 text-sm transition-colors"
          >
            <Gift className="w-4 h-4 text-accent-500" />
            Share your link to get more messages
          </Link>
        </div>
      </div>
    );
  }

  // Birthday day — redirect to the reveal experience
  redirect("/reveal/open");
}
