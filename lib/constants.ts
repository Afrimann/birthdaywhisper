// Gift amount presets, small to big — adjust freely, not wired elsewhere.
export const GIFT_AMOUNT_PRESETS_KOBO = [50_000, 100_000, 250_000, 500_000, 1_000_000];
export const MIN_GIFT_KOBO = 10_000; // ₦100 floor
export const MAX_GIFT_KOBO = 10_000_000; // ₦100,000 ceiling

const PLATFORM_FEE_PERCENT = 0.05;
const PLATFORM_FEE_FLOOR_KOBO = 5_000; // ₦50 minimum

/** Visible fee added on top of the gift amount — never deducted from the recipient's payout. */
export function calculatePlatformFeeKobo(amountKobo: number): number {
  return Math.max(Math.round(amountKobo * PLATFORM_FEE_PERCENT), PLATFORM_FEE_FLOOR_KOBO);
}
