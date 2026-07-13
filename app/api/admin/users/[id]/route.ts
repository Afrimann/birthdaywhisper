export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isAdminUserId } from "@/lib/admin";

interface Ctx {
  params: Promise<{ id: string }>;
}

// This intentionally bypasses the birthday-immutability check in
// app/api/settings/route.ts — it IS the "contact support" mechanism that
// check's own error message points users to.
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

  const { birthdayMonth, birthdayDay } = body as Record<string, unknown>;
  const month = Number(birthdayMonth);
  const day = Number(birthdayDay);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid birthday month." }, { status: 400 });
  }
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return NextResponse.json({ error: "Invalid birthday day." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prisma.user.update({
    where: { id },
    data: { birthdayMonth: month, birthdayDay: day },
  });

  return NextResponse.json({ success: true });
}
