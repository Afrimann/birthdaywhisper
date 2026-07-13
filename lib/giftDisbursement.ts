import { prisma } from "@/lib/prisma";
import { initiateTransfer, PaystackError } from "@/lib/paystack";

// Written before the Paystack call to atomically "claim" a gift for
// disbursement. The `paystackTransferCode: null` condition in the WHERE
// clause makes the claiming updateMany a single-row compare-and-swap, so
// two concurrent callers (e.g. a user double-clicking withdraw, or two
// browser tabs) can't both initiate a transfer for the same gift.
const CLAIM_MARKER = "CLAIMING";

// Paystack test-mode businesses can't initiate third-party transfers at all
// (rejected with "You cannot initiate third party payouts as a starter
// business" regardless of recipient/account) — that's a business
// verification requirement, not something a test key can ever satisfy. Live
// keys always start with sk_live_, so this can never fire in production;
// gating on the key prefix rather than NODE_ENV also means a Vercel preview
// deploy pointed at a live key still exercises the real transfer path.
const isTestKey = (process.env.PAYSTACK_SECRET_KEY ?? "").startsWith("sk_test_");

/**
 * Initiates a Paystack transfer for a single HELD gift. Callers are
 * responsible for confirming the gift is eligible (owner + birthday arrived)
 * before calling this — it only guards against double-disbursement of the
 * same gift, not eligibility.
 */
export async function disburseGift(
  giftId: string,
  amountKobo: number,
  recipientCode: string,
): Promise<"disbursed" | "already-claimed"> {
  const claim = await prisma.gift.updateMany({
    where: { id: giftId, status: "HELD", paystackTransferCode: null },
    data: { paystackTransferCode: CLAIM_MARKER },
  });
  if (claim.count === 0) return "already-claimed";

  if (isTestKey) {
    // No real transfer is possible in test mode, and no transfer.success
    // webhook will ever arrive for a fake code — so simulate the whole
    // lifecycle (normally: claim → transfer in flight → webhook → DISBURSED)
    // in one step instead of leaving the gift stuck "in flight" forever.
    console.log(`[dev] Paystack test key detected — simulating disbursement for gift ${giftId} instead of calling Paystack.`);
    await prisma.gift.update({
      where: { id: giftId },
      data: { paystackTransferCode: `TEST_${giftId}`, status: "DISBURSED", disbursedAt: new Date() },
    });
    return "disbursed";
  }

  try {
    const { transfer_code } = await initiateTransfer({
      amountKobo,
      recipientCode,
      reason: "BirthdayWhisper gift",
      // Timestamp suffix so a retry after a prior transfer.failed doesn't
      // collide with Paystack's reference-uniqueness requirement.
      reference: `payout_${giftId}_${Date.now()}`,
    });
    // Final DISBURSED status only ever comes from the transfer.success
    // webhook — this just records that a transfer is now in flight.
    await prisma.gift.update({
      where: { id: giftId },
      data: { paystackTransferCode: transfer_code },
    });
    return "disbursed";
  } catch (err) {
    const message = err instanceof PaystackError ? err.message : "Transfer initiation failed";
    await prisma.gift.update({
      where: { id: giftId },
      data: { paystackTransferCode: null, failureReason: message },
    });
    throw err;
  }
}
