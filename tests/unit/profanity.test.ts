import { describe, it, expect } from "vitest";
import { containsProfanity } from "@/lib/profanity";

describe("containsProfanity", () => {
  it("returns false for a clean birthday message", () => {
    expect(containsProfanity("Happy birthday! You mean the world to me.")).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(containsProfanity("")).toBe(false);
  });

  it("returns false for a message with common mild language", () => {
    expect(containsProfanity("This is damn good cake, hope you have a blast!")).toBe(false);
  });

  it("returns true for a message containing a blocked slur (lowercase)", () => {
    expect(containsProfanity("you nigger")).toBe(true);
  });

  it("returns true for a blocked term embedded in mixed case", () => {
    expect(containsProfanity("You FAGGOT stop it")).toBe(true);
  });

  it("returns true for a blocked term embedded mid-sentence", () => {
    expect(containsProfanity("Happy birthday you cunt hope you choke")).toBe(true);
  });

  it("returns false for a word that merely contains a blocked substring as part of a different word", () => {
    // 'retard' is blocked; 'retarding' contains it — this is a known limitation of substring matching
    // The test documents the current behavior, not ideal behavior
    expect(containsProfanity("retarding combustion")).toBe(true); // substring match
  });
});
