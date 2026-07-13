export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isAdminUserId } from "@/lib/admin";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminUserId(userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action } = body as Record<string, unknown>;
  if (action !== "clear-dispute") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const gift = await prisma.gift.findUnique({ where: { id }, select: { id: true } });
  if (!gift) return NextResponse.json({ error: "Gift not found" }, { status: 404 });

  await prisma.gift.update({
    where: { id },
    data: { isDisputed: false },
  });

  return NextResponse.json({ success: true });
}
