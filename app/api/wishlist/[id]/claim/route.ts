export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Ctx { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Ctx) {
  const { id } = await params;

  const item = await prisma.wishlistItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (item.isPurchased) {
    return NextResponse.json({ error: "Already claimed" }, { status: 409 });
  }

  const updated = await prisma.wishlistItem.update({
    where: { id },
    data: { isPurchased: true },
  });

  return NextResponse.json({ item: updated });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;

  const item = await prisma.wishlistItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.wishlistItem.update({
    where: { id },
    data: { isPurchased: false },
  });

  return NextResponse.json({ item: updated });
}
