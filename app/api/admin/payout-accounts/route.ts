export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isAdminUserId } from "@/lib/admin";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminUserId(userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const accounts = await prisma.payoutAccount.findMany({
    where: { verificationStatus: "PENDING_REVIEW" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      bankName: true,
      accountNumber: true,
      accountName: true,
      nameMatchStrength: true,
      createdAt: true,
      user: { select: { id: true, username: true, displayName: true } },
    },
  });

  return NextResponse.json({ accounts });
}
