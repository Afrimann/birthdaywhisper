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
      <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center px-6 text-center">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-700/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md">
          {/* Sealed book illustration */}
          <div className="w-32 h-32 mx-auto mb-8 relative">
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-violet-800 to-navy-700 border-2 border-violet-600/50 flex items-center justify-center shadow-glow">
              <Lock className="w-12 h-12 text-violet-400" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{messageCount}</span>
            </div>
          </div>

          <p className="text-slate-400 text-sm italic mb-2">Your whispers are waiting...</p>
          <h1 className="font-playfair text-3xl font-bold text-white mb-2">
            {messageCount === 0
              ? "No whispers yet"
              : `${messageCount} message${messageCount !== 1 ? "s" : ""} sealed inside`}
          </h1>
          <p className="text-slate-400 text-sm mb-8">
            Come back on{" "}
            <span className="text-violet-400 font-semibold">{birthdayLabel}</span>{" "}
            at midnight to open your book.
          </p>

          {/* Countdown */}
          <div className="bg-navy-700/60 border border-navy-600 rounded-2xl px-8 py-6 mb-8">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-4">Opens in</p>
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <div className="font-playfair text-5xl font-bold text-violet-400">{days}</div>
                <div className="text-slate-500 text-xs mt-1">days</div>
              </div>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <Gift className="w-4 h-4" />
            Share your link to get more messages
          </Link>
        </div>
      </div>
    );
  }

  // Birthday day — redirect to the reveal experience
  redirect("/reveal/open");
}
