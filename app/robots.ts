import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/b/", "/sign-in", "/sign-up"],
        disallow: [
          "/dashboard",
          "/settings",
          "/jar",
          "/wishlist",
          "/following",
          "/notifications",
          "/reveal",
          "/onboarding",
          "/sso-callback",
          "/api/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
