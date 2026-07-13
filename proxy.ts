import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/url";

// Host of the short share domain (e.g. bdwpr.com), if configured.
const SHARE_HOST = process.env.NEXT_PUBLIC_SHARE_URL
  ? new URL(process.env.NEXT_PUBLIC_SHARE_URL).host
  : null;

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/onboarding(.*)",
  "/reveal(.*)",
  "/jar(.*)",
  "/wishlist(.*)",
  "/following(.*)",
  "/settings(.*)",
  "/payouts(.*)",
  "/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Short share domain: bdwpr.com/<username> → birthdaywhisper.com/b/<username>
  const host = req.headers.get("host");
  if (SHARE_HOST && host && (host === SHARE_HOST || host === `www.${SHARE_HOST}`)) {
    const username = req.nextUrl.pathname.split("/")[1]?.toLowerCase() ?? "";
    const dest = /^[a-z0-9_]{3,30}$/.test(username)
      ? `${getBaseUrl()}/b/${username}`
      : getBaseUrl();
    return NextResponse.redirect(dest, 308);
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
