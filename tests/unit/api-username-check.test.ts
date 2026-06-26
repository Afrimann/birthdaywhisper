import { describe, it, expect, vi, beforeEach } from "vitest";

// ─────────────────────────────────────────────────────────────
// Acceptance criteria (F-02 — Username availability check):
//   AC-1: Returns { available: true } for an unused valid username
//   AC-2: Returns { available: false } for a taken username
//   AC-3: Returns { available: false } for usernames shorter than 3 chars
//   AC-4: Returns { available: false } for usernames with invalid characters
//   AC-5: Returns { available: false } for usernames longer than 30 chars
//   AC-6: Allows underscores
// ─────────────────────────────────────────────────────────────

const { mockFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
    },
  },
}));

import { GET } from "@/app/api/username/check/route";

function makeRequest(username: string) {
  return new Request(`http://localhost/api/username/check?username=${encodeURIComponent(username)}`);
}

beforeEach(() => { vi.clearAllMocks(); });

describe("GET /api/username/check", () => {
  it("AC-1: returns available:true for a free valid username", async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await GET(makeRequest("amara"));
    const body = await res.json();
    expect(body.available).toBe(true);
  });

  it("AC-2: returns available:false for a taken username", async () => {
    mockFindUnique.mockResolvedValue({ id: "usr_1", username: "amara" });
    const res = await GET(makeRequest("amara"));
    const body = await res.json();
    expect(body.available).toBe(false);
  });

  it("AC-3: returns available:false for username shorter than 3 chars", async () => {
    const res = await GET(makeRequest("am"));
    const body = await res.json();
    expect(body.available).toBe(false);
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("AC-4: returns available:false for username with spaces", async () => {
    const res = await GET(makeRequest("hello world"));
    const body = await res.json();
    expect(body.available).toBe(false);
  });

  it("AC-4: returns available:false for username with special chars", async () => {
    const res = await GET(makeRequest("hello!@#"));
    const body = await res.json();
    expect(body.available).toBe(false);
  });

  it("AC-5: returns available:false for username longer than 30 chars", async () => {
    const res = await GET(makeRequest("a".repeat(31)));
    const body = await res.json();
    expect(body.available).toBe(false);
  });

  it("AC-6: allows underscores in username", async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await GET(makeRequest("amara_okafor"));
    const body = await res.json();
    expect(body.available).toBe(true);
  });
});
