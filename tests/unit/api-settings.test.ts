import { describe, it, expect, vi, beforeEach } from "vitest";

// ─────────────────────────────────────────────────────────────
// Acceptance criteria (F-05 — Edit settings):
//   AC-1: Returns 401 when not authenticated
//   AC-2: Returns 400 when displayName is too short
//   AC-3: Returns 400 when username is invalid format
//   AC-4: Returns 400 when birthday month is out of range
//   AC-5: Returns 400 when birthday day is out of range
//   AC-6: Returns 404 when user is not found in DB
//   AC-7: Returns 409 when username is taken by another user
//   AC-8: Returns 200 and updates when username is unchanged
//   AC-9: Returns 200 on a valid update with new username
// ─────────────────────────────────────────────────────────────

const { mockAuth, mockUserFindUnique, mockUserUpdate } = vi.hoisted(() => ({
  mockAuth:           vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockUserUpdate:     vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
      update:     mockUserUpdate,
    },
  },
}));

import { PATCH } from "@/app/api/settings/route";

const CURRENT_USER = { id: "db_user_1", username: "peter" };

const VALID_BODY = {
  displayName:   "Peter O",
  birthdayMonth: 6,
  birthdayDay:   27,
  username:      "peter",
};

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/settings", {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: "clerk_user_1" });
  // First call: find current user. Second call (on username change): find conflict.
  mockUserFindUnique.mockResolvedValue(CURRENT_USER);
  mockUserUpdate.mockResolvedValue({});
});

describe("PATCH /api/settings", () => {
  it("AC-1: returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await PATCH(makeRequest(VALID_BODY));
    expect(res.status).toBe(401);
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("AC-2: returns 400 when displayName is too short", async () => {
    const res = await PATCH(makeRequest({ ...VALID_BODY, displayName: "A" }));
    expect(res.status).toBe(400);
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("AC-3: returns 400 when username has invalid characters", async () => {
    const res = await PATCH(makeRequest({ ...VALID_BODY, username: "peter!" }));
    expect(res.status).toBe(400);
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("AC-3: returns 400 when username is too short", async () => {
    const res = await PATCH(makeRequest({ ...VALID_BODY, username: "ab" }));
    expect(res.status).toBe(400);
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("AC-4: returns 400 when birthdayMonth is out of range", async () => {
    const res = await PATCH(makeRequest({ ...VALID_BODY, birthdayMonth: 13 }));
    expect(res.status).toBe(400);
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("AC-5: returns 400 when birthdayDay is out of range", async () => {
    const res = await PATCH(makeRequest({ ...VALID_BODY, birthdayDay: 0 }));
    expect(res.status).toBe(400);
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("AC-6: returns 404 when user not in DB", async () => {
    mockUserFindUnique.mockResolvedValue(null);
    const res = await PATCH(makeRequest(VALID_BODY));
    expect(res.status).toBe(404);
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("AC-7: returns 409 when new username is taken by another user", async () => {
    // First call → current user; second call → conflict user (different id)
    mockUserFindUnique
      .mockResolvedValueOnce(CURRENT_USER)
      .mockResolvedValueOnce({ id: "db_user_2" });
    const res = await PATCH(makeRequest({ ...VALID_BODY, username: "taken_name" }));
    expect(res.status).toBe(409);
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("AC-8: returns 200 and updates when username is unchanged", async () => {
    const res = await PATCH(makeRequest(VALID_BODY)); // username same as CURRENT_USER.username
    expect(res.status).toBe(200);
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ displayName: "Peter O", username: "peter" }),
      })
    );
  });

  it("AC-9: returns 200 on valid update with new (available) username", async () => {
    // First call → current user; second call → no conflict
    mockUserFindUnique
      .mockResolvedValueOnce(CURRENT_USER)
      .mockResolvedValueOnce(null);
    const res = await PATCH(makeRequest({ ...VALID_BODY, username: "peter_new" }));
    expect(res.status).toBe(200);
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ username: "peter_new" }),
      })
    );
  });
});
