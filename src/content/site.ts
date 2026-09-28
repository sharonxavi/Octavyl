/**
 * Every company-specific fact on the site lives in this file or in trades.ts.
 * Lines marked TODO are placeholders written from the ICP in Lead Trial/ICP.md.
 * Run `npm run todos` for the full list with line numbers.
 */

export const BRAND = "Octavyl"; // TODO: confirm spelling. The ICP writes "Octaavyl".
export const LEGAL_NAME = "Octavyl AI Solutions"; // TODO: confirm the registered name for the footer.

/** Booking link for every "Book a call" button. Null falls back to WhatsApp. */
export const BOOKING_URL: string | null = null; // TODO: real booking link (Cal.com, Calendly or a form).

export const WHATSAPP_NUMBER = ""; // TODO: WhatsApp number, digits only with country code, e.g. 919800000000.
export const PHONE_DISPLAY = "+91 XXXXX XXXXX"; // TODO: phone number as it should be painted on the shutter.
export const EMAIL = "hello@example.com"; // TODO: real email address.
export const AREA = "Chennai, Tamil Nadu"; // TODO: street address if you want one shown.
export const HOURS = "Mon to Sat, 10am to 7pm"; // TODO: your real working hours.
export const SITE_URL = "https://octavyl.example"; // TODO: production domain, used for Open Graph URLs.

export const whatsappHref = (text: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

export const bookHref = () => BOOKING_URL ?? whatsappHref("Hi, I'd like to book a call about my shop."); // TODO: remove fallback once BOOKING_URL is set.

export const NAV = [
  { href: "#night", label: "A sample night" },
  { href: "#build", label: "What we build" },
  { href: "#process", label: "How we work" },
  { href: "#about", label: "About" },
] as const;

export const HERO = {
  lines: ["Shutter down.", "Still taking bookings."],
  // TODO: confirm services. This line assumes websites, WhatsApp replies and online booking.
  sub: "Websites, WhatsApp replies and online booking for Chennai clinics, gyms and salons. Your customers get an answer when you can't.",
  secondary: "See a sample night",
} as const;

export const NIGHT = {
  lead: "A sample night. Every message is the kind owners get when they're busy or closed.",
  with: "With Octavyl",
  without: "Without",
  handled: "Handled",
  waiting: "Waiting for you",
  label: "Sample night. Names are made up.",
  workTitle: "Real client nights go here.",
  // TODO: replace both slots with real client work, shared with the owner's permission.
  workLine: "After launch, with the owner's permission: bookings made after closing, per week, before and after.",
  workTag: "Placeholder",
  end: "Your shop could be the first one here.",
} as const;

export type BuildRow = { id: string; problem: string; piece: string; does: string };

export const BUILD = {
  title: "What's going wrong at your shop?",
  lead: "Tick what's true. We'll show what we'd build first.",
  panelTitle: "Your first build",
  empty: "Tick what's true. Most shops start with one.",
  price: "Most projects run INR 10k-1L. We quote after one call.", // TODO: confirm the range is fine to show.
  // TODO: confirm every row maps to something you sell.
  rows: [
    { id: "busy", problem: "We miss calls when we're busy.", piece: "Missed-call reply", does: "A WhatsApp reply to every missed call, with your booking link." },
    { id: "closed", problem: "Messages after closing wait till morning.", piece: "After-hours replies", does: "Answers timing and price questions and books a slot while you're closed." },
    { id: "paper", problem: "Our register is paper.", piece: "Online booking and records", does: "Customers pick a slot. You get one list with every customer's visits." },
    { id: "reviews", problem: "Google reviews go unanswered.", piece: "Review follow-up", does: "Every customer is asked for a review the next morning, not only the happy ones. You approve each reply." },
    { id: "ads", problem: "Our ads send people to Instagram.", piece: "Offer pages", does: "A page for each offer that takes the booking." },
    { id: "site", problem: "No website, or an old one.", piece: "A site that books", does: "Fast on a phone, easy to find on Google, takes bookings." },
  ] satisfies BuildRow[],
  demoTitle: "Try it: miss a call.",
  demoNote: "Sent from your own WhatsApp Business number, about 20 seconds after the missed call.", // TODO: confirm how replies are sent.
} as const;

export const PROCESS = {
  title: "What happens after you book.",
  lead: "Five steps. Your paper register stays until the new one works.",
  cols: ["What we do", "What you do", "When"],
  // TODO: confirm every step and timing.
  steps: [
    { verb: "Talk", we: "A short call about your busiest day and where customers slip away.", you: "Tell us how bookings arrive today.", when: "Day 1" },
    { verb: "Visit", we: "Sit at your front desk for a morning and watch a normal day.", you: "Carry on as usual.", when: "Week 1" },
    { verb: "Build", we: "Set up the site, replies, booking and records on your own number and accounts.", you: "Approve the wording.", when: "Weeks 1-3" },
    { verb: "Run together", we: "Run it beside your paper register for a week.", you: "Tell us what feels off.", when: "Week 4" },
    { verb: "Hand over", we: "Train you and your staff in Tamil or English.", you: "Call us when something breaks.", when: "Then monthly" },
  ],
} as const;

export const ABOUT = {
  title: "The person who builds it answers the phone.", // TODO: confirm this is true for your team.
  body: [
    "We're a small team in Chennai building websites, WhatsApp replies and booking systems for clinics, gyms and shops.", // TODO: team size, names, how you started.
    "Everything is set up on your own number and accounts, so it stays yours if you ever leave us.", // TODO: confirm accounts and numbers are set up in the client's name.
  ],
  facts: ["We work in Tamil and English.", "We come to your shop.", "You own the accounts and the number."], // TODO: confirm each fact.
  photoNote: "Photo placeholder: the founder at a client's counter.", // TODO: real photo with real alt text.
} as const;

export const CONTACT = {
  tagline: "Websites, WhatsApp replies and booking",
  title: "Bring us the notebook.",
  sub: "One call. You'll know what we'd build first and roughly what it costs.", // TODO: confirm call length and what happens on it.
  whatsapp: "WhatsApp us",
  painted: `Call ${PHONE_DISPLAY}`,
  last: "The shutter's down. This button still works.",
  footer: {
    visit: AREA,
    hours: HOURS,
    write: EMAIL,
    serving: "Serving Chennai and the rest of Tamil Nadu.",
  },
} as const;
