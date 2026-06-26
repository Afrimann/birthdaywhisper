import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  redirect: vi.fn(),
}));

// Mock next/font/google — returns CSS variable names
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter", className: "inter" }),
  Playfair_Display: () => ({ variable: "--font-playfair", className: "playfair" }),
  Dancing_Script: () => ({ variable: "--font-dancing", className: "dancing" }),
}));

// Mock Clerk
vi.mock("@clerk/nextjs", () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useUser: () => ({ user: { id: "user_1", firstName: "Amara" }, isLoaded: true }),
  useAuth: () => ({ userId: "user_1", isLoaded: true }),
  SignIn: () => null,
  SignUp: () => null,
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "user_1" }),
  currentUser: vi.fn().mockResolvedValue({
    id: "user_1",
    firstName: "Amara",
    emailAddresses: [{ emailAddress: "amara@test.com" }],
    imageUrl: null,
  }),
  clerkMiddleware: (fn: unknown) => fn,
  createRouteMatcher: () => () => false,
}));
