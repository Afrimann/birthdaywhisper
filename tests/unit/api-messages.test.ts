import { describe, it, expect, vi, beforeEach } from "vitest";

// ─────────────────────────────────────────────────────────────
// Acceptance criteria (F-03 — Send message):
//   AC-1:  Returns 201 on a valid anonymous message
//   AC-2:  Returns 400 when content is empty
//   AC-3:  Returns 400 when content exceeds 500 characters
//   AC-4:  Returns 400 when recipientId is missing
//   AC-5:  Returns 404 when recipient does not exist in DB
//   AC-6:  Returns 429 when an authed sender hits the 5/hour rate limit
//   AC-6b: Returns 429 with needsAccount=true when a guest sends a second message
//   AC-7:  Saves isAnonymous=true by default; strips senderName
//   AC-8:  Saves senderName when isAnonymous=false
//   AC-9:  Returns 422 when content fails the profanity filter
// ─────────────────────────────────────────────────────────────

const {
  mockAuth,
  mockUserFindUnique,
  mockSessionFindUnique,
  mockMessageCreate,
  mockSessionUpsert,
  mockContainsProfanity,
} = vi.hoisted(() => ({
  mockAuth:              vi.fn().mockResolvedValue({ userId: "user_1" }),
  mockUserFindUnique:    vi.fn(),
  mockSessionFindUnique: vi.fn(),
  mockMessageCreate:     vi.fn(),
  mockSessionUpsert:     vi.fn(),
  mockContainsProfanity: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth:                mockAuth,
  currentUser:         vi.fn(),
  clerkMiddleware:     (fn: unknown) => fn,
  createRouteMatcher:  () => () => false,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user:          { findUnique: mockUserFindUnique },
    senderSession: { findUnique: mockSessionFindUnique, upsert: mockSessionUpsert },
    message:       { create: mockMessageCreate },
  },
}));

vi.mock("@/lib/profanity", () => ({
  containsProfanity: mockContainsProfanity,
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
  mockAuth.mockResolvedValue({ userId: "user_1" }); // signed in by default
  mockUserFindUnique.mockResolvedValue(RECIPIENT);
  mockSessionFindUnique.mockResolvedValue(null); // no prior session
  mockMessageCreate.mockResolvedValue({});
  mockSessionUpsert.mockResolvedValue({});
  mockContainsProfanity.mockReturnValue(false); // clean by default
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

  it("AC-6: returns 429 when authed sender hits the 5/hour rate limit", async () => {
    mockSessionFindUnique.mockResolvedValue({
      messageCount: 5,
      lastSentAt:   new Date(),
    });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.needsAccount).toBe(false);
    expect(mockMessageCreate).not.toHaveBeenCalled();
  });

  it("AC-6b: returns 429 with needsAccount=true when guest sends a second message", async () => {
    mockAuth.mockResolvedValueOnce({ userId: null }); // guest
    mockSessionFindUnique.mockResolvedValue({
      messageCount: 1,
      lastSentAt:   new Date(),
    });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.needsAccount).toBe(true);
    expect(mockMessageCreate).not.toHaveBeenCalled();
  });

  it("AC-6: guest can send first message (no prior session)", async () => {
    mockAuth.mockResolvedValueOnce({ userId: null }); // guest
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(201);
  });

  it("AC-6: allows send when previous session window has expired", async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    mockSessionFindUnique.mockResolvedValue({
      messageCount: 5,
      lastSentAt:   twoHoursAgo,
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

  it("AC-9: returns 422 when content fails the profanity filter", async () => {
    mockContainsProfanity.mockReturnValue(true);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(422);
    expect(mockMessageCreate).not.toHaveBeenCalled();
  });
});
