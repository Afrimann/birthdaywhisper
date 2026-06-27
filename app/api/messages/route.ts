export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

const MAX_CHARS = 500;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { recipientId, content, isAnonymous, senderName, birthdayYear } =
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

  if (session && session.messageCount >= RATE_LIMIT && session.lastSentAt > windowStart) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
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
      cardTheme: "CLASSIC",
    },
  });

  await prisma.senderSession.upsert({
    where: { fingerprintHash_recipientId: { fingerprintHash, recipientId } },
    create: { fingerprintHash, recipientId, messageCount: 1, lastSentAt: now },
    update: { messageCount: newCount, lastSentAt: now },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
