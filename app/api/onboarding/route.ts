export const dynamic = "force-dynamic";

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";
import { daysUntilBirthday, getBirthdayYear } from "@/lib/utils";
import { getBaseUrl } from "@/lib/url";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clerkUser = await currentUser();
  const { displayName, birthdayMonth, birthdayDay, username } = await req.json();

  if (!displayName || !birthdayMonth || !birthdayDay || !username) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return NextResponse.json({ error: "Username taken" }, { status: 409 });

  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    update: { displayName, birthdayMonth, birthdayDay, username },
    create: {
      clerkId: userId,
      email: clerkUser?.emailAddresses[0]?.emailAddress ?? "",
      displayName,
      birthdayMonth,
      birthdayDay,
      username,
      avatarUrl: clerkUser?.imageUrl ?? null,
    },
  });

  // Fire-and-forget: welcome email + schedule birthday unlock
  const email = clerkUser?.emailAddresses[0]?.emailAddress;
  if (email) {
    sendWelcomeEmail(email, displayName).catch(() => null);

    // Schedule birthday unlock email for next birthday at midnight
    const days = daysUntilBirthday(birthdayMonth, birthdayDay);
    const sendAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    sendAt.setHours(0, 5, 0, 0); // 00:05 to avoid midnight race

    const pendingCount = await prisma.message
      .count({ where: { recipientId: user.id, status: "PENDING" } })
      .catch(() => 0);

    prisma.scheduledEmail.upsert({
      where: { id: `unlock_${user.id}_${getBirthdayYear(birthdayMonth, birthdayDay)}` },
      create: {
        id: `unlock_${user.id}_${getBirthdayYear(birthdayMonth, birthdayDay)}`,
        recipientEmail: email,
        type: "BIRTHDAY_UNLOCK",
        payload: { displayName, messageCount: pendingCount },
        sendAt,
      },
      update: { sendAt, payload: { displayName, messageCount: pendingCount } },
    }).catch(() => null);
  }

  return NextResponse.json({ user });
}
