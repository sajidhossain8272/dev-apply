/* eslint-disable @typescript-eslint/no-explicit-any */
  import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const users = await prisma.user.findMany({
    where: { handle: { not: null }, profile: { isPublic: true } },
    select: { handle: true, updatedAt: true },
  });

  const userUrls: MetadataRoute.Sitemap = users.map((u:any) => ({
    url: `${baseUrl}/u/${u.handle}`,
    lastModified: u.updatedAt ?? new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...userUrls,
  ];
}
