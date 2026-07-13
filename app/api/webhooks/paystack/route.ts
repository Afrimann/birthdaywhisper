export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/paystack";
import { sendAdminDisputeAlertEmail } from "@/lib/email";

interface PaystackEvent {
  event: string;
  data: {
    reference?: string;
    transfer_code?: string;
    reason?: string;
    status?: string;
    transaction?: { reference?: string };
  };
}

export async function POST(req: Request) {
  // Signature must be verified against the raw, untouched body — parse
  // AFTER verification, never before.
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  switch (event.event) {
    case "charge.success": {
      const reference = event.data.reference;
      if (!reference) break;

      const gift = await prisma.gift.findUnique({ where: { paystackReference: reference } });
      // Idempotent: webhooks can be retried by Paystack, and a gift may
      // already have advanced past PENDING_PAYMENT from a prior delivery.
      if (gift && gift.status === "PENDING_PAYMENT") {
        await prisma.gift.update({
          where: { id: gift.id },
          data: { status: "HELD", paidAt: new Date() },
        });
      }
      break;
    }

    case "transfer.success": {
      const transferCode = event.data.transfer_code;
      if (!transferCode) break;

      const gift = await prisma.gift.findFirst({ where: { paystackTransferCode: transferCode } });
      if (gift && gift.status !== "DISBURSED") {
        await prisma.gift.update({
          where: { id: gift.id },
          data: { status: "DISBURSED", disbursedAt: new Date() },
        });
      }
      break;
    }

    case "transfer.failed":
    case "transfer.reversed": {
      const transferCode = event.data.transfer_code;
      if (!transferCode) break;

      const gift = await prisma.gift.findFirst({ where: { paystackTransferCode: transferCode } });
      if (gift && gift.status !== "DISBURSED") {
        // Null out the transfer code so the next cron run treats this as
        // not-yet-attempted and retries it, instead of thinking a transfer
        // is still in flight.
        await prisma.gift.update({
          where: { id: gift.id },
          data: {
            status: "HELD",
            paystackTransferCode: null,
            failureReason: event.data.reason ?? `Transfer ${event.event}`,
          },
        });
        await notifyTransferFailed(gift.recipientId, gift.id, gift.amountKobo);
      }
      break;
    }

    case "charge.dispute.create": {
      // Paystack nests the transaction reference under `data.transaction`
      // for dispute events (confirmed against their Dispute API docs), not
      // `data.reference` directly — fall back defensively regardless.
      const reference = event.data.transaction?.reference ?? event.data.reference;
      if (!reference) break;

      const gift = await prisma.gift.findUnique({ where: { paystackReference: reference } });
      if (gift && !gift.isDisputed) {
        await prisma.gift.update({
          where: { id: gift.id },
          data: { isDisputed: true, disputedAt: new Date() },
        });
        // A dispute can arrive well after DISBURSED — at that point this
        // is purely informational (drives admin recovery, not prevention).
        // No hold period exists to protect against this proactively; the
        // only lever is a human, alerted as fast as possible.
        sendAdminDisputeAlertEmail(gift.id, gift.amountKobo, gift.recipientId).catch(() => null);
      }
      break;
    }

    case "charge.dispute.resolve": {
      const reference = event.data.transaction?.reference ?? event.data.reference;
      if (!reference) break;

      const gift = await prisma.gift.findUnique({ where: { paystackReference: reference } });
      // Deliberately does NOT clear isDisputed — auto-clearing based on
      // Paystack's resolution status risks misclassifying an ambiguous
      // outcome and re-enabling a payout that shouldn't happen. Only the
      // admin "clear dispute" action flips this back.
      if (gift) {
        await prisma.gift.update({
          where: { id: gift.id },
          data: { disputeNote: `Paystack reported resolution status: ${event.data.status ?? "unknown"}` },
        });
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

// Deduped per-gift so repeated hourly retries of the same stuck gift don't
// spam a new notification every hour.
async function notifyTransferFailed(recipientId: string, giftId: string, amountKobo: number) {
  const existingUnread = await prisma.notification.findFirst({
    where: {
      userId: recipientId,
      type: "TRANSFER_FAILED",
      read: false,
      payload: { path: ["giftId"], equals: giftId },
    },
  });
  if (existingUnread) return;

  await prisma.notification.create({
    data: {
      userId: recipientId,
      type: "TRANSFER_FAILED",
      payload: { giftId, amountKobo: String(amountKobo) },
    },
  });
}
