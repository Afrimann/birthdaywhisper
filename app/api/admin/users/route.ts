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
  const username = searchParams.get("username")?.trim();
  if (!username || username.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const users = await prisma.user.findMany({
    where: { username: { contains: username, mode: "insensitive" } },
    take: 10,
    select: { id: true, username: true, displayName: true, birthdayMonth: true, birthdayDay: true },
  });

  return NextResponse.json({ users });
}
