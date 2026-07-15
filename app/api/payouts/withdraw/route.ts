export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { giftIsLocallyEligible } from "@/lib/giftEligibility";
import { disburseGift } from "@/lib/giftDisbursement";
import { GIFTING_ENABLED } from "@/lib/feature-flags";

// Disbursement is owner-initiated, not automatic: the recipient must be
// signed in as themselves (auth() below) and their own birthday must have
// locally arrived (giftIsLocallyEligible below) for anything to move.
export async function POST() {
  if (!GIFTING_ENABLED) {
    return NextResponse.json({ error: "Payouts are temporarily unavailable." }, { status: 503 });
  }

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
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
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.gifts.length === 0) {
    return NextResponse.json({ error: "There's nothing to withdraw right now." }, { status: 400 });
  }

  const eligibleGifts = user.gifts.filter((gift) => giftIsLocallyEligible(gift, user));
  if (eligibleGifts.length === 0) {
    return NextResponse.json(
      { error: "Your gifts unlock on your birthday — check back then." },
      { status: 400 },
    );
  }

  const payoutAccount = user.payoutAccount;
  const accountApproved =
    payoutAccount &&
    payoutAccount.paystackRecipientCode &&
    (payoutAccount.verificationStatus === "AUTO_APPROVED" || payoutAccount.verificationStatus === "MANUALLY_APPROVED");

  if (!accountApproved) {
    return NextResponse.json(
      { error: "Add and verify a payout account before withdrawing." },
      { status: 400 },
    );
  }

  const recipientCode = payoutAccount.paystackRecipientCode as string;
  const results = await Promise.allSettled(
    eligibleGifts.map((gift) => disburseGift(gift.id, gift.amountKobo, recipientCode)),
  );

  let withdrawnKobo = 0;
  let withdrawnCount = 0;
  let failedCount = 0;
  results.forEach((result, i) => {
    if (result.status === "fulfilled" && result.value === "disbursed") {
      withdrawnKobo += eligibleGifts[i].amountKobo;
      withdrawnCount += 1;
    } else if (result.status === "rejected") {
      failedCount += 1;
    }
  });

  if (withdrawnCount === 0 && failedCount > 0) {
    return NextResponse.json(
      { error: "We couldn't reach our payment provider just now — try again shortly." },
      { status: 502 },
    );
  }

  return NextResponse.json({ withdrawnKobo, count: withdrawnCount, failed: failedCount });
}
