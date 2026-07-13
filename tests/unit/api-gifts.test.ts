import { describe, it, expect, vi, beforeEach } from "vitest";

// ─────────────────────────────────────────────────────────────
// Acceptance criteria (Gifting — create gift + start payment):
//   AC-1: Returns 201 and an authorizationUrl for a valid preset-amount gift
//   AC-2: Returns 400 when amount is below MIN_GIFT_KOBO
//   AC-3: Returns 400 when amount is above MAX_GIFT_KOBO
//   AC-4: Returns 400 when recipientId is missing
//   AC-5: Returns 404 when recipient does not exist in DB
//   AC-6: Returns 400 for an invalid avatarSeed
//   AC-7: Returns 400 for a malformed senderEmail
//   AC-8: Returns 422 when the note fails the profanity filter
//   AC-9: Computes platformFeeKobo and charges amount+fee to Paystack
//   AC-10: Marks the gift FAILED if Paystack initialization throws
//   AC-12: Returns 429 when a guest hits the 2/hour gift rate limit
//   AC-13: Returns 429 when an authed sender hits the 5/hour gift rate limit
//   AC-14: Message and gift rate limits use separate SenderSession counters
// ─────────────────────────────────────────────────────────────

const {
  mockAuth,
  mockUserFindUnique,
  mockSenderSessionFindUnique,
  mockSenderSessionUpsert,
  mockGiftCreate,
  mockGiftUpdate,
  mockModerateContent,
  mockInitializeTransaction,
} = vi.hoisted(() => ({
  mockAuth:                    vi.fn(),
  mockUserFindUnique:          vi.fn(),
  mockSenderSessionFindUnique: vi.fn(),
  mockSenderSessionUpsert:     vi.fn(),
  mockGiftCreate:              vi.fn(),
  mockGiftUpdate:              vi.fn(),
  mockModerateContent:         vi.fn(),
  mockInitializeTransaction:   vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user:          { findUnique: mockUserFindUnique },
    senderSession: { findUnique: mockSenderSessionFindUnique, upsert: mockSenderSessionUpsert },
    gift:          { create: mockGiftCreate, update: mockGiftUpdate },
  },
}));

vi.mock("@/lib/moderation", () => ({
  moderateContent: mockModerateContent,
}));

vi.mock("@/lib/paystack", () => ({
  initializeTransaction: mockInitializeTransaction,
  PaystackError: class PaystackError extends Error {},
}));

import { POST } from "@/app/api/gifts/route";
import { GIFT_AVATARS } from "@/lib/avatars";
import { MIN_GIFT_KOBO, MAX_GIFT_KOBO, calculatePlatformFeeKobo } from "@/lib/constants";

const RECIPIENT = { id: "user_abc", birthdayMonth: 6, birthdayDay: 15, timezone: "UTC" };
const VALID_BODY = {
  recipientId: "user_abc",
  amountKobo: 100_000,
  avatarSeed: GIFT_AVATARS[0].seed,
  senderName: "A Friend",
  senderEmail: "friend@example.com",
  note: "Happy birthday!",
};

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/gifts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: null }); // guest by default
  mockUserFindUnique.mockResolvedValue(RECIPIENT);
  mockSenderSessionFindUnique.mockResolvedValue(null); // no prior session
  mockSenderSessionUpsert.mockResolvedValue({});
  // id and paystackReference are deliberately different values here — the
  // route must send Paystack the paystackReference, not the row's id, or
  // the webhook can never find this gift again by reference.
  mockGiftCreate.mockResolvedValue({ id: "gift_1", paystackReference: "ref_abc123" });
  mockGiftUpdate.mockResolvedValue({});
  mockModerateContent.mockResolvedValue(false);
  mockInitializeTransaction.mockResolvedValue({
    authorization_url: "https://checkout.paystack.com/abc123",
    reference: "ref_abc123",
  });
});

