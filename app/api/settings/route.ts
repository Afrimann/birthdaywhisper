export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const USERNAME_RE = /^[a-z0-9_]{3,30}$/;

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { displayName, birthdayMonth, birthdayDay, username } = body as Record<string, unknown>;

  if (typeof displayName !== "string" || displayName.trim().length < 2) {
    return NextResponse.json({ error: "Display name must be at least 2 characters." }, { status: 400 });
  }
  if (typeof username !== "string" || !USERNAME_RE.test(username)) {
    return NextResponse.json({ error: "Username must be 3–30 lowercase letters, numbers, or underscores." }, { status: 400 });
  }
  const month = Number(birthdayMonth);
  const day   = Number(birthdayDay);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid birthday month." }, { status: 400 });
  }
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return NextResponse.json({ error: "Invalid birthday day." }, { status: 400 });
  }

  // Find current user
  const currentUser = await prisma.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true, username: true },
  });
  if (!currentUser) return NextResponse.json({ error: "User not found." }, { status: 404 });

  // Username uniqueness check (exclude self)
  if (username !== currentUser.username) {
    const conflict = await prisma.user.findUnique({
      where:  { username },
      select: { id: true },
    });
    if (conflict && conflict.id !== currentUser.id) {
      return NextResponse.json({ error: "Username is already taken." }, { status: 409 });
    }
  }

  await prisma.user.update({
    where: { id: currentUser.id },
    data: {
      displayName:   displayName.trim(),
      birthdayMonth: month,
      birthdayDay:   day,
      username,
    },
  });

  return NextResponse.json({ success: true });
}
