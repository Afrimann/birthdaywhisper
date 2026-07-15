import { describe, it, expect, vi, beforeEach } from "vitest";

// ─────────────────────────────────────────────────────────────
// Acceptance criteria (POST /api/payouts/withdraw — owner-initiated payout):
//   AC-1: Returns 401 when not signed in
//   AC-2: Returns 404 when the signed-in user has no matching DB row
//   AC-3: Returns 400 when there are no HELD gifts at all
//   AC-4: Returns 400 when gifts exist but the local birthday hasn't arrived
//   AC-5: Returns 400 when eligible gifts exist but no approved payout account
//   AC-6: Disburses every eligible gift and returns the withdrawn total
//   AC-7: A gift disburseGift reports as "already-claimed" isn't counted as withdrawn
//   AC-8: Partial failure — succeeded gifts are still counted, failed gifts are reported
//   AC-9: Total failure across all eligible gifts returns 502
// ─────────────────────────────────────────────────────────────

const { mockAuth, mockUserFindUnique, mockDisburseGift } = vi.hoisted(() => ({
  mockAuth:           vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockDisburseGift:   vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mockUserFindUnique },
  },
}));

vi.mock("@/lib/giftDisbursement", () => ({
  disburseGift: mockDisburseGift,
}));

// Payouts are pulled from the product behind this flag (see
// lib/feature-flags.ts) — force it on so these tests keep covering the
// route's real logic, which still needs to be correct for when it returns.
vi.mock("@/lib/feature-flags", () => ({ GIFTING_ENABLED: true }));

import { POST } from "@/app/api/payouts/withdraw/route";

const THIS_YEAR = new Date().getFullYear();
const ELIGIBLE_GIFT = { id: "gift_1", amountKobo: 100_000, birthdayYear: THIS_YEAR - 1 };
const INELIGIBLE_GIFT = { id: "gift_2", amountKobo: 50_000, birthdayYear: THIS_YEAR + 1 };

const APPROVED_ACCOUNT = { paystackRecipientCode: "RCP_1", verificationStatus: "AUTO_APPROVED" };

function baseUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "user_1",
    birthdayMonth: 6,
    birthdayDay: 15,
    timezone: "UTC",
    payoutAccount: APPROVED_ACCOUNT,
    gifts: [ELIGIBLE_GIFT],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: "clerk_1" });
  mockDisburseGift.mockResolvedValue("disbursed");
});

describe("POST /api/payouts/withdraw", () => {
  it("AC-1: returns 401 when not signed in", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await POST();
    expect(res.status).toBe(401);
    expect(mockUserFindUnique).not.toHaveBeenCalled();
  });

  it("AC-2: returns 404 when there's no matching DB user", async () => {
    mockUserFindUnique.mockResolvedValue(null);
    const res = await POST();
    expect(res.status).toBe(404);
  });

  it("AC-3: returns 400 when there are no HELD gifts at all", async () => {
    mockUserFindUnique.mockResolvedValue(baseUser({ gifts: [] }));
    const res = await POST();
    expect(res.status).toBe(400);
    expect(mockDisburseGift).not.toHaveBeenCalled();
  });

  it("AC-4: returns 400 when gifts exist but the birthday hasn't arrived", async () => {
    mockUserFindUnique.mockResolvedValue(baseUser({ gifts: [INELIGIBLE_GIFT] }));
    const res = await POST();
    expect(res.status).toBe(400);
    expect(mockDisburseGift).not.toHaveBeenCalled();
  });

  it("AC-5: returns 400 when eligible but no approved payout account", async () => {
    mockUserFindUnique.mockResolvedValue(baseUser({ payoutAccount: null }));
    const res = await POST();
    expect(res.status).toBe(400);
    expect(mockDisburseGift).not.toHaveBeenCalled();
  });

  it("AC-6: disburses eligible gifts and returns the withdrawn total", async () => {
    mockUserFindUnique.mockResolvedValue(baseUser());
    const res = await POST();
    expect(res.status).toBe(200);
    expect(mockDisburseGift).toHaveBeenCalledWith("gift_1", 100_000, "RCP_1");
    const body = await res.json();
    expect(body).toEqual({ withdrawnKobo: 100_000, count: 1, failed: 0 });
  });

  it("AC-7: an already-claimed gift isn't counted as withdrawn", async () => {
    mockDisburseGift.mockResolvedValue("already-claimed");
    mockUserFindUnique.mockResolvedValue(baseUser());
    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ withdrawnKobo: 0, count: 0, failed: 0 });
  });

  it("AC-8: partial failure still counts the succeeded gift", async () => {
    const secondEligible = { id: "gift_3", amountKobo: 25_000, birthdayYear: THIS_YEAR - 1 };
    mockUserFindUnique.mockResolvedValue(baseUser({ gifts: [ELIGIBLE_GIFT, secondEligible] }));
    mockDisburseGift
      .mockResolvedValueOnce("disbursed")
      .mockRejectedValueOnce(new Error("Paystack down"));

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ withdrawnKobo: 100_000, count: 1, failed: 1 });
  });

  it("AC-9: total failure across all eligible gifts returns 502", async () => {
    mockUserFindUnique.mockResolvedValue(baseUser());
    mockDisburseGift.mockRejectedValue(new Error("Paystack down"));
    const res = await POST();
    expect(res.status).toBe(502);
  });
});
