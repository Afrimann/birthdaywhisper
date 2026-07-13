import { describe, it, expect } from "vitest";
import { matchNameStrength } from "@/lib/nameMatch";

// ─────────────────────────────────────────────────────────────
// Acceptance criteria (tri-state name matching):
//   AC-1: STRONG when the bank name fully covers the shorter display name (extra middle name)
//   AC-2: WEAK when shared words clear the minimum but don't fully cover the shorter name
//   AC-3: NONE when shared words don't clear the minimum at all
//   AC-4: Word order doesn't matter
//   AC-5: Single-word names have no WEAK zone — they're either STRONG or NONE
//   AC-6: Punctuation/case differences don't affect matching
// ─────────────────────────────────────────────────────────────

describe("matchNameStrength", () => {
  it("AC-1: STRONG — bank record has an extra middle name covering the shorter side", () => {
    const result = matchNameStrength("OKAFOR CHIDINMA JOY", "Chidinma Okafor");
    expect(result.strength).toBe("STRONG");
    expect(result.sharedCount).toBe(2);
  });

  it("AC-2: WEAK — first+last match, middle name entirely different", () => {
    const result = matchNameStrength("AMARA CHIOMA OKEKE", "Amara Blessing Okeke");
    expect(result.strength).toBe("WEAK");
    expect(result.sharedCount).toBe(2);
  });

  it("AC-3: NONE — shared words don't clear the minimum", () => {
    const result = matchNameStrength("AMARA JOHN SMITH", "Amara Peters");
    expect(result.strength).toBe("NONE");
    expect(result.sharedCount).toBe(1);
  });

  it("AC-4: word order doesn't matter", () => {
    expect(matchNameStrength("SMITH JOHN", "John Smith").strength).toBe("STRONG");
  });

  it("AC-5: single-word names resolve to STRONG once they clear the minimum — no WEAK zone", () => {
    expect(matchNameStrength("CHIDINMA", "Chidinma Okafor").strength).toBe("STRONG");
    expect(matchNameStrength("Peters", "Chidinma").strength).toBe("NONE");
  });

  it("AC-6: punctuation and case differences don't affect matching", () => {
    expect(matchNameStrength("O'BRIEN-SMITH JOHN", "john o'brien-smith").strength).toBe("STRONG");
  });
});
