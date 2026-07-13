import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function todayMidnight(timezone?: string): Date {
  if (timezone) {
    try {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
      const [y, m, d] = parts.split("-").map(Number);
      return new Date(y, m - 1, d);
    } catch {
      // Malformed/unrecognized zone — fall through to server-local below.
    }
  }
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

// Optional timezone makes the target-year computation correct for recipients
// near the Dec 31/Jan 1 UTC boundary (extreme zones could otherwise land on
// the wrong year relative to their actual local "today").
export function getBirthdayYear(month: number, day: number, timezone?: string): number {
  const today = todayMidnight(timezone);
  const thisYear = today.getFullYear();
  const birthdayThisYear = new Date(thisYear, month - 1, day);
  return today <= birthdayThisYear ? thisYear : thisYear + 1;
}

export function isBirthdayToday(month: number, day: number): boolean {
  const today = new Date();
  return today.getMonth() + 1 === month && today.getDate() === day;
}

export function daysUntilBirthday(month: number, day: number): number {
  const today = todayMidnight();
  const thisYear = today.getFullYear();
  let birthday = new Date(thisYear, month - 1, day);
  if (birthday < today) {
    birthday = new Date(thisYear + 1, month - 1, day);
  }
  const diff = birthday.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatBirthday(month: number, day: number): string {
  const date = new Date(2000, month - 1, day);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

// Explicit locale, not the viewer's browser locale — this app is Naira-only
// today, and an unspecified locale would format the same amount with
// different grouping/decimal separators depending on where the viewer's
// browser thinks it is (confusing next to a fixed ₦ symbol).
export function koboToNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}
