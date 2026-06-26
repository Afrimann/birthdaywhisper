import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getBirthdayYear,
  isBirthdayToday,
  daysUntilBirthday,
  formatBirthday,
} from "@/lib/utils";

// Use fake timers so Date() is controlled in tests
beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

// Helper: set today to a local-midnight date (avoids UTC vs local skew)
function setToday(year: number, month: number, day: number) {
  vi.setSystemTime(new Date(year, month - 1, day, 0, 0, 0, 0));
}

// ─────────────────────────────────────────────────────────────
// Acceptance criteria (F-05, F-06):
//   - getBirthdayYear returns the correct upcoming year
//   - isBirthdayToday correctly detects the birthday
//   - daysUntilBirthday returns 0 on the day, positive before it
//   - formatBirthday returns a human-readable string
// ─────────────────────────────────────────────────────────────

describe("getBirthdayYear", () => {
  it("returns this year when birthday is upcoming", () => {
    setToday(2026, 6, 1);
    expect(getBirthdayYear(8, 15)).toBe(2026);
  });

  it("returns next year when birthday already passed", () => {
    setToday(2026, 6, 1);
    expect(getBirthdayYear(3, 10)).toBe(2027);
  });

  it("returns this year when birthday is today", () => {
    setToday(2026, 6, 15);
    expect(getBirthdayYear(6, 15)).toBe(2026);
  });
});

describe("isBirthdayToday", () => {
  beforeEach(() => { setToday(2026, 6, 27); });

  it("returns true when month and day match today", () => {
    expect(isBirthdayToday(6, 27)).toBe(true);
  });

  it("returns false when month does not match", () => {
    expect(isBirthdayToday(7, 27)).toBe(false);
  });

  it("returns false when day does not match", () => {
    expect(isBirthdayToday(6, 28)).toBe(false);
  });

  it("returns false when neither match", () => {
    expect(isBirthdayToday(12, 25)).toBe(false);
  });
});

describe("daysUntilBirthday", () => {
  beforeEach(() => { setToday(2026, 6, 27); });

  it("returns 0 when birthday is today", () => {
    expect(daysUntilBirthday(6, 27)).toBe(0);
  });

  it("returns 7 when birthday is exactly one week away", () => {
    expect(daysUntilBirthday(7, 4)).toBe(7);
  });

  it("returns positive days when birthday already passed this year (wraps to next year)", () => {
    const result = daysUntilBirthday(3, 1);
    expect(result).toBeGreaterThan(200);
    expect(result).toBeLessThan(270);
  });
});

describe("formatBirthday", () => {
  it("formats month and day as a human-readable string", () => {
    expect(formatBirthday(6, 27)).toBe("June 27");
    expect(formatBirthday(12, 25)).toBe("December 25");
    expect(formatBirthday(1, 1)).toBe("January 1");
    expect(formatBirthday(2, 14)).toBe("February 14");
  });
});
