import { describe, it, expect, vi, beforeEach } from "vitest";

// ─────────────────────────────────────────────────────────────
// Acceptance criteria (Payout account — verify + save bank details):
//   AC-1: Returns 401 when not signed in
//   AC-2: Returns 400 for a malformed account number
//   AC-3: Returns 400 when resolveAccountNumber (Paystack) fails
//   AC-4: Returns 422 when resolved account name doesn't match the user's display name
//   AC-5: Accepts a name-order mismatch (word-overlap, not exact string equality) — STRONG match
//   AC-6: Saves the account on a successful (STRONG) match and returns the resolved name
//   AC-7: A prior verify failure does not block a subsequent successful save
//   AC-8: A WEAK match saves as PENDING_REVIEW without creating a transfer recipient
//   AC-9: Returns 409 when a transfer is already in flight for an existing account
// ─────────────────────────────────────────────────────────────

const {
  mockAuth,
  mockUserFindUnique,
  mockPayoutAccountFindUnique,
  mockPayoutAccountUpsert,
  mockGiftFindFirst,
  mockResolveAccountNumber,
  mockCreateTransferRecipient,
} = vi.hoisted(() => ({
  mockAuth:                     vi.fn(),
  mockUserFindUnique:           vi.fn(),
  mockPayoutAccountFindUnique:  vi.fn(),
  mockPayoutAccountUpsert:      vi.fn(),
  mockGiftFindFirst:            vi.fn(),
  mockResolveAccountNumber:     vi.fn(),
  mockCreateTransferRecipient:  vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user:          { findUnique: mockUserFindUnique },
    payoutAccount: { findUnique: mockPayoutAccountFindUnique, upsert: mockPayoutAccountUpsert },
    gift:          { findFirst: mockGiftFindFirst },
  },
}));

vi.mock("@/lib/paystack", () => ({
  resolveAccountNumber:    mockResolveAccountNumber,
  createTransferRecipient: mockCreateTransferRecipient,
  PaystackError: class PaystackError extends Error {},
}));

import { POST } from "@/app/api/payout-account/route";

const VALID_BODY = { bankCode: "058", bankName: "GTBank", accountNumber: "0123456789" };

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/payout-account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: "user_1" });
  mockUserFindUnique.mockResolvedValue({ id: "db_user_1", displayName: "Chidinma Okafor" });
  mockPayoutAccountFindUnique.mockResolvedValue(null); // no existing account by default
  mockGiftFindFirst.mockResolvedValue(null); // no in-flight transfer by default
  mockResolveAccountNumber.mockResolvedValue({ account_number: "0123456789", account_name: "OKAFOR CHIDINMA JOY" });
  mockCreateTransferRecipient.mockResolvedValue({ recipient_code: "RCP_abc123" });
  mockPayoutAccountUpsert.mockResolvedValue({});
});

describe("POST /api/payout-account", () => {
  it("AC-1: returns 401 when not signed in", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(401);
  });

  it("AC-2: returns 400 for a malformed account number", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, accountNumber: "123" }));
    expect(res.status).toBe(400);
    expect(mockResolveAccountNumber).not.toHaveBeenCalled();
  });

  it("AC-3: returns 400 when resolveAccountNumber fails", async () => {
    mockResolveAccountNumber.mockRejectedValue(new Error("Could not resolve account"));
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(400);
    expect(mockPayoutAccountUpsert).not.toHaveBeenCalled();
  });

  it("AC-4: returns 422 when the resolved name doesn't match the display name", async () => {
    mockResolveAccountNumber.mockResolvedValue({ account_number: "0123456789", account_name: "SOMEONE ELSE ENTIRELY" });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(422);
    expect(mockCreateTransferRecipient).not.toHaveBeenCalled();
    expect(mockPayoutAccountUpsert).not.toHaveBeenCalled();
  });

  it("AC-5: accepts a name-order mismatch via word overlap", async () => {
    // Bank name "OKAFOR CHIDINMA JOY" vs. display name "Chidinma Okafor" —
    // different order, extra middle name, but 2 shared significant words.
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
  });

  it("AC-6: saves the account on a successful match", async () => {
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accountName).toBe("OKAFOR CHIDINMA JOY");
    expect(mockPayoutAccountUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "db_user_1" },
        create: expect.objectContaining({ paystackRecipientCode: "RCP_abc123" }),
      }),
    );
  });

  it("AC-7: a prior verify failure does not block a subsequent successful save", async () => {
    mockResolveAccountNumber.mockRejectedValueOnce(new Error("temporary failure"));
    const first = await POST(makeRequest(VALID_BODY));
    expect(first.status).toBe(400);

    const second = await POST(makeRequest(VALID_BODY));
    expect(second.status).toBe(200);
    expect(mockPayoutAccountUpsert).toHaveBeenCalledTimes(1);
  });

  it("AC-8: a WEAK match saves as PENDING_REVIEW without creating a transfer recipient", async () => {
    // "AMARA CHIOMA OKEKE" vs "Amara Blessing Okeke" — first+last match,
    // middle name differs entirely: clears the minimum but doesn't fully
    // cover the shorter name's words.
    mockUserFindUnique.mockResolvedValue({ id: "db_user_1", displayName: "Amara Blessing Okeke" });
    mockResolveAccountNumber.mockResolvedValue({ account_number: "0123456789", account_name: "AMARA CHIOMA OKEKE" });

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.pendingReview).toBe(true);
    expect(mockCreateTransferRecipient).not.toHaveBeenCalled();
    expect(mockPayoutAccountUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          verificationStatus: "PENDING_REVIEW",
          paystackRecipientCode: null,
          nameMatchStrength: "WEAK",
        }),
      }),
    );
  });

  it("AC-9: returns 409 when a transfer is already in flight for an existing account", async () => {
    mockPayoutAccountFindUnique.mockResolvedValue({ userId: "db_user_1" });
    mockGiftFindFirst.mockResolvedValue({ id: "gift_1" });

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(409);
    expect(mockResolveAccountNumber).not.toHaveBeenCalled();
    expect(mockPayoutAccountUpsert).not.toHaveBeenCalled();
  });
});
