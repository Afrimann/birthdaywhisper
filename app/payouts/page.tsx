export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PayoutAccountForm from "./PayoutAccountForm";

export default async function PayoutsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      payoutAccount: {
        select: { bankCode: true, bankName: true, accountNumber: true, accountName: true, verificationStatus: true },
      },
    },
  }).catch(() => null);

  if (!user) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-canvas text-accent-900">
      <nav className="border-b border-[rgba(212,83,126,0.08)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="text-accent-500 w-5 h-5" />
          <span className="font-fraunces text-lg font-bold text-accent-900 tracking-tight">Payouts</span>
        </div>
        <Link href="/dashboard" className="text-accent-700 hover:text-accent-900 text-sm transition-colors">
          ← Dashboard
        </Link>
      </nav>

      <main className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-8 animate-fade-rise">
          <h1 className="font-fraunces text-2xl font-bold text-accent-900 mb-2">Gifts &amp; Payouts</h1>
          <p className="text-accent-700 text-sm">
            Add your bank account to receive gifts on your birthday, and track what&apos;s been sent to you.
          </p>
        </div>

        <div className="animate-fade-rise" style={{ animationDelay: "60ms" }}>
          <PayoutAccountForm initialAccount={user.payoutAccount} />
        </div>
      </main>
    </div>
  );
}
