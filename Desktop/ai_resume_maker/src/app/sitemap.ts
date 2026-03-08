// src/app/sitemap.ts
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://freefreecv.com";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/templates`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/auth/login`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/auth/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  const landingPages = [
    "software-engineer",
    "product-manager",
    "fresher",
    "data-analyst",
    "ats",
    "marketing",
    "nurse",
    "teacher",
    "designer",
  ].map((slug) => ({
    url: `${base}/resume-templates/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const noSignupPage: MetadataRoute.Sitemap = [
    { url: `${base}/resume-builder/no-sign-up`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];

  return [...staticRoutes, ...landingPages, ...noSignupPage];
}
