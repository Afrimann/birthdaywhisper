export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GIFTING_ENABLED } from "@/lib/feature-flags";
import AppShell from "@/app/_components/AppShell";
import PayoutAccountForm from "./PayoutAccountForm";

export default async function PayoutsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!GIFTING_ENABLED) redirect("/dashboard");

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
    <AppShell>
      <div className="max-w-lg">
        <div className="mb-8 animate-fade-rise">
          <h1 className="font-fraunces text-3xl md:text-4xl font-bold text-accent-900 mb-2">Gifts &amp; Payouts</h1>
          <p className="text-accent-700 text-sm">
            Add your bank account to receive gifts on your birthday, and track what&apos;s been sent to you.
          </p>
        </div>

        <div className="animate-fade-rise" style={{ animationDelay: "60ms" }}>
          <PayoutAccountForm initialAccount={user.payoutAccount} />
        </div>
      </div>
    </AppShell>
  );
}
