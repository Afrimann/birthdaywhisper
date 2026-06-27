const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://birthdaywhisper.com";

const wrapper = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; padding: 0; background: #0B0B0D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
    .card { background: rgba(22,21,25,0.95); border: 1px solid rgba(242,193,78,0.15); border-radius: 20px; padding: 40px; }
    .logo { display: flex; align-items: center; gap: 8px; margin-bottom: 32px; }
    .logo-icon { font-size: 20px; }
    .logo-text { color: #F4F1EA; font-size: 18px; font-weight: 700; letter-spacing: -0.5px; }
    .cta { display: inline-block; background: #F2C14E; color: #0B0B0D; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 12px; text-decoration: none; margin: 24px 0; }
    .footer { text-align: center; color: #555; font-size: 12px; margin-top: 32px; }
    h1 { color: #F4F1EA; font-size: 24px; font-weight: 700; margin: 0 0 12px; }
    p { color: #8B8B90; font-size: 15px; line-height: 1.6; margin: 8px 0; }
    .gold { color: #F2C14E; }
    .divider { border: none; border-top: 1px solid rgba(242,193,78,0.1); margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <span class="logo-icon">🎂</span>
        <span class="logo-text">BirthdayWhisper</span>
      </div>
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} BirthdayWhisper. All rights reserved.</p>
      <p>You're receiving this because you have a BirthdayWhisper account.</p>
    </div>
  </div>
</body>
</html>`;

export function welcomeTemplate({ displayName }: { displayName: string }) {
  return wrapper(`
    <h1>Welcome, ${displayName}! 🎉</h1>
    <p>Your birthday page is live. Share your link and start collecting secret messages from the people who matter most.</p>
    <hr class="divider" />
    <p>Here's what happens next:</p>
    <p>🔗 <strong style="color:#F4F1EA">Share your birthday link</strong> — friends send you messages sealed until your birthday</p>
    <p>🔒 <strong style="color:#F4F1EA">Watch the count grow</strong> — you'll see how many whispers are waiting, but not what's inside</p>
    <p>🎁 <strong style="color:#F4F1EA">Unlock on your birthday</strong> — flip each card and read every message</p>
    <div style="text-align:center">
      <a href="${BASE_URL}/dashboard" class="cta">Go to your Dashboard →</a>
    </div>
  `);
}

export function birthdayUnlockTemplate({ displayName, messageCount }: { displayName: string; messageCount: number }) {
  return wrapper(`
    <h1>Happy Birthday, ${displayName}! 🎂</h1>
    <p>The wait is over. <span class="gold">${messageCount} birthday whisper${messageCount !== 1 ? "s" : ""}</span> ${messageCount === 1 ? "is" : "are"} sealed and ready for you.</p>
    <p>Each message was written just for you — click a card to reveal it.</p>
    <div style="text-align:center">
      <a href="${BASE_URL}/reveal" class="cta">Open My Whispers 🎁</a>
    </div>
    <hr class="divider" />
    <p style="font-size:13px;text-align:center">Messages unlock once and stay in your Memory Jar forever.</p>
  `);
}

export function birthdayReminderTemplate({
  senderName,
  birthdayPersonName,
  daysUntil,
  profileUrl,
}: {
  senderName: string;
  birthdayPersonName: string;
  daysUntil: number;
  profileUrl: string;
}) {
  return wrapper(`
    <h1>${birthdayPersonName}'s birthday is in <span class="gold">${daysUntil} day${daysUntil !== 1 ? "s" : ""}</span></h1>
    <p>Hey ${senderName}, don't forget to leave ${birthdayPersonName} a birthday whisper before it's too late.</p>
    <p>Your message will be sealed until their birthday — they won't see a thing until midnight.</p>
    <div style="text-align:center">
      <a href="${profileUrl}" class="cta">Send a Whisper 💌</a>
    </div>
  `);
}

export function reactionReceivedTemplate({
  senderName,
  recipientName,
  emoji,
}: {
  senderName: string;
  recipientName: string;
  emoji: string;
}) {
  return wrapper(`
    <h1>${recipientName} reacted to your message <span class="gold">${emoji}</span></h1>
    <p>Hey ${senderName}, your birthday whisper made an impression! ${recipientName} read your message and reacted with ${emoji}.</p>
    <div style="text-align:center">
      <a href="${BASE_URL}/dashboard" class="cta">View your Dashboard</a>
    </div>
  `);
}
