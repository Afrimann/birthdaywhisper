export type NameMatchStrength = "NONE" | "WEAK" | "STRONG";

export interface NameMatchResult {
  strength: NameMatchStrength;
  sharedCount: number;
  requiredCount: number;
}

function normalizeName(name: string): Set<string> {
  return new Set(
    name
      .toUpperCase()
      .replace(/[^A-Z\s]/g, "")
      .split(/\s+/)
      .filter(Boolean),
  );
}

// Bank account legal names are frequently ordered differently than a chosen
// display name (e.g. "OKAFOR CHIDINMA JOY" vs. "Chidinma Okafor"), so this
// checks word overlap rather than exact/ordered equality.
//
// Tri-state, tightening the same rule rather than inventing a new number:
// - NONE:   doesn't clear the minimum overlap — rejected outright.
// - WEAK:   clears the minimum, but doesn't fully cover the shorter name's
//           words — plausibly a different person with a partial coincidental
//           overlap (e.g. shared first+last name, entirely different middle
//           name). Needs a human to look at it.
// - STRONG: fully covers the shorter name's words (e.g. an extra middle
//           name on the bank record is fine) — auto-approve, unchanged
//           from the original binary behavior.
export function matchNameStrength(resolvedName: string, displayName: string): NameMatchResult {
  const resolved = normalizeName(resolvedName);
  const display = normalizeName(displayName);
  const shared = [...resolved].filter((w) => display.has(w)).length;
  const required = resolved.size <= 1 || display.size <= 1 ? 1 : 2;
  const smaller = Math.min(resolved.size, display.size);

  if (shared < required) return { strength: "NONE", sharedCount: shared, requiredCount: required };
  if (shared === smaller) return { strength: "STRONG", sharedCount: shared, requiredCount: required };
  return { strength: "WEAK", sharedCount: shared, requiredCount: required };
}
