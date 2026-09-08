import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getPacks } from "@/lib/content/packs";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: {
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  }[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/how-to-play", priority: 0.9, changeFrequency: "monthly" },
    { path: "/strategy", priority: 0.8, changeFrequency: "monthly" },
    { path: "/packs", priority: 0.8, changeFrequency: "monthly" },
    { path: "/games-like-spyfall", priority: 0.7, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
    { path: "/about", priority: 0.6, changeFrequency: "yearly" },
    { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
    { path: "/pricing", priority: 0.6, changeFrequency: "monthly" },
    { path: "/leaderboard", priority: 0.5, changeFrequency: "daily" },
    { path: "/rooms", priority: 0.5, changeFrequency: "always" },
    { path: "/local/setup", priority: 0.6, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  ];

  const packRoutes = getPacks().map((pack) => ({
    url: `${SITE_URL}/packs/${pack.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    ...staticRoutes.map((route) => ({
      url: `${SITE_URL}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...packRoutes,
  ];
}
