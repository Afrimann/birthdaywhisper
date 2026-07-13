import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "crypto";

// ─────────────────────────────────────────────────────────────
// Acceptance criteria (Paystack webhook):
//   AC-1: Returns 401 when the signature is missing
//   AC-2: Returns 401 when the signature doesn't match the body
//   AC-3: charge.success moves a PENDING_PAYMENT gift to HELD
//   AC-4: charge.success is idempotent — already-HELD gift is left alone
//   AC-5: transfer.success moves a gift to DISBURSED
//   AC-6: transfer.failed reverts to HELD and nulls paystackTransferCode
//   AC-7: Unrecognized events still return 200 (avoid needless Paystack retries)
//   AC-8: transfer.failed creates a deduped TRANSFER_FAILED notification
//   AC-9: charge.dispute.create flags the gift and sends an admin alert
//   AC-10: charge.dispute.create is idempotent — already-disputed gift is left alone
//   AC-11: charge.dispute.resolve appends a note but does NOT clear isDisputed
// ─────────────────────────────────────────────────────────────

const SECRET = "test_secret_key";
process.env.PAYSTACK_SECRET_KEY = SECRET;

const { mockGiftFindUnique, mockGiftFindFirst, mockGiftUpdate, mockNotificationFindFirst, mockNotificationCreate, mockSendAdminDisputeAlertEmail } =
  vi.hoisted(() => ({
    mockGiftFindUnique: vi.fn(),
    mockGiftFindFirst:  vi.fn(),
    mockGiftUpdate:     vi.fn(),
    mockNotificationFindFirst: vi.fn(),
    mockNotificationCreate:    vi.fn(),
    mockSendAdminDisputeAlertEmail: vi.fn(),
  }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    gift: { findUnique: mockGiftFindUnique, findFirst: mockGiftFindFirst, update: mockGiftUpdate },
    notification: { findFirst: mockNotificationFindFirst, create: mockNotificationCreate },
  },
}));

vi.mock("@/lib/email", () => ({
  sendAdminDisputeAlertEmail: mockSendAdminDisputeAlertEmail,
}));

import { POST } from "@/app/api/webhooks/paystack/route";

function sign(body: string): string {
  return createHmac("sha512", SECRET).update(body).digest("hex");
}

function makeRequest(payload: unknown, { validSignature = true, noSignature = false } = {}) {
  const raw = JSON.stringify(payload);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!noSignature) {
    headers["x-paystack-signature"] = validSignature ? sign(raw) : "0".repeat(128);
  }
  return new Request("http://localhost/api/webhooks/paystack", {
    method: "POST",
    headers,
    body: raw,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGiftUpdate.mockResolvedValue({});
  mockNotificationFindFirst.mockResolvedValue(null);
  mockNotificationCreate.mockResolvedValue({});
  mockSendAdminDisputeAlertEmail.mockResolvedValue(undefined);
});

