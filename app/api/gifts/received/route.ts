export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { giftIsLocallyEligible } from "@/lib/giftEligibility";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, birthdayMonth: true, birthdayDay: true, timezone: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const gifts = await prisma.gift.findMany({
    where: { recipientId: user.id, status: { in: ["HELD", "DISBURSED"] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      senderName: true,
      avatarSeed: true,
      avatarGender: true,
      amountKobo: true,
      note: true,
      status: true,
      birthdayYear: true,
      paystackTransferCode: true,
      createdAt: true,
      disbursedAt: true,
    },
  });

  const heldGifts = gifts.filter((g) => g.status === "HELD");
  const heldTotalKobo = heldGifts.reduce((sum, g) => sum + g.amountKobo, 0);
  const disbursedTotalKobo = gifts
    .filter((g) => g.status === "DISBURSED")
    .reduce((sum, g) => sum + g.amountKobo, 0);

  // Withdrawable = held, not already claimed for a transfer, and the
  // recipient's own local birthday has arrived — same predicate the
  // withdraw endpoint re-checks server-side before moving any money.
  const withdrawableKobo = heldGifts
    .filter((g) => g.paystackTransferCode === null && giftIsLocallyEligible(g, user))
    .reduce((sum, g) => sum + g.amountKobo, 0);

  const response = gifts.map((g) => ({
    id: g.id,
    senderName: g.senderName,
    avatarSeed: g.avatarSeed,
    avatarGender: g.avatarGender,
    amountKobo: g.amountKobo,
    note: g.note,
    status: g.status,
    createdAt: g.createdAt,
    disbursedAt: g.disbursedAt,
    processing: g.status === "HELD" && g.paystackTransferCode !== null,
  }));

  return NextResponse.json({ gifts: response, heldTotalKobo, disbursedTotalKobo, withdrawableKobo });
}