describe("POST /api/gifts", () => {
  it("AC-1: returns 201 with an authorizationUrl for a valid gift", async () => {
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.authorizationUrl).toBe("https://checkout.paystack.com/abc123");
  });

  it("AC-2: returns 400 when amount is below the floor", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, amountKobo: MIN_GIFT_KOBO - 1 }));
    expect(res.status).toBe(400);
    expect(mockGiftCreate).not.toHaveBeenCalled();
  });

  it("AC-3: returns 400 when amount is above the ceiling", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, amountKobo: MAX_GIFT_KOBO + 1 }));
    expect(res.status).toBe(400);
    expect(mockGiftCreate).not.toHaveBeenCalled();
  });

  it("AC-4: returns 400 when recipientId is missing", async () => {
    const { recipientId: _omit, ...noId } = VALID_BODY;
    const res = await POST(makeRequest(noId));
    expect(res.status).toBe(400);
    expect(mockUserFindUnique).not.toHaveBeenCalled();
  });

  it("AC-5: returns 404 when recipient does not exist", async () => {
    mockUserFindUnique.mockResolvedValue(null);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(404);
    expect(mockGiftCreate).not.toHaveBeenCalled();
  });

  it("AC-6: returns 400 for an invalid avatarSeed", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, avatarSeed: "not-a-real-seed" }));
    expect(res.status).toBe(400);
    expect(mockGiftCreate).not.toHaveBeenCalled();
  });

  it("AC-7: returns 400 for a malformed senderEmail", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, senderEmail: "not-an-email" }));
    expect(res.status).toBe(400);
    expect(mockGiftCreate).not.toHaveBeenCalled();
  });

  it("AC-8: returns 422 when the note is flagged by moderation", async () => {
    mockModerateContent.mockResolvedValue(true);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(422);
    expect(mockGiftCreate).not.toHaveBeenCalled();
  });

  it("AC-9: computes the platform fee and charges amount+fee to Paystack", async () => {
    await POST(makeRequest(VALID_BODY));
    const expectedFee = calculatePlatformFeeKobo(VALID_BODY.amountKobo);
    expect(mockGiftCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amountKobo: VALID_BODY.amountKobo, platformFeeKobo: expectedFee }),
      }),
    );
    expect(mockInitializeTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ amountKobo: VALID_BODY.amountKobo + expectedFee }),
    );
  });

  it("AC-11: sends Paystack the gift's paystackReference, not its id — this is what the webhook later looks up by", async () => {
    await POST(makeRequest(VALID_BODY));
    expect(mockInitializeTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ reference: "ref_abc123" }),
    );
    expect(mockInitializeTransaction).not.toHaveBeenCalledWith(
      expect.objectContaining({ reference: "gift_1" }),
    );
  });

  it("AC-10: marks the gift FAILED if Paystack initialization throws", async () => {
    mockInitializeTransaction.mockRejectedValue(new Error("network error"));
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(502);
    expect(mockGiftUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "FAILED" }) }),
    );
  });

  it("AC-12: returns 429 when a guest hits the 2/hour gift rate limit", async () => {
    mockSenderSessionFindUnique.mockResolvedValue({ giftCount: 2, giftLastSentAt: new Date() });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(429);
    expect(mockGiftCreate).not.toHaveBeenCalled();
  });

  it("AC-13: returns 429 when an authed sender hits the 5/hour gift rate limit", async () => {
    mockAuth.mockResolvedValue({ userId: "clerk_1" });
    mockSenderSessionFindUnique.mockResolvedValue({ giftCount: 5, giftLastSentAt: new Date() });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(429);
    expect(mockGiftCreate).not.toHaveBeenCalled();
  });

  it("AC-14: gift rate limiting reads giftCount, not messageCount, from the shared session row", async () => {
    // A session row that's maxed out on messages but has no gift activity
    // yet must NOT block gift sending — the two counters are independent.
    mockSenderSessionFindUnique.mockResolvedValue({ messageCount: 99, giftCount: 0, giftLastSentAt: null });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(201);
  });
});
