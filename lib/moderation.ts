import { containsProfanity } from "./profanity";

export async function moderateContent(text: string): Promise<boolean> {
  // Local block-list first — instant, no network cost
  if (containsProfanity(text)) return true;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return false;

  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: text }),
    });

    if (!res.ok) {
      console.error("[moderation] OpenAI API error:", res.status, await res.text());
      return false;
    }

    const data = (await res.json()) as { results: { flagged: boolean }[] };
    return data.results[0]?.flagged === true;
  } catch (err) {
    console.error("[moderation] fetch error:", err);
    return false;
  }
}
