export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { containsProfanity } from "@/lib/profanity";

const MAX_CHARS = 500;
const RATE_LIMIT_AUTHED = 5;
const RATE_LIMIT_GUEST  = 1;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { recipientId, content, isAnonymous, senderName, birthdayYear, cardTheme } =
    body as Record<string, unknown>;

  // ── Validate ──────────────────────────────────────────────────────────────
  if (!recipientId || typeof recipientId !== "string") {
    return NextResponse.json({ error: "Missing recipientId" }, { status: 400 });
  }

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
  }

  if (content.length > MAX_CHARS) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  if (containsProfanity(content)) {
    return NextResponse.json({ error: "Message contains inappropriate content" }, { status: 422 });
  }

  if (!birthdayYear || typeof birthdayYear !== "number") {
    return NextResponse.json({ error: "Missing birthdayYear" }, { status: 400 });
  }

  // ── Verify recipient exists ───────────────────────────────────────────────
  const recipient = await prisma.user
    .findUnique({ where: { id: recipientId }, select: { id: true } })
    .catch(() => null);

  if (!recipient) {
    return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
  }

  // ── Rate limit via SenderSession ──────────────────────────────────────────
  const { userId } = await auth();
  const isSignedIn = !!userId;

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const fingerprintHash = createHash("sha256").update(ip).digest("hex");

  const session = await prisma.senderSession
    .findUnique({
      where: { fingerprintHash_recipientId: { fingerprintHash, recipientId } },
    })
    .catch(() => null);

  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_WINDOW_MS);
  const effectiveLimit = isSignedIn ? RATE_LIMIT_AUTHED : RATE_LIMIT_GUEST;

  if (session && session.messageCount >= effectiveLimit && session.lastSentAt > windowStart) {
    return NextResponse.json(
      { error: "Rate limit exceeded", needsAccount: !isSignedIn },
      { status: 429 }
    );
  }

  // ── Persist message + update session ─────────────────────────────────────
  const newCount =
    session && session.lastSentAt > windowStart ? session.messageCount + 1 : 1;

  await prisma.message.create({
    data: {
      recipientId,
      content: content.trim(),
      isAnonymous: isAnonymous !== false,
      senderName: isAnonymous !== false ? null : (typeof senderName === "string" ? senderName.trim() || null : null),
      birthdayYear,
      status: "PENDING",
      cardTheme: (["CLASSIC","GOLDEN_HOUR","MIDNIGHT_STARS","BLOOM","RETRO","NEON"].includes(String(cardTheme))
        ? String(cardTheme) : "CLASSIC") as "CLASSIC" | "GOLDEN_HOUR" | "MIDNIGHT_STARS" | "BLOOM" | "RETRO" | "NEON",
    },
  });

  await prisma.senderSession.upsert({
    where: { fingerprintHash_recipientId: { fingerprintHash, recipientId } },
    create: { fingerprintHash, recipientId, messageCount: 1, lastSentAt: now },
    update: { messageCount: newCount, lastSentAt: now },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
