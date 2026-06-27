import { Resend } from "resend";
import {
  welcomeTemplate,
  birthdayUnlockTemplate,
  birthdayReminderTemplate,
  reactionReceivedTemplate,
} from "./email-templates";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "BirthdayWhisper <noreply@birthdaywhisper.com>";

export async function sendWelcomeEmail(to: string, displayName: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to BirthdayWhisper 🎂",
    html: welcomeTemplate({ displayName }),
  });
}

export async function sendBirthdayUnlockEmail(to: string, displayName: string, messageCount: number) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `🎁 It's your birthday — ${messageCount} whisper${messageCount !== 1 ? "s" : ""} are waiting!`,
    html: birthdayUnlockTemplate({ displayName, messageCount }),
  });
}

export async function sendBirthdayReminderEmail(
  to: string,
  senderName: string,
  birthdayPersonName: string,
  daysUntil: number,
  profileUrl: string,
) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `🎂 ${birthdayPersonName}'s birthday is in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`,
    html: birthdayReminderTemplate({ senderName, birthdayPersonName, daysUntil, profileUrl }),
  });
}

export async function sendReactionReceivedEmail(
  to: string,
  senderName: string,
  recipientName: string,
  emoji: string,
) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `${recipientName} reacted ${emoji} to your birthday message`,
    html: reactionReceivedTemplate({ senderName, recipientName, emoji }),
  });
}
