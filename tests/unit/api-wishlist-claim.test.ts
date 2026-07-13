import { describe, it, expect, vi, beforeEach } from "vitest";

// ─────────────────────────────────────────────────────────────
// Acceptance criteria (POST/DELETE /api/wishlist/[id]/claim):
// Claiming is deliberately anonymous/no-login (like a gift registry), but
// undoing a claim must be restricted to the browser that made it — anyone
// else viewing an already-claimed item must not be able to grief the claim.
//   AC-1: POST returns 404 for a nonexistent item
//   AC-2: POST returns 409 when already purchased
//   AC-3: POST claims the item and records the claimer's fingerprint
//   AC-4: DELETE returns 404 for a nonexistent item
//   AC-5: DELETE succeeds and clears the fingerprint when the same
//         fingerprint that claimed it requests the undo
//   AC-6: DELETE returns 403 when a DIFFERENT fingerprint tries to undo
//         someone else's claim (the core security fix)
//   AC-7: DELETE is permissive for legacy rows with no fingerprint on file
// ─────────────────────────────────────────────────────────────

const { mockFindUnique, mockUpdate, mockGetFingerprintHash } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockGetFingerprintHash: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    wishlistItem: { findUnique: mockFindUnique, update: mockUpdate },
  },
}));

vi.mock("@/lib/fingerprint", () => ({
  getFingerprintHash: mockGetFingerprintHash,
}));

import { POST, DELETE } from "@/app/api/wishlist/[id]/claim/route";

function makeRequest(method: "POST" | "DELETE") {
  return new Request("http://localhost/api/wishlist/item_1/claim", { method });
}
function ctx() {
  return { params: Promise.resolve({ id: "item_1" }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetFingerprintHash.mockReturnValue("fp_alice");
  mockUpdate.mockResolvedValue({});
});

describe("POST /api/wishlist/[id]/claim", () => {
  it("AC-1: 404 for a nonexistent item", async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await POST(makeRequest("POST"), ctx());
    expect(res.status).toBe(404);
  });

  it("AC-2: 409 when already purchased", async () => {
    mockFindUnique.mockResolvedValue({ id: "item_1", isPurchased: true, claimedByFingerprint: "fp_someone" });
    const res = await POST(makeRequest("POST"), ctx());
    expect(res.status).toBe(409);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("AC-3: claims the item and records the claimer's fingerprint", async () => {
    mockFindUnique.mockResolvedValue({ id: "item_1", isPurchased: false, claimedByFingerprint: null });
    const res = await POST(makeRequest("POST"), ctx());
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "item_1" },
        data: { isPurchased: true, claimedByFingerprint: "fp_alice" },
      }),
    );
  });
});

describe("DELETE /api/wishlist/[id]/claim", () => {
  it("AC-4: 404 for a nonexistent item", async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await DELETE(makeRequest("DELETE"), ctx());
    expect(res.status).toBe(404);
  });

  it("AC-5: succeeds and clears the fingerprint for the original claimer", async () => {
    mockFindUnique.mockResolvedValue({ id: "item_1", isPurchased: true, claimedByFingerprint: "fp_alice" });
    const res = await DELETE(makeRequest("DELETE"), ctx());
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "item_1" },
        data: { isPurchased: false, claimedByFingerprint: null },
      }),
    );
  });

  it("AC-6: 403 when a different fingerprint tries to undo someone else's claim", async () => {
    mockFindUnique.mockResolvedValue({ id: "item_1", isPurchased: true, claimedByFingerprint: "fp_someone_else" });
    const res = await DELETE(makeRequest("DELETE"), ctx());
    expect(res.status).toBe(403);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("AC-7: permissive for legacy rows with no fingerprint on file", async () => {
    mockFindUnique.mockResolvedValue({ id: "item_1", isPurchased: true, claimedByFingerprint: null });
    const res = await DELETE(makeRequest("DELETE"), ctx());
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalled();
  });
});
