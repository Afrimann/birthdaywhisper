export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const message = await prisma.message.findUnique({
    where:  { id },
    select: { id: true, recipientId: true },
  });
  if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });
  if (message.recipientId !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.message.update({
    where: { id },
    data:  { status: "REVEALED", revealedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
