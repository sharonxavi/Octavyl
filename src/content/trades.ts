/**
 * Sample data for the trade picker. Every trade has the same shape and the same
 * number of items at the same times, so switching trade never changes layout
 * (the night track keeps its length and its pin never needs a refresh).
 *
 * All names are made up. Messages are the kinds owners describe, not real ones.
 * TODO: check each trade's messages against real ones from your clients.
 */

export type TradeId = "dental" | "diagnostics" | "gym" | "salon" | "optician";

export type RegisterRow = { time: string; who?: string; what?: string };

export type Incoming = {
  channel: string;
  /** Clock time the message arrives in the hero. */
  at: string;
  said: string;
  to: "slot" | "needs";
  who?: string;
  what?: string;
  /** How it was booked, e.g. "WhatsApp" in "Booked on WhatsApp". */
  via?: string;
};

export type NightEvent = {
  source: string;
  /** The customer's own words. */
  said?: string;
  /** What was happening at the shop, when there are no words to quote. */
  context?: string;
  reply: string;
  without: string;
  needsYou?: boolean;
};

export type Trade = {
  id: TradeId;
  label: string;
  article: "a" | "an";
  shop: string;
  /** Opening and closing time in minutes since midnight. */
  open: number;
  close: number;
  busyReason: string;
  register: RegisterRow[];
  incoming: Incoming[];
  night: NightEvent[];
  morning: string;
  withoutSummary: string;
};

/** Fixed times for the night track, shared by every trade. */
export const NIGHT_TIMES = [
  { time: "19:40", min: 19 * 60 + 40 },
  { time: "21:42", min: 21 * 60 + 42 },
  { time: "22:16", min: 22 * 60 + 16 },
  { time: "23:30", min: 23 * 60 + 30 },
  { time: "00:40", min: 24 * 60 + 40 },
  { time: "06:50", min: 30 * 60 + 50 },
  { time: "07:20", min: 31 * 60 + 20 },
] as const;

const h = (hh: number, mm = 0) => hh * 60 + mm;

