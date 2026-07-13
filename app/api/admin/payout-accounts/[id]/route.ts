export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isAdminUserId } from "@/lib/admin";
import { createTransferRecipient, PaystackError } from "@/lib/paystack";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminUserId(userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, rejectionReason } = body as Record<string, unknown>;
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const account = await prisma.payoutAccount.findUnique({ where: { id } });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  if (action === "reject") {
    await prisma.payoutAccount.update({
      where: { id },
      data: {
        verificationStatus: "REJECTED",
        rejectionReason: typeof rejectionReason === "string" ? rejectionReason : "Rejected by admin review",
        reviewedByAdminId: userId,
        reviewedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true });
  }

  // approve — was skipped at save-time for a WEAK match, so lazily create
  // the Paystack transfer recipient now.
  let recipientCode = account.paystackRecipientCode;
  if (!recipientCode) {
    try {
      const recipient = await createTransferRecipient({
        name: account.accountName,
        account_number: account.accountNumber,
        bank_code: account.bankCode,
      });
      recipientCode = recipient.recipient_code;
    } catch (err) {
      const message = err instanceof PaystackError ? err.message : "Could not set up this payout account";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  await prisma.payoutAccount.update({
    where: { id },
    data: {
      paystackRecipientCode: recipientCode,
      verificationStatus: "MANUALLY_APPROVED",
      reviewedByAdminId: userId,
      reviewedAt: new Date(),
      rejectionReason: null,
    },
  });

  return NextResponse.json({ success: true });
}
