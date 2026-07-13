export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isAdminUserId } from "@/lib/admin";

const PAGE_SIZE = 25;
const VALID_STATUSES = ["PENDING_PAYMENT", "HELD", "DISBURSED", "FAILED", "EXPIRED"];

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminUserId(userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const disputedOnly = searchParams.get("disputed") === "true";
  const recipient = searchParams.get("recipient")?.trim();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const where: Record<string, unknown> = {};
  if (status && VALID_STATUSES.includes(status)) where.status = status;
  if (disputedOnly) where.isDisputed = true;
  if (recipient) {
    where.recipient = {
      OR: [
        { username: { contains: recipient, mode: "insensitive" } },
        { displayName: { contains: recipient, mode: "insensitive" } },
      ],
    };
  }

  const [gifts, total] = await Promise.all([
    prisma.gift.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        senderName: true,
        senderEmail: true,
        amountKobo: true,
        status: true,
        isDisputed: true,
        failureReason: true,
        createdAt: true,
        paidAt: true,
        disbursedAt: true,
        recipient: { select: { username: true, displayName: true } },
      },
    }),
    prisma.gift.count({ where }),
  ]);

  return NextResponse.json({ gifts, total, page, pageSize: PAGE_SIZE });
}
