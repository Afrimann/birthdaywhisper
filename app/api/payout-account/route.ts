export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { resolveAccountNumber, createTransferRecipient, PaystackError } from "@/lib/paystack";
import { matchNameStrength } from "@/lib/nameMatch";
import { GIFTING_ENABLED } from "@/lib/feature-flags";

const ACCOUNT_NUMBER_RE = /^\d{10}$/;

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { payoutAccount: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ payoutAccount: user.payoutAccount });
}

export async function POST(req: Request) {
  if (!GIFTING_ENABLED) {
    return NextResponse.json({ error: "Payouts are temporarily unavailable." }, { status: 503 });
  }

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { bankCode, bankName, accountNumber } = body as Record<string, unknown>;

  if (typeof bankCode !== "string" || !bankCode) {
    return NextResponse.json({ error: "Select a bank" }, { status: 400 });
  }
  if (typeof bankName !== "string" || !bankName) {
    return NextResponse.json({ error: "Select a bank" }, { status: 400 });
  }
  if (typeof accountNumber !== "string" || !ACCOUNT_NUMBER_RE.test(accountNumber)) {
    return NextResponse.json({ error: "Account number must be 10 digits" }, { status: 400 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, displayName: true },
  });
  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Lock edits while a transfer is already in flight — only relevant when
  // updating an existing account (a first-time save can never have an
  // in-flight transfer, since a transfer requires a recipient code that
  // only exists after a prior save).
  const existingAccount = await prisma.payoutAccount.findUnique({ where: { userId: currentUser.id } });
  if (existingAccount) {
    const inFlight = await prisma.gift.findFirst({
      where: { recipientId: currentUser.id, status: "HELD", paystackTransferCode: { not: null } },
    });
    if (inFlight) {
      return NextResponse.json(
        { error: "A payout is currently in progress. Try updating your bank details again once it completes (usually within a few hours)." },
        { status: 409 },
      );
    }
  }

  let resolvedName: string;
  try {
    const resolved = await resolveAccountNumber(accountNumber, bankCode);
    resolvedName = resolved.account_name;
  } catch (err) {
    const message = err instanceof PaystackError ? err.message : "Could not verify this account";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const match = matchNameStrength(resolvedName, currentUser.displayName);

  if (match.strength === "NONE") {
    return NextResponse.json(
      {
        error: `The name on this account ("${resolvedName}") doesn't match your profile name. Double-check the account, or update your display name in Settings if it's outdated.`,
      },
      { status: 422 },
    );
  }

  if (match.strength === "WEAK") {
    // Don't auto-approve a borderline match, and don't create a Paystack
    // transfer recipient yet — nothing can be paid to this account until
    // an admin reviews and approves it (belt-and-suspenders: no recipient
    // code *and* a status gate, not just one or the other).
    await prisma.payoutAccount.upsert({
      where: { userId: currentUser.id },
      create: {
        userId: currentUser.id,
        bankCode,
        bankName,
        accountNumber,
        accountName: resolvedName,
        paystackRecipientCode: null,
        verificationStatus: "PENDING_REVIEW",
        nameMatchStrength: "WEAK",
      },
      update: {
        bankCode,
        bankName,
        accountNumber,
        accountName: resolvedName,
        paystackRecipientCode: null,
        verificationStatus: "PENDING_REVIEW",
        nameMatchStrength: "WEAK",
        reviewedByAdminId: null,
        reviewedAt: null,
        rejectionReason: null,
      },
    });

    return NextResponse.json({
      success: true,
      accountName: resolvedName,
      pendingReview: true,
      message: "We've saved your account but need to manually confirm the name match — this usually takes under a day.",
    });
  }

  // STRONG match — unchanged auto-approve behavior.
  let recipientCode: string;
  try {
    const recipient = await createTransferRecipient({
      name: resolvedName,
      account_number: accountNumber,
      bank_code: bankCode,
    });
    recipientCode = recipient.recipient_code;
  } catch (err) {
    const message = err instanceof PaystackError ? err.message : "Could not set up this payout account";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  await prisma.payoutAccount.upsert({
    where: { userId: currentUser.id },
    create: {
      userId: currentUser.id,
      bankCode,
      bankName,
      accountNumber,
      accountName: resolvedName,
      paystackRecipientCode: recipientCode,
      verificationStatus: "AUTO_APPROVED",
      nameMatchStrength: "STRONG",
    },
    update: {
      bankCode,
      bankName,
      accountNumber,
      accountName: resolvedName,
      paystackRecipientCode: recipientCode,
      verificationStatus: "AUTO_APPROVED",
      nameMatchStrength: "STRONG",
      reviewedByAdminId: null,
      reviewedAt: null,
      rejectionReason: null,
    },
  });

  return NextResponse.json({ success: true, accountName: resolvedName });
}
