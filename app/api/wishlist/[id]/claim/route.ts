export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFingerprintHash } from "@/lib/fingerprint";

interface Ctx { params: Promise<{ id: string }> }

// Claiming is deliberately anonymous/no-login, like a gift registry — but
// undoing a claim is gated to the same browser that made it (see
// claimedByFingerprint on the schema), so a stranger who just sees an
// already-claimed item can't grief someone else's claim and cause a
// duplicate purchase.
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;

  const item = await prisma.wishlistItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (item.isPurchased) {
    return NextResponse.json({ error: "Already claimed" }, { status: 409 });
  }

  const updated = await prisma.wishlistItem.update({
    where: { id },
    data: { isPurchased: true, claimedByFingerprint: getFingerprintHash(req) },
  });

  return NextResponse.json({ item: updated });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;

  const item = await prisma.wishlistItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Legacy/never-claimed rows have no fingerprint on file — permissive
  // fallback so old data isn't permanently stuck claimed. Once a
  // fingerprint is on record, only that same browser can undo it.
  if (item.claimedByFingerprint && item.claimedByFingerprint !== getFingerprintHash(req)) {
    return NextResponse.json({ error: "Only the person who claimed this can undo it" }, { status: 403 });
  }

  const updated = await prisma.wishlistItem.update({
    where: { id },
    data: { isPurchased: false, claimedByFingerprint: null },
  });

  return NextResponse.json({ item: updated });
}
