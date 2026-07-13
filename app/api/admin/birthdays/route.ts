export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isAdminUserId } from "@/lib/admin";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminUserId(userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get("month"));
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  }

  const users = await prisma.user.findMany({
    where: { birthdayMonth: month },
    select: {
      id: true,
      username: true,
      displayName: true,
      birthdayDay: true,
      gifts: { where: { status: "HELD" }, select: { amountKobo: true } },
    },
    orderBy: { birthdayDay: "asc" },
  });

  const rows = users
    .map((u) => ({
      username: u.username,
      displayName: u.displayName,
      birthdayDay: u.birthdayDay,
      heldCount: u.gifts.length,
      heldTotalKobo: u.gifts.reduce((sum, g) => sum + g.amountKobo, 0),
    }))
    .sort((a, b) => b.heldTotalKobo - a.heldTotalKobo);

  return NextResponse.json({
    month,
    totalUsers: rows.length,
    totalHeldKobo: rows.reduce((sum, r) => sum + r.heldTotalKobo, 0),
    rows,
  });
}
