import type { Metadata } from "next";
import { BRAND } from "@/content/site";

/** Title, description, canonical and social cards for one route. Images come from each route's opengraph-image file. */
export function pageMeta({ title, description, path, card }: { title: string; description: string; path: string; card?: string }): Metadata {
  const social = card ?? title;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: { title: social, description, url: path, type: "website", locale: "en_IN", siteName: BRAND },
    twitter: { card: "summary_large_image", title: social, description },
  };
}
