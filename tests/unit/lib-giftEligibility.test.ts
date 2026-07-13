import { describe, it, expect } from "vitest";
import { localDateString, giftIsLocallyEligible } from "@/lib/giftEligibility";

// ─────────────────────────────────────────────────────────────
// Acceptance criteria (gift disbursement eligibility — pure functions):
//   AC-1: localDateString formats a known UTC instant as YYYY-MM-DD
//   AC-2: localDateString falls back to UTC for an invalid zone string
//   AC-3: localDateString reflects a non-UTC zone's offset correctly
//   AC-4: A gift becomes eligible exactly on the recipient's local birthday date
//   AC-5: A gift is ineligible the day before the recipient's local birthday
//   AC-6: A gift stays eligible indefinitely after its birthday has passed (retry semantics)
//   AC-7: A gift is ineligible if its birthdayYear hasn't arrived yet, even mid-year
// ─────────────────────────────────────────────────────────────

describe("localDateString", () => {
  it("AC-1: formats a known UTC instant as YYYY-MM-DD", () => {
    expect(localDateString(new Date("2026-06-15T12:00:00Z"), "UTC")).toBe("2026-06-15");
  });

  it("AC-2: falls back to UTC for an invalid zone string", () => {
    expect(localDateString(new Date("2026-06-15T12:00:00Z"), "Not/A_Real_Zone")).toBe("2026-06-15");
  });

  it("AC-3: reflects a non-UTC zone's offset correctly", () => {
    // 23:30 UTC on the 14th is already the 15th in UTC+1 (e.g. Lagos).
    expect(localDateString(new Date("2026-06-14T23:30:00Z"), "Africa/Lagos")).toBe("2026-06-15");
    // ...but still the 14th in UTC-5 (e.g. New York, ignoring DST for this fixed offset check).
    expect(localDateString(new Date("2026-06-14T23:30:00Z"), "Etc/GMT+5")).toBe("2026-06-14");
  });
});

describe("giftIsLocallyEligible", () => {
  const recipient = { birthdayMonth: 6, birthdayDay: 15, timezone: "UTC" };

  it("AC-4: eligible exactly on the recipient's local birthday date", () => {
    const gift = { birthdayYear: 2026 };
    expect(giftIsLocallyEligible(gift, recipient, new Date("2026-06-15T00:30:00Z"))).toBe(true);
  });

  it("AC-5: ineligible the day before the recipient's local birthday", () => {
    const gift = { birthdayYear: 2026 };
    expect(giftIsLocallyEligible(gift, recipient, new Date("2026-06-14T23:59:00Z"))).toBe(false);
  });

  it("AC-6: stays eligible well after the birthday has passed (retry semantics)", () => {
    const gift = { birthdayYear: 2026 };
    expect(giftIsLocallyEligible(gift, recipient, new Date("2026-09-01T00:00:00Z"))).toBe(true);
  });

  it("AC-7: ineligible if birthdayYear hasn't arrived yet, even mid-year", () => {
    const gift = { birthdayYear: 2027 };
    expect(giftIsLocallyEligible(gift, recipient, new Date("2026-08-01T00:00:00Z"))).toBe(false);
  });
});
