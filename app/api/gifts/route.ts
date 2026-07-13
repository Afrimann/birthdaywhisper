export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { moderateContent } from "@/lib/moderation";
import { initializeTransaction, PaystackError } from "@/lib/paystack";
import { getBaseUrl } from "@/lib/url";
import { getBirthdayYear } from "@/lib/utils";
import { GIFT_AVATARS } from "@/lib/avatars";
import { MIN_GIFT_KOBO, MAX_GIFT_KOBO, calculatePlatformFeeKobo } from "@/lib/constants";
import { getFingerprintHash } from "@/lib/fingerprint";

const NOTE_MAX_CHARS = 300;
const NAME_MAX_CHARS = 40;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Looser than Message's guest=1 — this guards against DB-row spam from
// incomplete checkouts, not payment fraud (Paystack's own checkout is the
// real gate for that).
const RATE_LIMIT_AUTHED = 5;
const RATE_LIMIT_GUEST = 2;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { recipientId, senderName, senderEmail, avatarSeed, note, amountKobo } =
    body as Record<string, unknown>;

  // ── Validate ──────────────────────────────────────────────────────────────
  if (!recipientId || typeof recipientId !== "string") {
    return NextResponse.json({ error: "Missing recipientId" }, { status: 400 });
  }

  if (typeof amountKobo !== "number" || !Number.isInteger(amountKobo)) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  if (amountKobo < MIN_GIFT_KOBO || amountKobo > MAX_GIFT_KOBO) {
    return NextResponse.json({ error: "Amount out of allowed range" }, { status: 400 });
  }

  const avatar = GIFT_AVATARS.find((a) => a.seed === avatarSeed);
  if (!avatar) {
    return NextResponse.json({ error: "Invalid avatar selection" }, { status: 400 });
  }

  if (typeof senderEmail !== "string" || !EMAIL_RE.test(senderEmail)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  if (senderName !== undefined && senderName !== null) {
    if (typeof senderName !== "string" || senderName.length > NAME_MAX_CHARS) {
      return NextResponse.json({ error: "Name is too long" }, { status: 400 });
    }
  }

  if (note !== undefined && note !== null) {
    if (typeof note !== "string" || note.length > NOTE_MAX_CHARS) {
      return NextResponse.json({ error: "Note is too long" }, { status: 400 });
    }
    if (note.trim() && (await moderateContent(note))) {
      return NextResponse.json({ error: "Note contains inappropriate content" }, { status: 422 });
    }
  }

  // ── Verify recipient exists ───────────────────────────────────────────────
  const recipient = await prisma.user
    .findUnique({
      where: { id: recipientId },
      select: { id: true, birthdayMonth: true, birthdayDay: true, timezone: true },
    })
    .catch(() => null);

  if (!recipient) {
    return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
  }

  // ── Rate limit via SenderSession (separate columns from Message's, so
  // the two features' limits can't silently interfere with each other) ──
  const { userId } = await auth();
  const isSignedIn = !!userId;
  const fingerprintHash = getFingerprintHash(req);

  const session = await prisma.senderSession
    .findUnique({ where: { fingerprintHash_recipientId: { fingerprintHash, recipientId } } })
    .catch(() => null);

  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_WINDOW_MS);
  const effectiveLimit = isSignedIn ? RATE_LIMIT_AUTHED : RATE_LIMIT_GUEST;

  if (session && session.giftCount >= effectiveLimit && session.giftLastSentAt && session.giftLastSentAt > windowStart) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const newGiftCount =
    session && session.giftLastSentAt && session.giftLastSentAt > windowStart ? session.giftCount + 1 : 1;

  // ── Create gift + initialize payment ─────────────────────────────────────
  const platformFeeKobo = calculatePlatformFeeKobo(amountKobo);

  const gift = await prisma.gift.create({
    data: {
      recipientId,
      senderName: typeof senderName === "string" ? senderName.trim() || null : null,
      senderEmail,
      avatarSeed: avatar.seed,
      avatarGender: avatar.gender,
      amountKobo,
      platformFeeKobo,
      note: typeof note === "string" ? note.trim() || null : null,
      birthdayYear: getBirthdayYear(recipient.birthdayMonth, recipient.birthdayDay, recipient.timezone),
      paystackReference: randomUUID(),
    },
  });

  // Counts against the limit even if the downstream Paystack call below
  // fails — it already consumed a DB row and an API call, which is exactly
  // what this guard exists to bound.
  await prisma.senderSession.upsert({
    where: { fingerprintHash_recipientId: { fingerprintHash, recipientId } },
    create: { fingerprintHash, recipientId, giftCount: 1, giftLastSentAt: now },
    update: { giftCount: newGiftCount, giftLastSentAt: now },
  });

  try {
    const { authorization_url } = await initializeTransaction({
      email: senderEmail,
      amountKobo: amountKobo + platformFeeKobo,
      reference: gift.paystackReference,
      callback_url: `${getBaseUrl()}/gift/callback`,
      metadata: { giftId: gift.id, recipientId },
    });

    return NextResponse.json({ authorizationUrl: authorization_url }, { status: 201 });
  } catch (err) {
    await prisma.gift.update({
      where: { id: gift.id },
      data: { status: "FAILED", failureReason: err instanceof PaystackError ? err.message : "Payment initialization failed" },
    });
    return NextResponse.json({ error: "Could not start payment" }, { status: 502 });
  }
}
