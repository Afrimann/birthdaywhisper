export const dynamic = "force-dynamic";

import Link from "next/link";
import { Check, X, Gift as GiftIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifyTransaction } from "@/lib/paystack";

interface Props {
  searchParams: Promise<{ reference?: string }>;
}

export default async function GiftCallbackPage({ searchParams }: Props) {
  const { reference } = await searchParams;

  // The webhook (app/api/webhooks/paystack/route.ts) is the primary path —
  // it doesn't depend on the buyer's browser making it back here. But
  // webhooks can't reach a local dev server at all, and even in production
  // can be delayed, so this page double-checks with Paystack's own verify
  // API (never trusts the redirect/query-string alone) and does the same
  // PENDING_PAYMENT → HELD transition as a fallback if the webhook hasn't
  // landed yet. Idempotent, so it's harmless if the webhook fires first.
  let success = false;
  let recipient: { username: string; displayName: string } | null = null;

  if (reference) {
    const gift = await prisma.gift
      .findUnique({
        where: { paystackReference: reference },
        select: { id: true, status: true, recipient: { select: { username: true, displayName: true } } },
      })
      .catch(() => null);
    recipient = gift?.recipient ?? null;

    try {
      const result = await verifyTransaction(reference);
      success = result.status === "success";
    } catch {
      success = false;
    }

    if (success && gift && gift.status === "PENDING_PAYMENT") {
      await prisma.gift.update({
        where: { id: gift.id },
        data: { status: "HELD", paidAt: new Date() },
      });
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-[rgba(212,83,126,0.12)] border border-[rgba(212,83,126,0.28)] flex items-center justify-center mx-auto mb-6">
        {success ? (
          <Check className="w-8 h-8 text-accent-500" />
        ) : (
          <X className="w-8 h-8 text-accent-500" />
        )}
      </div>

      {success ? (
        <>
          <h1 className="font-fraunces text-2xl font-bold text-accent-900 mb-2">
            Gift sent!
          </h1>
          <p className="text-accent-700 text-sm mb-8 max-w-sm">
            {recipient
              ? `Your gift is sealed with ${recipient.displayName.split(" ")[0]}'s whispers, ready to open on their birthday.`
              : "Your gift is sealed, ready to open on their birthday."}
          </p>
        </>
      ) : (
        <>
          <h1 className="font-fraunces text-2xl font-bold text-accent-900 mb-2">
            Payment didn&apos;t complete
          </h1>
          <p className="text-accent-700 text-sm mb-8 max-w-sm">
            Your card wasn&apos;t charged. You can try again from their birthday page.
          </p>
        </>
      )}

      {recipient && (
        <Link
          href={`/b/${recipient.username}`}
          className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-canvas font-semibold px-6 py-3 rounded-xl transition-all min-h-[44px]"
        >
          <GiftIcon className="w-4 h-4" />
          Back to {recipient.displayName.split(" ")[0]}&apos;s page
        </Link>
      )}
    </div>
  );
}
