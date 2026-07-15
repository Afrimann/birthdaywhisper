export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// The actual upload happens client-side via Clerk's user.setProfileImage()
// (Clerk hosts the file) — this route only persists the resulting URL onto
// our own User row, so server-rendered pages (the public profile, etc.)
// don't need a live Clerk API call just to show an avatar.
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { avatarUrl } = body as Record<string, unknown>;

  if (avatarUrl !== null && typeof avatarUrl !== "string") {
    return NextResponse.json({ error: "Invalid avatarUrl" }, { status: 400 });
  }
  if (typeof avatarUrl === "string") {
    try { new URL(avatarUrl); }
    catch { return NextResponse.json({ error: "Invalid avatarUrl" }, { status: 400 }); }
  }

  const user = await prisma.user.update({
    where: { clerkId: userId },
    data:  { avatarUrl },
  }).catch(() => null);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ avatarUrl: user.avatarUrl });
}
