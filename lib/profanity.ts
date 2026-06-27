// Minimal block list — targets unambiguous hate speech only.
// General profanity is intentionally excluded; human moderation via isReported handles edge cases.
const BLOCKED: readonly string[] = [
  "nigger",
  "nigga",
  "faggot",
  "cunt",
  "kike",
  "spic",
  "chink",
  "wetback",
  "tranny",
  "retard",
];

export function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED.some((term) => lower.includes(term));
}
