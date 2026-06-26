import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OnboardingPage from "@/app/onboarding/page";

// ─────────────────────────────────────────────────────────────
// Acceptance criteria (F-08 — Onboarding):
//   AC-1: User can enter a display name and advance to step 2
//   AC-2: Name field rejects input shorter than 2 characters
//   AC-3: Step 2 shows month and day selects
//   AC-4: Cannot advance from step 2 without selecting both month and day
//   AC-5: Step 3 shows the username input prefixed with the domain
//   AC-6: Username is auto-suggested from the display name
//   AC-7: Username input strips invalid characters (non-alphanumeric/underscore)
// ─────────────────────────────────────────────────────────────

// Mock fetch for username check and onboarding API
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("Onboarding — Step 1 (Name)", () => {
  it("AC-1: renders name input and Next button", () => {
    render(<OnboardingPage />);
    expect(screen.getByPlaceholderText("Your name...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
  });

  it("AC-2: Next button is disabled when name is empty", () => {
    render(<OnboardingPage />);
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("AC-2: Next button is disabled when name is 1 character", async () => {
    render(<OnboardingPage />);
    await userEvent.type(screen.getByPlaceholderText("Your name..."), "A");
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("AC-1: Next button is enabled when name has 2+ characters", async () => {
    render(<OnboardingPage />);
    await userEvent.type(screen.getByPlaceholderText("Your name..."), "Amara");
    expect(screen.getByRole("button", { name: /next/i })).toBeEnabled();
  });

  it("AC-1: clicking Next advances to step 2", async () => {
    render(<OnboardingPage />);
    await userEvent.type(screen.getByPlaceholderText("Your name..."), "Amara");
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText(/when.*birthday/i)).toBeInTheDocument();
  });
});

describe("Onboarding — Step 2 (Birthday)", () => {
  async function goToStep2(name = "Amara") {
    render(<OnboardingPage />);
    await userEvent.type(screen.getByPlaceholderText("Your name..."), name);
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
  }

  it("AC-3: shows exactly two selectors (month and day)", async () => {
    await goToStep2();
    const selects = screen.getAllByRole("combobox");
    expect(selects).toHaveLength(2);
  });

  it("AC-4: Next button is disabled until both month and day are selected", async () => {
    await goToStep2();
    const [monthSelect] = screen.getAllByRole("combobox");
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();

    // Select only month
    await userEvent.selectOptions(monthSelect, "6");
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("AC-4: Next button enables after both month and day selected", async () => {
    await goToStep2();
    const [monthSelect, daySelect] = screen.getAllByRole("combobox");
    await userEvent.selectOptions(monthSelect, "6");
    await userEvent.selectOptions(daySelect, "27");
    expect(screen.getByRole("button", { name: /next/i })).toBeEnabled();
  });
});

describe("Onboarding — Step 3 (Username)", () => {
  async function goToStep3(name = "Amara Okafor") {
    render(<OnboardingPage />);
    await userEvent.type(screen.getByPlaceholderText("Your name..."), name);
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    const [monthSelect, daySelect] = screen.getAllByRole("combobox");
    await userEvent.selectOptions(monthSelect, "6");
    await userEvent.selectOptions(daySelect, "27");
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
  }

  it("AC-5: shows domain prefix", async () => {
    await goToStep3();
    expect(screen.getByText(/birthdaywhisper\.com\/b\//i)).toBeInTheDocument();
  });

  it("AC-6: auto-suggests a username from the display name", async () => {
    await goToStep3("Amara Okafor");
    const input = screen.getByPlaceholderText("yourname") as HTMLInputElement;
    // Should suggest 'amaraokafor' (lowercased, spaces removed)
    expect(input.value).toBe("amaraokafor");
  });

  it("AC-7: strips invalid characters from username input", async () => {
    await goToStep3();
    const input = screen.getByPlaceholderText("yourname") as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, "hello world!");
    // Spaces and ! should be stripped
    expect(input.value).toBe("helloworld");
  });
});
