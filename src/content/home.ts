/**
 * Every line of copy on Home. Company facts live in site.ts; this file is the page's words.
 * Lines marked TODO need a real fact from you. Nothing here is a real client, quote or number.
 * House rules: plain words, short sentences, no hype. Run `npm run todos` for the full list.
 */
import { BRAND } from "./site";
import type { TradeId } from "./trades";

export const HOME_META = {
  title: `${BRAND}: AI agents that book, reply and follow up for Chennai businesses`,
  // TODO: confirm services and area.
  description:
    "We build AI agents for clinics, gyms, salons and shops in Chennai. They answer calls and WhatsApp, book appointments and follow up enquiries, on your own number, in Tamil and English.",
  card: "AI agents that book, reply and follow up.",
} as const;

/* ---------------------------------------------------------------- 1. hero */

export const HOME_HERO = {
  // Two lines, each revealed from its own mask. Keep the whole headline under ~10 words.
  lines: ["We build AI agents that", "book, reply and follow up."],
  // TODO: confirm the channels and languages you actually support.
  sub: "For clinics, gyms, salons and shops in Chennai. They work on your own WhatsApp number, in Tamil and English, and pass anything unusual to you.",
  secondary: "See it for your business",
  legend: [
    { kind: "customer", label: "A customer's message" },
    { kind: "agent", label: "An agent" },
    { kind: "calendar", label: "A booked slot" },
  ],
  legendNote: "Each moving light is one message on its way to a booking.",
  cue: "Scroll",
} as const;

/* ----------------------------------------------------------- 2. manifesto */

export const MANIFESTO = {
  label: "What we believe",
  // Words inside [[ ]] are drawn in the accent blue. Keep it to three phrases.
  text: "Most small businesses don't need an AI strategy. They need [[the phone answered]], the booking made, and Sunday's enquiry followed up on Monday. So we build small agents that [[do one job each]], on the tools you already use. When one of them isn't sure, [[it asks you]].",
} as const;

/* ------------------------------------------------------------ 3. services */

export type ServiceArt = "booking" | "reception" | "whatsapp" | "leads" | "workflow";
export type Service = { id: ServiceArt; title: string; outcome: string; builds: string[] };

export const SERVICES = {
  title: "What we build",
  lead: "Five kinds of agent. Most businesses start with one.",
  buildsLabel: "What we set up",
  // TODO: confirm every service and bullet matches what you sell.
  items: [
    {
      id: "booking",
      title: "Appointment & booking agents",
      outcome: "Customers book, move or cancel a slot at any hour, without calling you.",
      builds: [
        "Booking over WhatsApp, your website and Google",
        "A reminder the day before, so fewer no-shows",
        "Your calendar updated the moment a slot is taken",
      ],
    },
    {
      id: "reception",
      title: "AI receptionist, voice and chat",
      // TODO: confirm you offer voice calls, not only chat.
      outcome: "Every call and message gets an answer, even while you're with a customer.",
      builds: [
        "Answers timings, prices and directions in Tamil or English",
        "Takes a booking or a callback request",
        "Sends you a two-line summary of anything it can't handle",
      ],
    },
    {
      id: "whatsapp",
      title: "WhatsApp & messaging automation",
      outcome: "Replies go out in seconds, from your own business number.",
      builds: [
        "A reply to every missed call, with your booking link",
        "Updates when a report is ready, an order is packed or a slot is confirmed",
        "Offers sent only to customers who asked for them",
      ],
    },
    {
      id: "leads",
      title: "Lead capture & follow-up",
      outcome: "Every enquiry from an ad, Instagram or your site gets followed up.",
      builds: [
        "One list for enquiries from every channel",
        "Follow-ups on day 1, 3 and 7, until they book or say no",
        "A weekly count of who booked and who went quiet",
      ],
    },
    {
      id: "workflow",
      title: "Custom workflow automation",
      outcome: "The copy-paste work between your apps gets done for you.",
      builds: [
        "Bills, reports and forms moved between the tools you use",
        "A summary on WhatsApp at closing time",
        "Built around how your business already runs",
      ],
    },
  ] satisfies Service[],
} as const;

