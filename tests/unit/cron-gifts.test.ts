import { describe, it, expect, vi, beforeEach } from "vitest";

// ─────────────────────────────────────────────────────────────
// Acceptance criteria (Gift cron — notify-only, owner-initiated withdrawal):
//   AC-1: Returns 401 when the cron secret is missing/wrong
//   AC-2: Skips a gift whose local birthday hasn't arrived yet (no notifications)
//   AC-3: Creates a GIFTS_READY_TO_WITHDRAW notification for an eligible gift
//         with an approved payout account — does NOT initiate any transfer
//   AC-4: Does not duplicate GIFTS_READY_TO_WITHDRAW if an unread one already exists
//   AC-5: A PENDING_REVIEW (weak-match) payout account is treated as missing, not approved
//   AC-6: Creates a PAYOUT_ACCOUNT_MISSING notification when no payout account exists
//   AC-7: Does not duplicate PAYOUT_ACCOUNT_MISSING if an unread one already exists
//   AC-8: Sweeps stale PENDING_PAYMENT gifts to EXPIRED, independent of notifications
// ─────────────────────────────────────────────────────────────

process.env.CRON_SECRET = "test_cron_secret";

const { mockUserFindMany, mockGiftUpdateMany, mockNotificationFindFirst, mockNotificationCreate } =
  vi.hoisted(() => ({
    mockUserFindMany:          vi.fn(),
    mockGiftUpdateMany:        vi.fn(),
    mockNotificationFindFirst: vi.fn(),
    mockNotificationCreate:    vi.fn(),
  }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user:         { findMany: mockUserFindMany },
    gift:         { updateMany: mockGiftUpdateMany },
    notification: { findFirst: mockNotificationFindFirst, create: mockNotificationCreate },
  },
}));

import { GET } from "@/app/api/cron/gifts/route";

function makeRequest(secret?: string) {
  const url = secret ? `http://localhost/api/cron/gifts?secret=${secret}` : "http://localhost/api/cron/gifts";
  return new Request(url);
}

const THIS_YEAR = new Date().getFullYear();

// A birthday in a past year is always "arrived" in local terms regardless
// of month/day, and one in a future year never is — avoids flakiness
// around exactly which day the test suite happens to run on.
const ELIGIBLE_GIFT = { id: "gift_1", amountKobo: 100_000, birthdayYear: THIS_YEAR - 1 };
const INELIGIBLE_GIFT = { id: "gift_2", amountKobo: 50_000, birthdayYear: THIS_YEAR + 1 };

const BASE_USER = { id: "user_1", birthdayMonth: 6, birthdayDay: 15, timezone: "UTC" };
const APPROVED_ACCOUNT = { paystackRecipientCode: "RCP_1", verificationStatus: "AUTO_APPROVED" };
const PENDING_ACCOUNT = { paystackRecipientCode: null, verificationStatus: "PENDING_REVIEW" };

beforeEach(() => {
  vi.clearAllMocks();
  mockGiftUpdateMany.mockResolvedValue({ count: 0 });
  mockNotificationFindFirst.mockResolvedValue(null);
  mockNotificationCreate.mockResolvedValue({});
});

describe("GET /api/cron/gifts", () => {
  it("AC-1: returns 401 with a missing/wrong secret", async () => {
    const res = await GET(makeRequest("wrong"));
    expect(res.status).toBe(401);
    expect(mockUserFindMany).not.toHaveBeenCalled();
  });

  it("AC-2: skips a gift whose local birthday hasn't arrived yet", async () => {
    mockUserFindMany.mockResolvedValue([
      { ...BASE_USER, payoutAccount: APPROVED_ACCOUNT, gifts: [INELIGIBLE_GIFT] },
    ]);
    await GET(makeRequest("test_cron_secret"));
    expect(mockNotificationCreate).not.toHaveBeenCalled();
  });

  it("AC-3: notifies (does not transfer) for an eligible gift with an approved payout account", async () => {
    mockUserFindMany.mockResolvedValue([
      { ...BASE_USER, payoutAccount: APPROVED_ACCOUNT, gifts: [ELIGIBLE_GIFT] },
    ]);
    const res = await GET(makeRequest("test_cron_secret"));
    expect(res.status).toBe(200);
    expect(mockNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user_1", type: "GIFTS_READY_TO_WITHDRAW" }),
      }),
    );
  });

  it("AC-4: does not duplicate GIFTS_READY_TO_WITHDRAW if an unread one already exists", async () => {
    mockNotificationFindFirst.mockResolvedValue({ id: "notif_1" });
    mockUserFindMany.mockResolvedValue([
      { ...BASE_USER, payoutAccount: APPROVED_ACCOUNT, gifts: [ELIGIBLE_GIFT] },
    ]);
    await GET(makeRequest("test_cron_secret"));
    expect(mockNotificationCreate).not.toHaveBeenCalled();
  });

  it("AC-5: a PENDING_REVIEW payout account is treated as missing, not approved", async () => {
    mockUserFindMany.mockResolvedValue([
      { ...BASE_USER, payoutAccount: PENDING_ACCOUNT, gifts: [ELIGIBLE_GIFT] },
    ]);
    await GET(makeRequest("test_cron_secret"));
    expect(mockNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "user_1", type: "PAYOUT_ACCOUNT_MISSING" }) }),
    );
  });

  it("AC-6: creates a notification when no payout account exists", async () => {
    mockUserFindMany.mockResolvedValue([
      { ...BASE_USER, payoutAccount: null, gifts: [ELIGIBLE_GIFT] },
    ]);
    await GET(makeRequest("test_cron_secret"));
    expect(mockNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user_1", type: "PAYOUT_ACCOUNT_MISSING" }),
      }),
    );
  });

  it("AC-7: does not duplicate PAYOUT_ACCOUNT_MISSING if an unread one already exists", async () => {
    mockNotificationFindFirst.mockResolvedValue({ id: "notif_1" });
    mockUserFindMany.mockResolvedValue([
      { ...BASE_USER, payoutAccount: null, gifts: [ELIGIBLE_GIFT] },
    ]);
    await GET(makeRequest("test_cron_secret"));
    expect(mockNotificationCreate).not.toHaveBeenCalled();
  });

  it("AC-8: sweeps stale PENDING_PAYMENT gifts to EXPIRED independent of notifications", async () => {
    mockGiftUpdateMany.mockResolvedValue({ count: 3 });
    mockUserFindMany.mockResolvedValue([]);
    const res = await GET(makeRequest("test_cron_secret"));
    expect(mockGiftUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "PENDING_PAYMENT" }),
        data: { status: "EXPIRED" },
      }),
    );
    const body = await res.json();
    expect(body.expiredPendingPayments).toBe(3);
  });
});
