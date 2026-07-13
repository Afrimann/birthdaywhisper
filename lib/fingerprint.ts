import { createHash } from "crypto";

export function getFingerprintHash(req: Request): string {
  // x-forwarded-for is a comma-separated hop chain, left-to-right from
  // furthest to closest. The leftmost entry is whatever the original client
  // claimed (trivially spoofable — a client can send any value there before
  // it reaches our infra), while each trusted proxy in front of this app
  // APPENDS its own observed peer IP to the right. The rightmost entry is
  // therefore the one our own infra actually observed, so that's the only
  // value safe to key rate limiting off of.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  return createHash("sha256").update(ip).digest("hex");
}
