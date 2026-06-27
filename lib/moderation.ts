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
  if (!client) return false;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 10,
      system: `You moderate birthday messages sent to someone on their birthday. Reply with exactly one word: FLAGGED or CLEAN.

FLAGGED: hate speech, slurs, explicit sexual content, threats, wishes of harm, or insults directed at the recipient — including "fuck you", "I hate you", "you're ugly", "go die", or any message clearly meant to hurt.
CLEAN: compliments, well-wishes, heartfelt words, funny messages, or positively-used profanity like "you're fucking amazing".`,
      messages: [{ role: "user", content: text }],
    });

    const result = (response.content[0] as { type: string; text: string }).text.trim().toUpperCase();
    return result.startsWith("FLAGGED");
  } catch (err) {
    console.error("[moderation] Anthropic error:", err);
    return false;
  }
}
