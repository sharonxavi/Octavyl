import type { Metadata } from "next";
import { TradeProvider } from "@/components/TradeProvider";
import { Hero } from "@/components/sections/Hero";
import { Night } from "@/components/sections/Night";
import { Build } from "@/components/sections/Build";
import { Process } from "@/components/sections/Process";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { pageMeta } from "@/lib/meta";
import { BRAND } from "@/content/site";

export const metadata: Metadata = pageMeta({
  title: `See it for your business | ${BRAND}`,
  description:
    "Pick your trade and watch a sample night: messages that arrive after closing get answered and booked into tomorrow's free slots.", // TODO: confirm services.
  path: "/solutions",
  card: "Shutter down. Still taking bookings.",
});

/**
 * The industry experience, unchanged from the original single page.
 * /solutions?type=salon (or clinic, gym, lab, optician) opens with that trade chosen;
 * the trade is read in the browser, so the page stays static (it also runs on GitHub Pages).
 */
export default function SolutionsPage() {
  return (
    <TradeProvider>
      <main id="content">
        <Hero />
        <Night />
        <Build />
        <Process />
        <About />
        <Contact />
      </main>
    </TradeProvider>
  );
}
