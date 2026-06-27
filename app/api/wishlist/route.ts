export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, showWishlist: true },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const items = await prisma.wishlistItem.findMany({
    where: { userId: dbUser.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ items, showWishlist: dbUser.showWishlist });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, description, url, priceRange } = body as Record<string, unknown>;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (title.trim().length > 120) {
    return NextResponse.json({ error: "Title too long (max 120 chars)" }, { status: 400 });
  }

  const count = await prisma.wishlistItem.count({ where: { userId: dbUser.id } });
  if (count >= 20) {
    return NextResponse.json({ error: "Wishlist limit reached (20 items)" }, { status: 400 });
  }

  const item = await prisma.wishlistItem.create({
    data: {
      userId: dbUser.id,
      title: title.trim(),
      description: typeof description === "string" ? description.trim() || null : null,
      url: typeof url === "string" ? url.trim() || null : null,
      priceRange: typeof priceRange === "string" ? priceRange.trim() || null : null,
      sortOrder: count,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { showWishlist } = body as Record<string, unknown>;
  if (typeof showWishlist !== "boolean") {
    return NextResponse.json({ error: "showWishlist must be boolean" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: dbUser.id },
    data: { showWishlist },
  });

  return NextResponse.json({ showWishlist });
}
