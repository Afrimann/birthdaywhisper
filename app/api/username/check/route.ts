export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username || !/^[a-z0-9_]{3,30}$/.test(username)) {
    return NextResponse.json({ available: false });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  return NextResponse.json({ available: !existing });
}
