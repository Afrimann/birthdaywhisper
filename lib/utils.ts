import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBirthdayYear(month: number, day: number): number {
  const today = new Date();
  const thisYear = today.getFullYear();
  const birthdayThisYear = new Date(thisYear, month - 1, day);
  return today <= birthdayThisYear ? thisYear : thisYear + 1;
}

export function isBirthdayToday(month: number, day: number): boolean {
  const today = new Date();
  return today.getMonth() + 1 === month && today.getDate() === day;
}

export function daysUntilBirthday(month: number, day: number): number {
  const today = new Date();
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
