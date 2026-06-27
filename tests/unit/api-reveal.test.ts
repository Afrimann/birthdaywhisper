import { describe, it, expect, vi, beforeEach } from "vitest";

// ─────────────────────────────────────────────────────────────
// Acceptance criteria (F-06 — Reveal message):
//   AC-1: Returns 401 when not authenticated
//   AC-2: Returns 404 when user not found in DB
//   AC-3: Returns 404 when message not found
//   AC-4: Returns 403 when message belongs to a different user
//   AC-5: Returns 200 and marks message as REVEALED
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

import { PATCH } from "@/app/api/messages/[id]/reveal/route";

const DB_USER    = { id: "db_user_1" };
const DB_MESSAGE = { id: "msg_1", recipientId: "db_user_1" };

function makeRequest() {
  return new Request("http://localhost/api/messages/msg_1/reveal", { method: "PATCH" });
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

describe("PATCH /api/messages/[id]/reveal", () => {
  it("AC-1: returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await PATCH(makeRequest(), makeCtx());
    expect(res.status).toBe(401);
    expect(mockMessageUpdate).not.toHaveBeenCalled();
  });

  it("AC-2: returns 404 when user not found in DB", async () => {
    mockUserFindUnique.mockResolvedValue(null);
    const res = await PATCH(makeRequest(), makeCtx());
    expect(res.status).toBe(404);
    expect(mockMessageUpdate).not.toHaveBeenCalled();
  });

  it("AC-3: returns 404 when message not found", async () => {
    mockMessageFindUnique.mockResolvedValue(null);
    const res = await PATCH(makeRequest(), makeCtx());
    expect(res.status).toBe(404);
    expect(mockMessageUpdate).not.toHaveBeenCalled();
  });

  it("AC-4: returns 403 when message belongs to a different user", async () => {
    mockMessageFindUnique.mockResolvedValue({ id: "msg_1", recipientId: "db_user_OTHER" });
    const res = await PATCH(makeRequest(), makeCtx());
    expect(res.status).toBe(403);
    expect(mockMessageUpdate).not.toHaveBeenCalled();
  });

  it("AC-5: returns 200 and marks message as REVEALED", async () => {
    const res = await PATCH(makeRequest(), makeCtx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockMessageUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "REVEALED" }),
      })
    );
  });
});
