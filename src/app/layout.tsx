import type { Metadata, Viewport } from "next";
import { Anek_Latin, Anek_Tamil, Science_Gothic } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/SmoothScroll";
import { TradeProvider } from "@/components/TradeProvider";
import { Cursor } from "@/components/Cursor";
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

const title = `${BRAND}: websites, WhatsApp replies and booking for Chennai shops`;
const description =
  "We build websites, WhatsApp replies and online booking for clinics, gyms and salons in Chennai. Your customers get an answer when you can't."; // TODO: confirm services.

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  openGraph: {
    title: "Shutter down. Still taking bookings.",
    description,
    type: "website",
    locale: "en_IN",
    siteName: BRAND,
  },
  twitter: {
    card: "summary_large_image",
    title: "Shutter down. Still taking bookings.",
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#0A1128",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${science.variable} ${anek.variable} ${anekTamil.variable}`}>
      <body>
        <a href="#content" className="skip">
          Skip to content
        </a>
        <TradeProvider>
          <SmoothScroll>{children}</SmoothScroll>
        </TradeProvider>
        <Cursor />
      </body>
    </html>
  );
}