describe("POST /api/webhooks/paystack", () => {
  it("AC-1: returns 401 when the signature is missing", async () => {
    const res = await POST(makeRequest({ event: "charge.success", data: { reference: "ref_1" } }, { noSignature: true }));
    expect(res.status).toBe(401);
  });

  it("AC-2: returns 401 when the signature doesn't match", async () => {
    const res = await POST(makeRequest({ event: "charge.success", data: { reference: "ref_1" } }, { validSignature: false }));
    expect(res.status).toBe(401);
  });

  it("AC-3: charge.success moves a PENDING_PAYMENT gift to HELD", async () => {
    mockGiftFindUnique.mockResolvedValue({ id: "gift_1", status: "PENDING_PAYMENT" });
    const res = await POST(makeRequest({ event: "charge.success", data: { reference: "ref_1" } }));
    expect(res.status).toBe(200);
    expect(mockGiftUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "gift_1" }, data: expect.objectContaining({ status: "HELD" }) }),
    );
  });

  it("AC-4: charge.success is idempotent for an already-HELD gift", async () => {
    mockGiftFindUnique.mockResolvedValue({ id: "gift_1", status: "HELD" });
    const res = await POST(makeRequest({ event: "charge.success", data: { reference: "ref_1" } }));
    expect(res.status).toBe(200);
    expect(mockGiftUpdate).not.toHaveBeenCalled();
  });

  it("AC-5: transfer.success moves a gift to DISBURSED", async () => {
    mockGiftFindFirst.mockResolvedValue({ id: "gift_1", status: "HELD" });
    const res = await POST(makeRequest({ event: "transfer.success", data: { transfer_code: "TRF_1" } }));
    expect(res.status).toBe(200);
    expect(mockGiftUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "gift_1" }, data: expect.objectContaining({ status: "DISBURSED" }) }),
    );
  });

  it("AC-6: transfer.failed reverts to HELD and nulls the transfer code", async () => {
    mockGiftFindFirst.mockResolvedValue({ id: "gift_1", status: "HELD", recipientId: "user_1", amountKobo: 50_000 });
    const res = await POST(makeRequest({ event: "transfer.failed", data: { transfer_code: "TRF_1", reason: "insufficient funds" } }));
    expect(res.status).toBe(200);
    expect(mockGiftUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "gift_1" },
        data: expect.objectContaining({ status: "HELD", paystackTransferCode: null }),
      }),
    );
  });

  it("AC-7: unrecognized events still return 200", async () => {
    const res = await POST(makeRequest({ event: "some.other.event", data: {} }));
    expect(res.status).toBe(200);
  });

  it("AC-8: transfer.failed creates a deduped TRANSFER_FAILED notification", async () => {
    mockGiftFindFirst.mockResolvedValue({ id: "gift_1", status: "HELD", recipientId: "user_1", amountKobo: 50_000 });
    await POST(makeRequest({ event: "transfer.failed", data: { transfer_code: "TRF_1" } }));
    expect(mockNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user_1", type: "TRANSFER_FAILED" }),
      }),
    );

    // Dedupe: an unread notification for this gift already exists.
    mockNotificationCreate.mockClear();
    mockNotificationFindFirst.mockResolvedValue({ id: "notif_1" });
    await POST(makeRequest({ event: "transfer.failed", data: { transfer_code: "TRF_1" } }));
    expect(mockNotificationCreate).not.toHaveBeenCalled();
  });

  it("AC-9: charge.dispute.create flags the gift and sends an admin alert", async () => {
    mockGiftFindUnique.mockResolvedValue({ id: "gift_1", isDisputed: false, amountKobo: 100_000, recipientId: "user_1" });
    const res = await POST(
      makeRequest({ event: "charge.dispute.create", data: { transaction: { reference: "ref_1" } } }),
    );
    expect(res.status).toBe(200);
    expect(mockGiftUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "gift_1" }, data: expect.objectContaining({ isDisputed: true }) }),
    );
    expect(mockSendAdminDisputeAlertEmail).toHaveBeenCalledWith("gift_1", 100_000, "user_1");
  });

  it("AC-10: charge.dispute.create is idempotent for an already-disputed gift", async () => {
    mockGiftFindUnique.mockResolvedValue({ id: "gift_1", isDisputed: true, amountKobo: 100_000, recipientId: "user_1" });
    await POST(makeRequest({ event: "charge.dispute.create", data: { transaction: { reference: "ref_1" } } }));
    expect(mockGiftUpdate).not.toHaveBeenCalled();
    expect(mockSendAdminDisputeAlertEmail).not.toHaveBeenCalled();
  });

  it("AC-11: charge.dispute.resolve appends a note but does not clear isDisputed", async () => {
    mockGiftFindUnique.mockResolvedValue({ id: "gift_1", isDisputed: true });
    await POST(
      makeRequest({ event: "charge.dispute.resolve", data: { transaction: { reference: "ref_1" }, status: "merchant-accepted" } }),
    );
    expect(mockGiftUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "gift_1" } }),
    );
    const [[updateCall]] = mockGiftUpdate.mock.calls;
    expect(updateCall.data.isDisputed).toBeUndefined();
  });
});