/* ---------------------------------------------------------- 4. how we work */

export const HOW = {
  title: "How we work",
  lead: "Four steps, about four weeks. Nothing changes for your customers until you've tried it.",
  getsLabel: "What you get",
  // TODO: confirm every step and timing.
  steps: [
    {
      name: "Discover",
      when: "Week 1",
      does: "A call, then a morning at your front desk. We watch how calls, messages and bookings really arrive.",
      gets: "A one-page list of where customers slip away, and what to fix first.",
    },
    {
      name: "Design",
      when: "Weeks 1 to 2",
      does: "We map each agent's job: what it answers, when it books, and when it hands over to you.",
      gets: "The exact wording of every reply, for you to approve.",
    },
    {
      name: "Build",
      when: "Weeks 2 to 3",
      does: "Set up on your own number and accounts, then tested with your staff before any customer sees it.",
      gets: "A working system, running beside the way you work today.",
    },
    {
      name: "Launch & support",
      when: "Week 4 on",
      does: "We switch it on, watch the first weeks closely and fix whatever feels off.",
      gets: "Staff training in Tamil or English, and a check-in every month.",
    },
  ],
} as const;

/* ---------------------------------------------------------- 5. industries */

export type IndustryCard = { id: TradeId; name: string; line: string };

export const INDUSTRIES = {
  title: "See it for your business",
  lead: "Pick your trade. Each one opens a sample evening and night, with the messages that kind of business gets.",
  hint: "Drag, or scroll sideways",
  open: "Open the sample",
  // The quote and reply on each card come from that trade's sample in trades.ts.
  cards: [
    { id: "dental", name: "Dental clinics", line: "Late-night tooth pain, booked into the first free slot." },
    { id: "diagnostics", name: "Diagnostic labs", line: "Home collections and report questions, sorted before the counter opens." },
    { id: "gym", name: "Gyms", line: "Trial requests and fee questions answered while you're on the floor." },
    { id: "salon", name: "Salons", line: "Weekend slots and group bookings taken from WhatsApp and Instagram." },
    { id: "optician", name: "Opticians", line: "Eye tests booked and frame-ready updates sent from your number." },
  ] satisfies IndustryCard[],
  other: {
    name: "Something else?",
    line: "Restaurants, tutors, real estate, repair shops. Tell us how bookings work for you.",
    cta: "Tell us",
  },
} as const;

/* --------------------------------------------------------------- 6. about */

export const ABOUT_HOME = {
  title: "Why we started",
  // TODO: 3 to 4 sentences on why Octavyl exists: who started it, the moment you saw the problem, why small businesses.
  story: "TODO: 3 to 4 sentences on why Octavyl exists. Who started it, the moment you saw the problem, and why you chose small businesses.",
  principlesTitle: "How we decide things",
  // TODO: confirm each principle is one you'll stand behind.
  principles: [
    { title: "Build what works, not what demos well.", line: "An agent that books one slot correctly beats one that chats about everything." },
    { title: "Plain language, always.", line: "No jargon on calls, in quotes, or in the replies your customers read." },
    { title: "Small scope, shipped fast.", line: "One agent, live in weeks. The next one when the first has earned it." },
    { title: "Yours to keep.", line: "Numbers and accounts are set up in your name. If you leave us, everything stays with you." },
  ],
  teamTitle: "Who you'll work with",
  // TODO: real names, roles, one-line bios and photos. Add or remove people as needed.
  team: [
    { name: "TODO: name", role: "TODO: role, e.g. Founder", bio: "TODO: one line, e.g. what they did before and what they build now." },
    { name: "TODO: name", role: "TODO: role", bio: "TODO: one line." },
  ],
  photoLabel: "Photo placeholder",
} as const;

/* ---------------------------------------------------------------- 7. work */

export type WorkItem = { trade: TradeId; client: string; place: string; built: string; result: string };

