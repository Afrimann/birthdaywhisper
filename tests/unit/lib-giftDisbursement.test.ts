import { describe, it, expect, vi, beforeEach } from "vitest";

// ─────────────────────────────────────────────────────────────
// Acceptance criteria (disburseGift — atomic claim + Paystack transfer):
//   AC-1: Claims the gift, initiates a transfer, and stores the transfer_code
//   AC-2: Returns "already-claimed" and never calls Paystack when the claiming
//         updateMany affects zero rows (already claimed/in-flight/disbursed)
//   AC-3: On a Paystack failure, resets paystackTransferCode to null, records
//         failureReason, and rethrows
// ─────────────────────────────────────────────────────────────

const { mockGiftUpdateMany, mockGiftUpdate, mockInitiateTransfer } = vi.hoisted(() => ({
  mockGiftUpdateMany:   vi.fn(),
  mockGiftUpdate:       vi.fn(),
  mockInitiateTransfer: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    gift: { updateMany: mockGiftUpdateMany, update: mockGiftUpdate },
  },
}));

vi.mock("@/lib/paystack", () => ({
  initiateTransfer: mockInitiateTransfer,
  PaystackError: class PaystackError extends Error {},
}));

import { disburseGift } from "@/lib/giftDisbursement";

beforeEach(() => {
  vi.clearAllMocks();
  mockGiftUpdate.mockResolvedValue({});
});

describe("disburseGift", () => {
  it("AC-1: claims, transfers, and stores the transfer_code", async () => {
    mockGiftUpdateMany.mockResolvedValue({ count: 1 });
    mockInitiateTransfer.mockResolvedValue({ transfer_code: "TRF_1", status: "pending" });

    const outcome = await disburseGift("gift_1", 100_000, "RCP_1");

    expect(outcome).toBe("disbursed");
    expect(mockGiftUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "gift_1", status: "HELD", paystackTransferCode: null } }),
    );
    expect(mockInitiateTransfer).toHaveBeenCalledWith(
      expect.objectContaining({ amountKobo: 100_000, recipientCode: "RCP_1" }),
    );
    expect(mockGiftUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "gift_1" }, data: { paystackTransferCode: "TRF_1" } }),
    );
  });

  it("AC-2: returns already-claimed and skips Paystack when the claim affects zero rows", async () => {
    mockGiftUpdateMany.mockResolvedValue({ count: 0 });

    const outcome = await disburseGift("gift_1", 100_000, "RCP_1");

    expect(outcome).toBe("already-claimed");
    expect(mockInitiateTransfer).not.toHaveBeenCalled();
    expect(mockGiftUpdate).not.toHaveBeenCalled();
  });

  it("AC-3: resets the claim and records the failure reason when Paystack fails, then rethrows", async () => {
    mockGiftUpdateMany.mockResolvedValue({ count: 1 });
    mockInitiateTransfer.mockRejectedValue(new Error("Paystack down"));

    await expect(disburseGift("gift_1", 100_000, "RCP_1")).rejects.toThrow("Paystack down");

    expect(mockGiftUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "gift_1" },
        data: expect.objectContaining({ paystackTransferCode: null, failureReason: "Transfer initiation failed" }),
      }),
    );
  });
});
