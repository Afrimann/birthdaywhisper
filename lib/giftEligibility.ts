/**
 * Recipient's current local calendar date as YYYY-MM-DD (lexicographically
 * comparable). Falls back to server-local time for an unrecognized zone —
 * this only ever receives a browser-supplied `Intl` zone string in
 * practice, but this is a money-moving path, so it defends anyway.
 */
export function localDateString(now: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  }
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * A gift becomes eligible for disbursement once the recipient's local date
 * has reached (or passed) the birthday in the gift's own `birthdayYear`.
 * This single predicate, re-evaluated hourly, correctly handles both
 * first-time disbursement (fires within ~1h of the recipient's actual
 * local midnight, not the server's) and retries (a failed transfer nulls
 * paystackTransferCode, making the gift eligible again on the very next run).
 */
export function giftIsLocallyEligible(
  gift: { birthdayYear: number },
  recipient: { birthdayMonth: number; birthdayDay: number; timezone: string },
  now: Date = new Date(),
): boolean {
  const today = localDateString(now, recipient.timezone);
  const birthday = `${gift.birthdayYear}-${pad(recipient.birthdayMonth)}-${pad(recipient.birthdayDay)}`;
  return today >= birthday;
}