export const WORK = {
  title: "Recent work",
  lead: "Real projects go here, shared with each owner's permission. Until then, every card is a marked placeholder.",
  view: "View",
  // TODO: replace all three with real projects. Never publish a result the owner hasn't approved.
  items: [
    { trade: "dental", client: "TODO: client name", place: "TODO: area", built: "TODO: what we built, e.g. WhatsApp booking and reminders", result: "TODO: a real result, e.g. after-hours bookings per week, before and after" },
    { trade: "gym", client: "TODO: client name", place: "TODO: area", built: "TODO: what we built", result: "TODO: a real result" },
    { trade: "salon", client: "TODO: client name", place: "TODO: area", built: "TODO: what we built", result: "TODO: a real result" },
  ] satisfies WorkItem[],
  end: "Your business could be the first one here.",
} as const;

/* ----------------------------------------------------------------- 8. faq */

export type Faq = { q: string; a: string; confirm?: string };

export const FAQ = {
  title: "Questions owners ask",
  lead: "Something we didn't cover? Ask us on WhatsApp.",
  items: [
    {
      q: "What does it cost?",
      a: "Most projects cost between ₹10,000 and ₹1 lakh to set up, depending on how many agents and channels you need. Running costs, like WhatsApp message fees and hosting, are separate, and we show them to you before you agree to anything.",
      confirm: "TODO: confirm pricing and what's included", // TODO: confirm pricing.
    },
    {
      q: "How long does it take?",
      a: "About four weeks from the first call to switching it on. Most of that time goes into understanding how your business runs and testing with your staff. A single missed-call reply can be live within a few days.",
      confirm: "TODO: confirm timings", // TODO: confirm timings.
    },
    {
      q: "Do I need to know anything technical?",
      a: "No. If you can use WhatsApp, you can use this. We set it up, train your staff in Tamil or English, and you approve every reply before a customer sees it.",
    },
    {
      q: "What happens to my customers' data?",
      a: "It stays in accounts registered in your name. We use it only to run your agents. We don't sell it or share it, and you can ask us to delete it at any time.",
      confirm: "TODO: confirm providers and where data is stored", // TODO: confirm data handling.
    },
    {
      q: "What if the AI gets something wrong?",
      a: "Each agent has a short list of things it's allowed to do. Anything outside that list, like a complaint, a refund or an unusual request, goes to you with a summary instead of a guess. You can read every conversation, and we adjust the replies closely in the first weeks.",
    },
    {
      q: "What support do I get after launch?",
      a: "A monthly check-in to go through what the agents handled and what they passed to you, and fixes when something breaks. You get a direct number for us, not a ticket queue.",
      confirm: "TODO: confirm support terms and the monthly cost", // TODO: confirm support terms.
    },
  ] satisfies Faq[],
} as const;

/* ------------------------------------------------------------- 9. contact */

export const CONTACT_HOME = {
  title: "Tell us what's slowing your business down.",
  // TODO: confirm call length and what happens on it.
  sub: "One call, about 20 minutes. You'll know what we'd build first and roughly what it costs.",
  formTitle: "Or write to us",
  fields: {
    name: { label: "Your name", error: "Tell us your name." },
    business: {
      label: "Type of business",
      placeholder: "Choose one",
      options: ["Dental clinic", "Diagnostic lab", "Gym", "Salon", "Optician", "Something else"],
      error: "Pick the closest one.",
    },
    contact: { label: "Email or phone", hint: "We'll reply here.", error: "Add an email address or a 10-digit phone number." },
    message: {
      label: "What's slowing you down?",
      hint: "A sentence is enough. For example: we miss calls when we're busy.",
      error: "Tell us a little about what's slowing you down.",
    },
  },
  submit: "Send",
  sending: "Sending",
  // TODO: confirm the reply time you can promise.
  success: { title: "Got it, {name}.", body: "We'll reply within one working day.", again: "Send another" },
  failure: { title: "That didn't send.", body: "Try again, or message us on WhatsApp.", retry: "Try again", whatsapp: "WhatsApp us" },
} as const;
