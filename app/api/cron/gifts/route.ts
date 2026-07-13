export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { giftIsLocallyEligible } from "@/lib/giftEligibility";

const PENDING_PAYMENT_EXPIRY_MS = 24 * 60 * 60 * 1000;

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Abandoned checkouts never reach HELD — sweep them independently of the
  // notification logic below so they don't sit around forever.
  const expired = await prisma.gift.updateMany({
    where: { status: "PENDING_PAYMENT", createdAt: { lt: new Date(now.getTime() - PENDING_PAYMENT_EXPIRY_MS) } },
    data: { status: "EXPIRED" },
  });

  // Disbursement is no longer automatic — the recipient triggers it
  // themselves via POST /api/payouts/withdraw once their birthday has
  // arrived, which re-checks ownership and eligibility server-side. This
  // cron tick only nudges recipients: either to add a payout account, or
  // to go withdraw gifts that just became eligible.
  const users = await prisma.user.findMany({
    where: { gifts: { some: { status: "HELD", paystackTransferCode: null, isDisputed: false } } },
    select: {
      id: true,
      birthdayMonth: true,
      birthdayDay: true,
      timezone: true,
      payoutAccount: {
        select: { paystackRecipientCode: true, verificationStatus: true },
      },
      gifts: {
        where: { status: "HELD", paystackTransferCode: null, isDisputed: false },
        select: { id: true, amountKobo: true, birthdayYear: true },
      },
    },
  });

  const results = await Promise.allSettled(
    users.flatMap((user) => {
      const eligibleGifts = user.gifts.filter((gift) => giftIsLocallyEligible(gift, user, now));
      if (eligibleGifts.length === 0) return [];

      const payoutAccount = user.payoutAccount;
      const accountApproved =
        payoutAccount &&
        payoutAccount.paystackRecipientCode &&
        (payoutAccount.verificationStatus === "AUTO_APPROVED" || payoutAccount.verificationStatus === "MANUALLY_APPROVED");

      if (!accountApproved) {
        return [notifyPayoutAccountMissing(user.id, eligibleGifts)];
      }

      return [notifyGiftsReadyToWithdraw(user.id, eligibleGifts)];
    }),
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({
    usersConsidered: users.length,
    notificationsAttempted: results.length,
    succeeded,
    expiredPendingPayments: expired.count,
  });
}

async function notifyPayoutAccountMissing(
  userId: string,
  gifts: { amountKobo: number }[],
) {
  const existing = await prisma.notification.findFirst({
    where: { userId, type: "PAYOUT_ACCOUNT_MISSING", read: false },
  });
  if (existing) return;

  const totalKobo = gifts.reduce((sum, g) => sum + g.amountKobo, 0);

  await prisma.notification.create({
    data: {
      userId,
      type: "PAYOUT_ACCOUNT_MISSING",
      payload: { totalKobo: String(totalKobo), giftCount: String(gifts.length) },
    },
  });
}

async function notifyGiftsReadyToWithdraw(
  userId: string,
  gifts: { amountKobo: number }[],
) {
  const existing = await prisma.notification.findFirst({
    where: { userId, type: "GIFTS_READY_TO_WITHDRAW", read: false },
  });
  if (existing) return;

  const totalKobo = gifts.reduce((sum, g) => sum + g.amountKobo, 0);

  await prisma.notification.create({
    data: {
      userId,
      type: "GIFTS_READY_TO_WITHDRAW",
      payload: { totalKobo: String(totalKobo), giftCount: String(gifts.length) },
    },
  });
}
