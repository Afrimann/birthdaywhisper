/**
 * Returns the canonical base URL for the current environment.
 *
 * Priority:
 * 1. NEXT_PUBLIC_APP_URL  — explicit override (set this to your custom domain)
 * 2. VERCEL_URL           — auto-set by Vercel for every deployment (no HTTPS prefix)
 * 3. localhost:3000       — local dev fallback
 *
 * VERCEL_URL is server-side only. Since this utility is called from server
 * components, that is fine — the resolved URL is passed down as a prop to
 * any client components that need it.
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

/**
 * Returns the shareable URL for a user's birthday page.
 *
 * When NEXT_PUBLIC_SHARE_URL is set (e.g. https://bdwpr.com), share surfaces
 * emit `https://bdwpr.com/<username>` and proxy.ts 308-redirects those to the
 * canonical /b/<username> page. Until the short domain is configured, this
 * falls back to the canonical URL, so it is safe to use unconditionally.
 */
export function getShareUrl(username: string): string {
  const short = process.env.NEXT_PUBLIC_SHARE_URL;
  if (short) {
    return `${short.replace(/\/+$/, "")}/${username}`;
  }
  return `${getBaseUrl()}/b/${username}`;
}
