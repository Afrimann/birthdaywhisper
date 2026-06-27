import { describe, it, expect, vi, beforeEach } from "vitest";

// ─────────────────────────────────────────────────────────────
// Acceptance criteria (F-07 — React to message):
//   AC-1: Returns 401 when not authenticated
//   AC-2: Returns 400 when emoji is not in the allowed set
//   AC-3: Returns 404 when message not found
//   AC-4: Returns 403 when message belongs to a different user
//   AC-5: Returns 200 and saves the reaction emoji
// ─────────────────────────────────────────────────────────────

const { mockAuth, mockUserFindUnique, mockMessageFindUnique, mockMessageUpdate } = vi.hoisted(() => ({
  mockAuth:              vi.fn(),
  mockUserFindUnique:    vi.fn(),
  mockMessageFindUnique: vi.fn(),
  mockMessageUpdate:     vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user:    { findUnique: mockUserFindUnique },
    message: { findUnique: mockMessageFindUnique, update: mockMessageUpdate },
  },
}));

import { PATCH } from "@/app/api/messages/[id]/react/route";

const DB_USER    = { id: "db_user_1" };
const DB_MESSAGE = { id: "msg_1", recipientId: "db_user_1" };

function makeRequest(emoji: unknown) {
  return new Request("http://localhost/api/messages/msg_1/react", {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ emoji }),
  });
}

function makeCtx(id = "msg_1") {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: "clerk_1" });
  mockUserFindUnique.mockResolvedValue(DB_USER);
  mockMessageFindUnique.mockResolvedValue(DB_MESSAGE);
  mockMessageUpdate.mockResolvedValue({});
});

describe("PATCH /api/messages/[id]/react", () => {
  it("AC-1: returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await PATCH(makeRequest("🥰"), makeCtx());
    expect(res.status).toBe(401);
    expect(mockMessageUpdate).not.toHaveBeenCalled();
  });

  it("AC-2: returns 400 when emoji is not in the allowed set", async () => {
    const res = await PATCH(makeRequest("👻"), makeCtx());
    expect(res.status).toBe(400);
    expect(mockMessageUpdate).not.toHaveBeenCalled();
  });

  it("AC-2: returns 400 when emoji is missing", async () => {
    const res = await PATCH(makeRequest(null), makeCtx());
    expect(res.status).toBe(400);
    expect(mockMessageUpdate).not.toHaveBeenCalled();
  });

  it("AC-3: returns 404 when message not found", async () => {
    mockMessageFindUnique.mockResolvedValue(null);
    const res = await PATCH(makeRequest("🔥"), makeCtx());
    expect(res.status).toBe(404);
    expect(mockMessageUpdate).not.toHaveBeenCalled();
  });

  it("AC-4: returns 403 when message belongs to a different user", async () => {
    mockMessageFindUnique.mockResolvedValue({ id: "msg_1", recipientId: "db_user_OTHER" });
    const res = await PATCH(makeRequest("💖"), makeCtx());
    expect(res.status).toBe(403);
    expect(mockMessageUpdate).not.toHaveBeenCalled();
  });

  it("AC-5: returns 200 and saves the reaction emoji", async () => {
    const res = await PATCH(makeRequest("🥰"), makeCtx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockMessageUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ reactionEmoji: "🥰" }),
      })
    );
  });

  it("AC-5: saves each of the six allowed reactions", async () => {
    const allowed = ["🥰", "😭", "🤣", "🔥", "💖", "🫶"];
    for (const emoji of allowed) {
      vi.clearAllMocks();
      mockAuth.mockResolvedValue({ userId: "clerk_1" });
      mockUserFindUnique.mockResolvedValue(DB_USER);
      mockMessageFindUnique.mockResolvedValue(DB_MESSAGE);
      mockMessageUpdate.mockResolvedValue({});

      const res = await PATCH(makeRequest(emoji), makeCtx());
      expect(res.status).toBe(200);
    }
  });
});