export const TRADES: Record<TradeId, Trade> = {
  dental: {
    id: "dental",
    label: "dental clinic",
    article: "a",
    shop: "[Your clinic]",
    open: h(10),
    close: h(20, 30),
    busyReason: "the doctor is with a patient",
    register: [
      { time: "09:30", who: "Revathi S", what: "cleaning" },
      { time: "10:30" },
      { time: "11:30", who: "Karthik", what: "RCT follow-up" },
      { time: "12:30" },
      { time: "16:00" },
      { time: "17:00", who: "Meena", what: "filling" },
      { time: "18:00" },
      { time: "18:30" },
    ],
    incoming: [
      { channel: "WhatsApp", at: "21:42", said: "Any slot tomorrow evening? Tooth pain since morning.", to: "slot", who: "Arun", what: "tooth pain, first visit", via: "WhatsApp" },
      { channel: "Missed call", at: "21:49", said: "Called at 9:49pm. Nobody picked up.", to: "slot", who: "Priya", what: "cleaning", via: "the missed-call reply" },
      { channel: "Instagram", at: "22:03", said: "Do you do braces consultations?", to: "slot", who: "Sundar", what: "braces consult", via: "Instagram" },
      { channel: "Google review", at: "22:16", said: "2 stars. Waited 40 minutes.", to: "needs" },
      { channel: "WhatsApp", at: "22:31", said: "Can my mother come for a check-up at 10?", to: "slot", who: "Lakshmi", what: "check-up", via: "WhatsApp" },
      { channel: "Ad click", at: "22:48", said: "Tapped your cleaning offer.", to: "slot", who: "Divya", what: "cleaning offer", via: "the offer page" },
    ],
    night: [
      { source: "Missed call", context: "You were with a patient.", reply: "WhatsApp sent with your booking link. Booked Thu 10:00.", without: "Missed call. No reply." },
      { source: "WhatsApp", said: "Any slot tomorrow evening? Tooth pain since morning.", reply: "Sent 3 open slots. Booked Tue 18:30.", without: "Seen at 9am." },
      { source: "Instagram", said: "Price for cleaning?", reply: "Sent the price list and a booking link.", without: "No reply." },
      { source: "Google review", said: "2 stars. Waited 40 minutes.", reply: "Reply drafted. Waiting for your OK at 8am.", without: "Unanswered.", needsYou: true },
      { source: "Ad click", said: "Tapped your cleaning offer ad.", reply: "Landed on the offer page. Booked Sat 11:00.", without: "Landed on your Instagram grid. Left." },
      { source: "Reminders", context: "Today's list.", reply: "Reminders sent to today's 9 patients.", without: "Not sent." },
      { source: "Cancellation", said: "Can't make 10:30, sorry.", reply: "10:30 refilled from the waitlist.", without: "10:30 stays empty." },
    ],
    morning: "Since 7pm: 3 new bookings, 1 slot refilled, 9 reminders sent. 1 reply waits for you.",
    withoutSummary: "4 people to call back, 1 empty slot, 9 patients not reminded.",
  },

  diagnostics: {
    id: "diagnostics",
    label: "diagnostics centre",
    article: "a",
    shop: "[Your lab]",
    open: h(7),
    close: h(20),
    busyReason: "we're at the collection counter",
    register: [
      { time: "07:00", who: "Mr Iyer", what: "fasting sugar, home" },
      { time: "07:30" },
      { time: "08:00", who: "Kala", what: "thyroid profile" },
      { time: "08:30" },
      { time: "09:00" },
      { time: "10:00", who: "Dinesh", what: "chest X-ray" },
      { time: "11:00" },
      { time: "17:00" },
    ],
    incoming: [
      { channel: "WhatsApp", at: "21:42", said: "Can someone collect a blood sample at home tomorrow at 7?", to: "slot", who: "Selvi", what: "home collection, fasting", via: "WhatsApp" },
      { channel: "Missed call", at: "21:49", said: "Called at 9:49pm. Nobody picked up.", to: "slot", who: "Bala", what: "full body check-up", via: "the missed-call reply" },
      { channel: "Instagram", at: "22:03", said: "Price for a full body check-up?", to: "slot", who: "Hari", what: "full body check-up", via: "Instagram" },
      { channel: "Google review", at: "22:16", said: "2 stars. Report came a day late.", to: "needs" },
      { channel: "WhatsApp", at: "22:31", said: "Book an ECG for my father tomorrow?", to: "slot", who: "Ramesh", what: "ECG", via: "WhatsApp" },
      { channel: "Ad click", at: "22:48", said: "Tapped your senior check-up offer.", to: "slot", who: "Vasanthi", what: "senior check-up", via: "the offer page" },
    ],
    night: [
      { source: "Missed call", context: "You were at the collection counter.", reply: "WhatsApp sent with your booking link. Booked Thu 08:00.", without: "Missed call. No reply." },
      { source: "WhatsApp", said: "Can someone collect a blood sample at home tomorrow at 7?", reply: "Home collection booked for 7:00. Fasting steps sent.", without: "Seen at 7am." },
      { source: "Instagram", said: "Price for a full body check-up?", reply: "Sent the package list and a booking link.", without: "No reply." },
      { source: "Google review", said: "2 stars. Report came a day late.", reply: "Reply drafted. Waiting for your OK at 8am.", without: "Unanswered.", needsYou: true },
      { source: "Ad click", said: "Tapped your senior check-up ad.", reply: "Landed on the offer page. Booked Sat 08:30.", without: "Landed on your Instagram grid. Left." },
      { source: "Reminders", context: "Today's list.", reply: "Fasting reminders sent to today's 14 patients.", without: "Not sent." },
      { source: "Cancellation", said: "Can't make the 8:30, sorry.", reply: "8:30 refilled from the waitlist.", without: "8:30 stays empty." },
    ],
    morning: "Since 7pm: 3 new bookings, 1 slot refilled, 14 fasting reminders sent. 1 reply waits for you.",
    withoutSummary: "4 people to call back, 1 empty slot, 14 patients not reminded to fast.",
  },

  gym: {
    id: "gym",
    label: "gym",
    article: "a",
    shop: "[Your gym]",
    open: h(5, 30),
    close: h(22),
    busyReason: "we're taking a class",
    register: [
      { time: "06:00", who: "Vignesh", what: "PT session" },
      { time: "06:30" },
      { time: "07:00", who: "Anitha", what: "trial class" },
      { time: "07:30" },
      { time: "17:30" },
      { time: "18:00" },
      { time: "18:30", who: "Rahul", what: "PT session" },
      { time: "19:00" },
    ],
    incoming: [
      { channel: "WhatsApp", at: "21:42", said: "Is there a ladies' batch in the morning?", to: "slot", who: "Kavya", what: "ladies' batch trial", via: "WhatsApp" },
      { channel: "Missed call", at: "21:49", said: "Called at 9:49pm. Nobody picked up.", to: "slot", who: "Imran", what: "trial class", via: "the missed-call reply" },
      { channel: "Instagram", at: "22:03", said: "Monthly fee?", to: "slot", who: "Deepa", what: "trial, fee card sent", via: "Instagram" },
      { channel: "Google review", at: "22:16", said: "2 stars. AC not working on Sunday.", to: "needs" },
      { channel: "WhatsApp", at: "22:31", said: "Can I book a PT session tomorrow evening?", to: "slot", who: "Arjun", what: "PT session", via: "WhatsApp" },
      { channel: "Ad click", at: "22:48", said: "Tapped your new-year offer.", to: "slot", who: "Nisha", what: "offer trial", via: "the offer page" },
    ],
    night: [
      { source: "Missed call", context: "You were taking a class.", reply: "WhatsApp sent with your trial link. Trial booked Thu 07:00.", without: "Missed call. No reply." },
      { source: "WhatsApp", said: "Is there a ladies' batch in the morning?", reply: "Sent batch timings. Trial booked Wed 06:30.", without: "Seen at 6am." },
      { source: "Instagram", said: "Monthly fee?", reply: "Sent the fee card and a trial link.", without: "No reply." },
      { source: "Google review", said: "2 stars. AC not working on Sunday.", reply: "Reply drafted. Waiting for your OK at 8am.", without: "Unanswered.", needsYou: true },
      { source: "Ad click", said: "Tapped your new-year offer ad.", reply: "Landed on the offer page. Trial booked Sat 07:00.", without: "Landed on your Instagram grid. Left." },
      { source: "Reminders", context: "Renewals due this week.", reply: "Renewal reminders sent to 12 members.", without: "Not sent." },
      { source: "Cancellation", said: "Can't make the 7:30 session.", reply: "7:30 refilled from the waitlist.", without: "7:30 stays empty." },
    ],
    morning: "Since 7pm: 3 trials booked, 1 session refilled, 12 renewal reminders sent. 1 reply waits for you.",
    withoutSummary: "4 people to call back, 1 empty session, 12 renewals not chased.",
  },

  salon: {
    id: "salon",
    label: "salon",
    article: "a",
    shop: "[Your salon]",
    open: h(10),
    close: h(20, 30),
    busyReason: "we're with a client",
    register: [
      { time: "10:00", who: "Shalini", what: "haircut" },
      { time: "11:00" },
      { time: "12:00", who: "Farah", what: "bridal trial" },
      { time: "13:00" },
      { time: "16:00" },
      { time: "17:00", who: "Ramya", what: "facial" },
      { time: "18:00" },
      { time: "19:00" },
    ],
    incoming: [
      { channel: "WhatsApp", at: "21:42", said: "Any slot tomorrow for a haircut and blow-dry?", to: "slot", who: "Janani", what: "haircut and blow-dry", via: "WhatsApp" },
      { channel: "Missed call", at: "21:49", said: "Called at 9:49pm. Nobody picked up.", to: "slot", who: "Swetha", what: "threading", via: "the missed-call reply" },
      { channel: "Instagram", at: "22:03", said: "Price for keratin?", to: "slot", who: "Nandini", what: "keratin consult", via: "Instagram" },
      { channel: "Google review", at: "22:16", said: "2 stars. Had to wait 30 minutes.", to: "needs" },
      { channel: "WhatsApp", at: "22:31", said: "Mehendi for 4 people on Sunday?", to: "slot", who: "Meera", what: "mehendi, 4 people", via: "WhatsApp" },
      { channel: "Ad click", at: "22:48", said: "Tapped your Diwali offer.", to: "slot", who: "Pooja", what: "Diwali facial", via: "the offer page" },
    ],
    night: [
      { source: "Missed call", context: "You were mid-haircut.", reply: "WhatsApp sent with your booking link. Booked Thu 11:00.", without: "Missed call. No reply." },
      { source: "WhatsApp", said: "Any slot tomorrow for a haircut and blow-dry?", reply: "Sent 3 open slots. Booked Tue 17:30.", without: "Seen at 10am." },
      { source: "Instagram", said: "Price for keratin?", reply: "Sent the price list and a booking link.", without: "No reply." },
      { source: "Google review", said: "2 stars. Had to wait 30 minutes.", reply: "Reply drafted. Waiting for your OK at 8am.", without: "Unanswered.", needsYou: true },
      { source: "Ad click", said: "Tapped your Diwali offer ad.", reply: "Landed on the offer page. Booked Sat 12:00.", without: "Landed on your Instagram grid. Left." },
      { source: "Reminders", context: "Today's list.", reply: "Reminders sent to today's 11 clients.", without: "Not sent." },
      { source: "Cancellation", said: "Can't make my 11:00, sorry.", reply: "11:00 refilled from the waitlist.", without: "11:00 stays empty." },
    ],
    morning: "Since 7pm: 3 new bookings, 1 slot refilled, 11 reminders sent. 1 reply waits for you.",
    withoutSummary: "4 people to call back, 1 empty chair, 11 clients not reminded.",
  },

  optician: {
    id: "optician",
    label: "optician",
    article: "an",
    shop: "[Your store]",
    open: h(10, 30),
    close: h(20, 30),
    busyReason: "we're doing an eye test",
    register: [
      { time: "10:30" },
      { time: "11:30", who: "Gopal", what: "eye test" },
      { time: "12:30" },
      { time: "15:00" },
      { time: "16:00", who: "Asha", what: "frame fitting" },
      { time: "17:00" },
      { time: "18:00", who: "Naveen", what: "collection" },
      { time: "19:00" },
    ],
    incoming: [
      { channel: "WhatsApp", at: "21:42", said: "Is the eye test free? Can I come tomorrow?", to: "slot", who: "Keerthi", what: "eye test", via: "WhatsApp" },
      { channel: "Missed call", at: "21:49", said: "Called at 9:49pm. Nobody picked up.", to: "slot", who: "Mohan", what: "eye test", via: "the missed-call reply" },
      { channel: "Instagram", at: "22:03", said: "Do you have kids' frames?", to: "slot", who: "Latha", what: "kids' frames", via: "Instagram" },
      { channel: "Google review", at: "22:16", said: "2 stars. Glasses took 10 days.", to: "needs" },
      { channel: "WhatsApp", at: "22:31", said: "Are my glasses ready? Can I collect tomorrow?", to: "slot", who: "Prakash", what: "collection", via: "WhatsApp" },
      { channel: "Ad click", at: "22:48", said: "Tapped your free eye test offer.", to: "slot", who: "Revathy", what: "free eye test", via: "the offer page" },
    ],
    night: [
      { source: "Missed call", context: "You were doing an eye test.", reply: "WhatsApp sent with your booking link. Booked Thu 11:30.", without: "Missed call. No reply." },
      { source: "WhatsApp", said: "Is the eye test free? Can I come tomorrow?", reply: "Answered, and sent 3 open slots. Booked Tue 17:00.", without: "Seen at 10am." },
      { source: "Instagram", said: "Do you have kids' frames?", reply: "Sent the kids' range and a booking link.", without: "No reply." },
      { source: "Google review", said: "2 stars. Glasses took 10 days.", reply: "Reply drafted. Waiting for your OK at 8am.", without: "Unanswered.", needsYou: true },
      { source: "Ad click", said: "Tapped your free eye test ad.", reply: "Landed on the offer page. Booked Sat 12:30.", without: "Landed on your Instagram grid. Left." },
      { source: "Reminders", context: "Orders ready to collect.", reply: "Collection reminders sent for 6 ready orders.", without: "Not sent." },
      { source: "Cancellation", said: "Can't come at 11:30 today.", reply: "11:30 refilled from the waitlist.", without: "11:30 stays empty." },
    ],
    morning: "Since 7pm: 3 new bookings, 1 slot refilled, 6 collection reminders sent. 1 reply waits for you.",
    withoutSummary: "4 people to call back, 1 empty slot, 6 orders not collected.",
  },
};

export const TRADE_IDS = Object.keys(TRADES) as TradeId[];

/** Demo reply templates. {shop}, {open}, {day}, {reason} and {link} are filled in by lib/demo.ts. */
export const DEMO_TEMPLATES = {
  en: {
    busy: "Hi, this is {shop}. Sorry we missed your call, {reason}. Pick a time here and we'll confirm it on WhatsApp: {link}",
    closed: "Hi, this is {shop}. We're closed now and open at {open} {day}. Book a slot here and we'll confirm it first thing: {link}",
  },
  // TODO: have a native speaker check both Tamil templates before launch.
  ta: {
    busy: "வணக்கம், இது {shop}. உங்கள் அழைப்பை எடுக்க முடியவில்லை, மன்னிக்கவும். இந்த லிங்கில் நேரம் தேர்வு செய்யுங்கள், WhatsApp-ல் உறுதி செய்கிறோம்: {link}",
    closed: "வணக்கம், இது {shop}. நாங்கள் இப்போது மூடியுள்ளோம், {day} காலை {open} மணிக்கு திறப்போம். இப்போதே நேரம் பதிவு செய்ய: {link}",
  },
} as const;

export const DEMO_LINK = "[booking link]"; // TODO: show the client's real short booking link here.
