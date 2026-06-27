import Anthropic from "@anthropic-ai/sdk";
import { containsProfanity } from "./profanity";

let _client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!_client) _client = new Anthropic();
  return _client;
}

export async function moderateContent(text: string): Promise<boolean> {
  // Local block-list first — instant, no network cost
  if (containsProfanity(text)) return true;

  const client = getClient();
  if (!client) return false; // No API key — local check only

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 64,
      system: `You are a content moderator for a birthday message platform. Messages can be emotional, funny, heartfelt, or use mild profanity between friends — those are fine. Flag ONLY: hate speech, explicit sexual content, death threats, harassment, or spam. Reply with JSON only, no other text: {"flagged": true} or {"flagged": false}`,
      messages: [{ role: "user", content: text }],
    });

    const raw = (response.content[0] as { type: string; text: string }).text.trim();
    const parsed = JSON.parse(raw) as { flagged: boolean };
    return parsed.flagged === true;
  } catch {
    // API down or malformed response — fail open so legitimate messages aren't blocked
    return false;
  }
}
