import { describe, it, expect, vi, beforeEach } from "vitest";

// ─────────────────────────────────────────────────────────────
// Acceptance criteria (F-03 — Send message):
//   AC-1: Returns 201 on a valid anonymous message
//   AC-2: Returns 400 when content is empty
//   AC-3: Returns 400 when content exceeds 500 characters
//   AC-4: Returns 400 when recipientId is missing
//   AC-5: Returns 404 when recipient does not exist in DB
//   AC-6: Returns 429 when the sender has hit the rate limit
//   AC-7: Saves isAnonymous=true by default; strips senderName
//   AC-8: Saves senderName when isAnonymous=false
// ─────────────────────────────────────────────────────────────

const {
  mockUserFindUnique,
  mockSessionFindUnique,
  mockMessageCreate,
  mockSessionUpsert,
} = vi.hoisted(() => ({
  mockUserFindUnique:    vi.fn(),
  mockSessionFindUnique: vi.fn(),
  mockMessageCreate:     vi.fn(),
  mockSessionUpsert:     vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user:          { findUnique: mockUserFindUnique },
    senderSession: { findUnique: mockSessionFindUnique, upsert: mockSessionUpsert },
    message:       { create: mockMessageCreate },
  },
}));

import { POST } from "@/app/api/messages/route";

const RECIPIENT = { id: "user_abc" };
const VALID_BODY = {
  recipientId:  "user_abc",
  content:      "Happy birthday! You mean the world to me.",
  isAnonymous:  true,
  senderName:   null,
  birthdayYear: 2026,
};

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/messages", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUserFindUnique.mockResolvedValue(RECIPIENT);
  mockSessionFindUnique.mockResolvedValue(null); // no prior session
  mockMessageCreate.mockResolvedValue({});
  mockSessionUpsert.mockResolvedValue({});
});

describe("POST /api/messages", () => {
  it("AC-1: returns 201 for a valid anonymous message", async () => {
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("AC-2: returns 400 when content is empty", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, content: "  " }));
    expect(res.status).toBe(400);
    expect(mockMessageCreate).not.toHaveBeenCalled();
  });

  it("AC-3: returns 400 when content exceeds 500 characters", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, content: "a".repeat(501) }));
    expect(res.status).toBe(400);
    expect(mockMessageCreate).not.toHaveBeenCalled();
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
    expect(mockMessageCreate).not.toHaveBeenCalled();
  });

  it("AC-6: returns 429 when rate limit is exceeded", async () => {
    mockSessionFindUnique.mockResolvedValue({
      messageCount: 5,
      lastSentAt:   new Date(), // within the last hour
    });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(429);
    expect(mockMessageCreate).not.toHaveBeenCalled();
  });

  it("AC-6: allows send when previous session window has expired", async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    mockSessionFindUnique.mockResolvedValue({
      messageCount: 5,
      lastSentAt:   twoHoursAgo, // outside the window
    });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(201);
  });

  it("AC-7: saves isAnonymous=true and nullifies senderName", async () => {
    await POST(makeRequest({ ...VALID_BODY, isAnonymous: true, senderName: "Peter" }));
    expect(mockMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isAnonymous: true, senderName: null }) })
    );
  });

  it("AC-8: saves senderName when isAnonymous=false", async () => {
    await POST(makeRequest({ ...VALID_BODY, isAnonymous: false, senderName: "Peter" }));
    expect(mockMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isAnonymous: false, senderName: "Peter" }) })
    );
  });
});
