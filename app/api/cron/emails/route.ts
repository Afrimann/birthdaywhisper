export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendBirthdayUnlockEmail,
  sendBirthdayReminderEmail,
} from "@/lib/email";

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const due = await prisma.scheduledEmail.findMany({
    where: { sentAt: null, failed: false, sendAt: { lte: now } },
    take: 50,
  });

  const results = await Promise.allSettled(
    due.map(async (email) => {
      try {
        const p = email.payload as Record<string, unknown>;

        // recipientEmail is always the preference-holder's own address for
        // both types below (the birthday person for UNLOCK, the follower who
        // asked to be reminded for REMINDER_SENDER) — so their own toggle is
        // the one that applies. No row / no account deleted → default to on.
        const recipient = await prisma.user.findUnique({
          where:  { email: email.recipientEmail },
          select: { notifPrefs: { select: { emailOnBirthdayUnlock: true, emailReminders: true } } },
        });

        if (email.type === "BIRTHDAY_UNLOCK") {
          if (recipient?.notifPrefs?.emailOnBirthdayUnlock !== false) {
            await sendBirthdayUnlockEmail(
              email.recipientEmail,
              String(p.displayName),
              Number(p.messageCount ?? 0),
            );
          }
        }

        if (email.type === "BIRTHDAY_REMINDER_SENDER") {
          if (recipient?.notifPrefs?.emailReminders !== false) {
            await sendBirthdayReminderEmail(
              email.recipientEmail,
              String(p.senderName),
              String(p.birthdayPersonName),
              Number(p.daysUntil),
              String(p.profileUrl),
            );
          }
        }

        await prisma.scheduledEmail.update({
          where: { id: email.id },
          data: { sentAt: new Date() },
        });
      } catch {
        await prisma.scheduledEmail.update({
          where: { id: email.id },
          data: { failed: true },
        });
      }
    }),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ processed: due.length, sent });
}
