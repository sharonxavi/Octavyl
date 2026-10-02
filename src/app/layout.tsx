import type { Metadata, Viewport } from "next";
import { Anek_Latin, Anek_Tamil, Science_Gothic } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Cursor } from "@/components/Cursor";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/shell/Footer";
import { PageTransition } from "@/components/shell/PageTransition";
import { BRAND, SITE_URL } from "@/content/site";

// Headlines, the register, the clock, the shutter lettering. Width axis only: it carries meaning.
const science = Science_Gothic({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-science",
  display: "swap",
  // Too new for Next to know its metrics, so no generated fallback face.
  adjustFontFallback: false,
});

// Body, UI and the customers' own words.
const anek = Anek_Latin({
  subsets: ["latin"],
  variable: "--font-anek",
  display: "swap",
});

// Same design in Tamil, only fetched when Tamil text appears (the demo reply).
const anekTamil = Anek_Tamil({
  subsets: ["tamil"],
  variable: "--font-anek-tamil",
  display: "swap",
  preload: false,
});

// Each page sets its own title, description and card (see src/lib/meta.ts).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: BRAND, template: `%s | ${BRAND}` },
  openGraph: { type: "website", locale: "en_IN", siteName: BRAND },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0A1128",
  colorScheme: "dark",
};

/**
 * One shell for every page: smooth scroll, the shutter transition, the nav,
 * the footer and the cursor live here and persist across routes.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${science.variable} ${anek.variable} ${anekTamil.variable}`}>
      <body>
        <a href="#content" className="skip">
          Skip to content
        </a>
        <SmoothScroll>
          <PageTransition>
            <Nav />
            {children}
            <Footer />
          </PageTransition>
        </SmoothScroll>
        <Cursor />
      </body>
    </html>
  );
}
