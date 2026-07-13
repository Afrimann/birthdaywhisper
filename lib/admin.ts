export function isAdminUserId(clerkId: string | null | undefined): boolean {
  if (!clerkId) return false;
  const allowlist = (process.env.ADMIN_CLERK_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return allowlist.includes(clerkId);
}
