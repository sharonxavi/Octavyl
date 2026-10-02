import type { Metadata } from "next";
import { pageMeta } from "@/lib/meta";
import { HOME_META } from "@/content/home";
import { HomeHero } from "@/components/home/HomeHero";
import { Manifesto } from "@/components/home/Manifesto";
import { Services } from "@/components/home/Services";
import { HowWeWork } from "@/components/home/HowWeWork";
import { Industries } from "@/components/home/Industries";
import { AboutHome } from "@/components/home/AboutHome";
import { Work } from "@/components/home/Work";
import { Faq } from "@/components/home/Faq";
import { ContactHome } from "@/components/home/ContactHome";

export const metadata: Metadata = pageMeta({
  title: HOME_META.title,
  description: HOME_META.description,
  path: "/",
  card: HOME_META.card,
});

/** Who we are and what we build. The trade-by-trade sample lives at /solutions. */
export default function Home() {
  return (
    <main id="content">
      <HomeHero />
      <Manifesto />
      <Services />
      <HowWeWork />
      <Industries />
      <AboutHome />
      <Work />
      <Faq />
      <ContactHome />
    </main>
  );
}
