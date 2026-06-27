export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { daysUntilBirthday } from "@/lib/utils";
import { getBaseUrl } from "@/lib/url";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = await params;

  const [follower, followed] = await Promise.all([
    prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true, displayName: true, email: true } }),
    prisma.user.findUnique({ where: { username }, select: { id: true, displayName: true, username: true, birthdayMonth: true, birthdayDay: true } }),
  ]);

  if (!follower) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!followed) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  if (follower.id === followed.id) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  const existing = await prisma.birthdayFollow.findUnique({
    where: { followerId_followedId: { followerId: follower.id, followedId: followed.id } },
  });
  if (existing) return NextResponse.json({ following: true });

  await prisma.birthdayFollow.create({
    data: { followerId: follower.id, followedId: followed.id },
  });

  // Schedule reminder email 3 days before next birthday
  const days = daysUntilBirthday(followed.birthdayMonth, followed.birthdayDay);
  const reminderDays = days - 3;
  if (reminderDays > 0) {
    const sendAt = new Date(Date.now() + reminderDays * 24 * 60 * 60 * 1000);
    await prisma.scheduledEmail.create({
      data: {
        recipientEmail: follower.email,
        type: "BIRTHDAY_REMINDER_SENDER",
        payload: {
          senderName: follower.displayName,
          birthdayPersonName: followed.displayName,
          daysUntil: 3,
          profileUrl: `${getBaseUrl()}/b/${followed.username}`,
        },
        sendAt,
      },
    });
  }

  return NextResponse.json({ following: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = await params;

  const [follower, followed] = await Promise.all([
    prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } }),
    prisma.user.findUnique({ where: { username }, select: { id: true } }),
  ]);

  if (!follower || !followed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.birthdayFollow.deleteMany({
    where: { followerId: follower.id, followedId: followed.id },
  });

  return NextResponse.json({ following: false });
}
