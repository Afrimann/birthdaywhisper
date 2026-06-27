export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendBirthdayUnlockEmail,
  sendBirthdayReminderEmail,
} from "@/lib/email";
import { getBaseUrl } from "@/lib/url";

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

        if (email.type === "BIRTHDAY_UNLOCK") {
          await sendBirthdayUnlockEmail(
            email.recipientEmail,
            String(p.displayName),
            Number(p.messageCount ?? 0),
          );
        }

        if (email.type === "BIRTHDAY_REMINDER_SENDER") {
          await sendBirthdayReminderEmail(
            email.recipientEmail,
            String(p.senderName),
            String(p.birthdayPersonName),
            Number(p.daysUntil),
            String(p.profileUrl),
          );
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
