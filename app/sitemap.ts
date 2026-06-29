export const dynamic = "force-dynamic";

import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  const users = await prisma.user
    .findMany({ select: { username: true, updatedAt: true } })
    .catch(() => []);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/sign-up`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/sign-in`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const userRoutes: MetadataRoute.Sitemap = users.map((u) => ({
    url: `${baseUrl}/b/${u.username}`,
    lastModified: u.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...userRoutes];
}
