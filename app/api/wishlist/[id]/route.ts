export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const existing = await prisma.wishlistItem.findUnique({ where: { id } });
  if (!existing || existing.userId !== dbUser.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, description, url, priceRange, sortOrder } = body as Record<string, unknown>;

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (title.trim().length > 120) {
      return NextResponse.json({ error: "Title too long" }, { status: 400 });
    }
  }

  const item = await prisma.wishlistItem.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: (title as string).trim() }),
      ...(description !== undefined && { description: typeof description === "string" ? description.trim() || null : null }),
      ...(url !== undefined && { url: typeof url === "string" ? url.trim() || null : null }),
      ...(priceRange !== undefined && { priceRange: typeof priceRange === "string" ? priceRange.trim() || null : null }),
      ...(sortOrder !== undefined && typeof sortOrder === "number" && { sortOrder }),
    },
  });

  return NextResponse.json({ item });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const existing = await prisma.wishlistItem.findUnique({ where: { id } });
  if (!existing || existing.userId !== dbUser.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.wishlistItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
