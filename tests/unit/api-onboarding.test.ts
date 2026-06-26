import { describe, it, expect, vi, beforeEach } from "vitest";

// ─────────────────────────────────────────────────────────────
// Acceptance criteria (F-08 — Account / Onboarding API):
//   AC-1: POST /api/onboarding returns 401 when not authenticated
//   AC-2: Returns 400 when required fields are missing
//   AC-3: Returns 400 when username format is invalid
//   AC-4: Returns 409 when username is already taken
//   AC-5: Returns 200 with user object on success
// ─────────────────────────────────────────────────────────────

// vi.hoisted ensures mock vars are initialised before vi.mock hoisting
const { mockFindUnique, mockUpsert } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockUpsert: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
      upsert: mockUpsert,
    },
  },
}));

const { mockAuth, mockCurrentUser } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCurrentUser: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
}));

import { POST } from "@/app/api/onboarding/route";

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => { vi.clearAllMocks(); });

describe("POST /api/onboarding", () => {
  it("AC-1: returns 401 when user is not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await POST(makeRequest({ displayName: "Amara", birthdayMonth: 6, birthdayDay: 27, username: "amara" }));
    expect(res.status).toBe(401);
  });

  it("AC-2: returns 400 when fields are missing", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    const res = await POST(makeRequest({ displayName: "Amara" }));
    expect(res.status).toBe(400);
  });

  it("AC-3: returns 400 when username has invalid characters", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockCurrentUser.mockResolvedValue({ emailAddresses: [{ emailAddress: "amara@test.com" }], imageUrl: null });
    const res = await POST(makeRequest({ displayName: "Amara", birthdayMonth: 6, birthdayDay: 27, username: "hello world!" }));
    expect(res.status).toBe(400);
  });

  it("AC-3: returns 400 when username shorter than 3 characters", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockCurrentUser.mockResolvedValue({ emailAddresses: [{ emailAddress: "amara@test.com" }], imageUrl: null });
    const res = await POST(makeRequest({ displayName: "Amara", birthdayMonth: 6, birthdayDay: 27, username: "am" }));
    expect(res.status).toBe(400);
  });

  it("AC-4: returns 409 when username is already taken", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockCurrentUser.mockResolvedValue({ emailAddresses: [{ emailAddress: "amara@test.com" }], imageUrl: null });
    mockFindUnique.mockResolvedValue({ id: "existing_user", username: "amara" });
    const res = await POST(makeRequest({ displayName: "Amara", birthdayMonth: 6, birthdayDay: 27, username: "amara" }));
    expect(res.status).toBe(409);
  });

  it("AC-5: returns 200 with user object on success", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" });
    mockCurrentUser.mockResolvedValue({ emailAddresses: [{ emailAddress: "amara@test.com" }], imageUrl: null });
    mockFindUnique.mockResolvedValue(null);
    mockUpsert.mockResolvedValue({ id: "usr_1", clerkId: "user_1", username: "amara", displayName: "Amara", birthdayMonth: 6, birthdayDay: 27 });
    const res = await POST(makeRequest({ displayName: "Amara", birthdayMonth: 6, birthdayDay: 27, username: "amara" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.username).toBe("amara");
  });
});
