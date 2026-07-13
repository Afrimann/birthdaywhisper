import { describe, it, expect, vi, beforeEach } from "vitest";

// ─────────────────────────────────────────────────────────────
// Acceptance criteria (admin route gate — this is the one place a bug
// silently exposes financial data, so it's tested explicitly negative
// first, across every /api/admin/** route, not just one representative):
//   AC-1..6: Each admin route returns 401 when signed out
//   AC-7..12: Each admin route returns 403 when signed in but not allowlisted
//   AC-13: An allowlisted admin passes the gate on the gifts ledger (happy path)
//   AC-14: Approving a payout account lazily creates a transfer recipient
//          when none exists yet, and flips status to MANUALLY_APPROVED
// ─────────────────────────────────────────────────────────────

process.env.ADMIN_CLERK_USER_IDS = "admin_1,admin_2";

const {
  mockAuth,
  mockGiftFindMany,
  mockGiftCount,
  mockGiftFindUnique,
  mockGiftUpdate,
  mockUserFindMany,
  mockPayoutAccountFindMany,
  mockPayoutAccountFindUnique,
  mockPayoutAccountUpdate,
  mockCreateTransferRecipient,
} = vi.hoisted(() => ({
  mockAuth:                    vi.fn(),
  mockGiftFindMany:            vi.fn(),
  mockGiftCount:                vi.fn(),
  mockGiftFindUnique:           vi.fn(),
  mockGiftUpdate:               vi.fn(),
  mockUserFindMany:             vi.fn(),
  mockPayoutAccountFindMany:    vi.fn(),
  mockPayoutAccountFindUnique:  vi.fn(),
  mockPayoutAccountUpdate:      vi.fn(),
  mockCreateTransferRecipient:  vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    gift:          { findMany: mockGiftFindMany, count: mockGiftCount, findUnique: mockGiftFindUnique, update: mockGiftUpdate },
    user:          { findMany: mockUserFindMany },
    payoutAccount: { findMany: mockPayoutAccountFindMany, findUnique: mockPayoutAccountFindUnique, update: mockPayoutAccountUpdate },
  },
}));

vi.mock("@/lib/paystack", () => ({
  createTransferRecipient: mockCreateTransferRecipient,
  PaystackError: class PaystackError extends Error {},
}));

import { GET as getGifts } from "@/app/api/admin/gifts/route";
import { PATCH as patchGift } from "@/app/api/admin/gifts/[id]/route";
import { GET as getBirthdays } from "@/app/api/admin/birthdays/route";
import { GET as getPayoutAccounts } from "@/app/api/admin/payout-accounts/route";
import { PATCH as patchPayoutAccount } from "@/app/api/admin/payout-accounts/[id]/route";
import { GET as getUsers } from "@/app/api/admin/users/route";

function req(url: string, init?: RequestInit) {
  return new Request(url, init);
}

function idParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGiftFindMany.mockResolvedValue([]);
  mockGiftCount.mockResolvedValue(0);
  mockUserFindMany.mockResolvedValue([]);
  mockPayoutAccountFindMany.mockResolvedValue([]);
});

describe("admin route gate — signed out", () => {
  beforeEach(() => mockAuth.mockResolvedValue({ userId: null }));

  it("AC-1: GET /api/admin/gifts → 401", async () => {
    expect((await getGifts(req("http://localhost/api/admin/gifts"))).status).toBe(401);
  });
  it("AC-2: PATCH /api/admin/gifts/[id] → 401", async () => {
    expect((await patchGift(req("http://localhost/x", { method: "PATCH", body: "{}" }), idParams("g1"))).status).toBe(401);
  });
  it("AC-3: GET /api/admin/birthdays → 401", async () => {
    expect((await getBirthdays(req("http://localhost/api/admin/birthdays?month=6"))).status).toBe(401);
  });
  it("AC-4: GET /api/admin/payout-accounts → 401", async () => {
    expect((await getPayoutAccounts()).status).toBe(401);
  });
  it("AC-5: PATCH /api/admin/payout-accounts/[id] → 401", async () => {
    expect((await patchPayoutAccount(req("http://localhost/x", { method: "PATCH", body: "{}" }), idParams("p1"))).status).toBe(401);
  });
  it("AC-6: GET /api/admin/users → 401", async () => {
    expect((await getUsers(req("http://localhost/api/admin/users?username=pe"))).status).toBe(401);
  });
});

describe("admin route gate — signed in, not allowlisted", () => {
  beforeEach(() => mockAuth.mockResolvedValue({ userId: "not_an_admin" }));

  it("AC-7: GET /api/admin/gifts → 403", async () => {
    expect((await getGifts(req("http://localhost/api/admin/gifts"))).status).toBe(403);
  });
  it("AC-8: PATCH /api/admin/gifts/[id] → 403", async () => {
    expect((await patchGift(req("http://localhost/x", { method: "PATCH", body: "{}" }), idParams("g1"))).status).toBe(403);
  });
  it("AC-9: GET /api/admin/birthdays → 403", async () => {
    expect((await getBirthdays(req("http://localhost/api/admin/birthdays?month=6"))).status).toBe(403);
  });
  it("AC-10: GET /api/admin/payout-accounts → 403", async () => {
    expect((await getPayoutAccounts()).status).toBe(403);
  });
  it("AC-11: PATCH /api/admin/payout-accounts/[id] → 403", async () => {
    expect((await patchPayoutAccount(req("http://localhost/x", { method: "PATCH", body: "{}" }), idParams("p1"))).status).toBe(403);
  });
  it("AC-12: GET /api/admin/users → 403", async () => {
    expect((await getUsers(req("http://localhost/api/admin/users?username=pe"))).status).toBe(403);
  });
});

describe("admin route gate — allowlisted admin", () => {
  beforeEach(() => mockAuth.mockResolvedValue({ userId: "admin_1" }));

  it("AC-13: allowlisted admin passes the gate on the gifts ledger", async () => {
    const res = await getGifts(req("http://localhost/api/admin/gifts"));
    expect(res.status).toBe(200);
    expect(mockGiftFindMany).toHaveBeenCalled();
  });
});

describe("PATCH /api/admin/payout-accounts/[id] — approve", () => {
  beforeEach(() => mockAuth.mockResolvedValue({ userId: "admin_1" }));

  it("AC-14: approving lazily creates a transfer recipient and flips to MANUALLY_APPROVED", async () => {
    mockPayoutAccountFindUnique.mockResolvedValue({
      id: "p1",
      paystackRecipientCode: null,
      accountName: "AMARA CHIOMA OKEKE",
      accountNumber: "0123456789",
      bankCode: "058",
    });
    mockCreateTransferRecipient.mockResolvedValue({ recipient_code: "RCP_new" });
    mockPayoutAccountUpdate.mockResolvedValue({});

    const res = await patchPayoutAccount(
      req("http://localhost/x", { method: "PATCH", body: JSON.stringify({ action: "approve" }) }),
      idParams("p1"),
    );

    expect(res.status).toBe(200);
    expect(mockCreateTransferRecipient).toHaveBeenCalledWith(
      expect.objectContaining({ name: "AMARA CHIOMA OKEKE", account_number: "0123456789", bank_code: "058" }),
    );
    expect(mockPayoutAccountUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paystackRecipientCode: "RCP_new", verificationStatus: "MANUALLY_APPROVED" }),
      }),
    );
  });
});
