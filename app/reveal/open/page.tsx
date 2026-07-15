export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Gift } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getBirthdayYear } from "@/lib/utils";
import RevealGrid from "./RevealGrid";

export default async function RevealOpenPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true, displayName: true, birthdayMonth: true, birthdayDay: true },
  }).catch(() => null);

  if (!user) redirect("/onboarding");

  const birthdayYear = getBirthdayYear(user.birthdayMonth, user.birthdayDay);

  const heldGifts = await prisma.gift.aggregate({
    where: { recipientId: user.id, status: "HELD" },
    _sum: { amountKobo: true },
  }).catch(() => ({ _sum: { amountKobo: null } }));
  const heldGiftKobo = heldGifts._sum.amountKobo ?? 0;

  const messages = await prisma.message.findMany({
    where: {
      recipientId: user.id,
      birthdayYear,
      isHidden: false,
    },
    orderBy: { createdAt: "asc" },
    select: {
      id:            true,
      content:       true,
      senderName:    true,
      isAnonymous:   true,
      status:        true,
      reactionEmoji: true,
      cardTheme:     true,
    },
  }).catch(() => []);

  return (
    <div className="min-h-screen bg-canvas text-accent-900">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[rgba(193,97,61,0.04)] rounded-full blur-3xl pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 border-b border-[rgba(193,97,61,0.08)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="text-accent-500 w-5 h-5" />
          <span className="font-fraunces text-lg font-bold text-accent-900 tracking-tight">
            {user.displayName}&apos;s Whispers
          </span>
        </div>
        <Link href="/dashboard" className="text-accent-700 hover:text-accent-900 text-sm transition-colors">
          ← Dashboard
        </Link>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8 text-center animate-fade-rise">
          <p className="text-accent-700 text-sm italic mb-2">Birthday {birthdayYear}</p>
          <h1 className="font-fraunces text-3xl font-bold text-accent-900">
            Your Birthday Whispers
          </h1>
          <p className="text-accent-700 text-sm mt-2">
            {messages.length === 0
              ? "No messages this year — share your link!"
              : `${messages.length} message${messages.length !== 1 ? "s" : ""} waiting for you`}
          </p>
        </div>

        <RevealGrid
          messages={messages}
          firstName={user.displayName.split(" ")[0]}
          heldGiftKobo={heldGiftKobo}
        />
      </main>
    </div>
  );
}
