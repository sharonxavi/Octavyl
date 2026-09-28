# Octavyl: design plan

**Concept: Shutter down.** Your buyer is an owner who is also the front desk: a Chennai dentist, gym or salon owner who answers the phone, keeps the register and replies on WhatsApp. When they're with a customer, or when the shutter comes down at 9pm, the shop stops answering. The site doesn't describe automation. It runs one evening of it on the visitor's own trade, then closes on a painted shop shutter whose button still works. Dark blue isn't a mood here. It's the hour.

## Color

| Name | Hex | Role |
|---|---|---|
| Deep night | `#060B1C` | The small hours, the footer, button labels on blue |
| Night | `#0A1128` | Page base |
| Street | `#16264F` | The one raised step. Raised means you can press it |
| Signal | `#3F6FFF` | Primary button and the one route in flight. Never a glow |
| Dawn | `#8FB0FF` | "Handled": booked slots, links, focus rings |
| Chalk | `#E8EEFC` | Text. Secondary text is `#8D9CC4` |

I merged the brief's two middle surfaces into Street. Two surfaces 1.3:1 apart turn to mud on a laptop in a bright shop, and one step lets "raised" mean "pressable". Depth follows the clock: the sample night sinks to Deep night at 2am and lifts at 9am. Signal shows up at most once per screen besides the main button. Contrast: Chalk on Night is 16:1, secondary text on Night 6.8:1, Dawn 8.7:1. Signal (4.4:1) is kept off small text.

## Type

- **Science Gothic** (Google Fonts, variable width 50-200): headlines, the register, the clock, the shutter lettering. Squared letters like the painted boards and shutters on Chennai shop fronts. It was released in November 2025, so no agency template uses it yet. The width axis carries meaning. In the explorer a line widens when you say it's true for your shop.
- **Anek Latin** by Ek Type, an Indian foundry (Google Fonts): body, UI and the customers' own words. Its open, rounder shapes sit clearly apart from Science Gothic's squares. **Anek Tamil** is the same design in Tamil, loaded only for the demo's Tamil reply.

Scale: H1 `clamp(3rem, 5vw, 5.5rem)` at weight 780 and width 68, leading 0.94. H2 `clamp(2.25rem, 3.4vw, 3.75rem)`. Body 17px/1.6, capped at 62 characters. Process numerals run to 13rem at width 50. Emphasis comes from weight and width only: no highlighted words, no all-caps labels, no eyebrows.

## Layout concept

Six sections, six layout families: a split with a live instrument, a pinned horizontal track, a list with a sticky panel, a sticky numeral rail, an offset narrow column, and a full-bleed object. The rhythm runs loud, long, dense, steady, quiet, loud. 12 columns, 24px gutters, margins `clamp(16px, 4vw, 56px)`. Radius rule: 6px on anything you can press, 0 everywhere else.

**Hero** (1440 wide)

```
Octavyl   A sample night  What we build  How we work  About  [Book a call]

                                       +--shutter, 4 slats---------21:42-+
Shutter down.                          | Tomorrow at a [dental clinic v] |
Still taking bookings.                 | 09:30  Revathi S, cleaning      |
                                       | 10:30  Karthik, RCT follow-up   |
Websites, WhatsApp replies and         | 11:30  .......................  |
online booking for Chennai clinics,    | 17:00  Meena, filling           |
gyms and salons. Your customers get    | 18:00  .......................  |<- pointer
an answer when you can't.       "slot  | 18:30  Arun, tooth pain         |   picks the slot
                              tmrw 6?"-+-> Booked on WhatsApp, 21:42     |
[Book a call]  See a sample night      | Needs you: 1            Pause   |
                                       +---------------------------------+
```

The H1, subtext, CTAs and wordmark share the column 1 edge. The register panel spans columns 8-12, its top on the H1's cap line and its last row on the CTA baseline. Incoming messages appear in the gap at columns 6-7. "Book a call" stays above the fold at 1366x768 and at 360x640.

**A sample night** (pinned; the track moves, the playhead stays still)

```
One night at a [dental clinic v].      [With Octavyl | Without]   Handled 3
----------------------------------------------------------------------------
   "Missed call.          "Any slot tomorrow         "Price for
    You were with          evening? Tooth pain        cleaning?"
    a patient."            since morning."
        |                        |                        |
--19:00-19:40------21:00---------21:42----------22:00-----22:16------> time
        |          Shutter       |                        |
  Booked Thu 10:00  down         Sent 3 open slots.       Sent prices and
  from the link                  Booked Tue 18:30.        a booking link
                            |
                  playhead [21:42], fixed at 38% of the width
```

Customers above the ruler in Anek, replies below in Science Gothic. Every event column has a fixed width, so switching trade never changes the track's length.

## Signature moment: one sample night

The section pins at the top of the screen. Scrolling drives a clock from 19:30 to 09:00 past a fixed playhead:

1. **19:40.** A missed call while the dentist is with a patient. As it crosses the playhead, a route draws down and the reply sets: "Booked Thu 10:00 from the link." This covers busy hours, not just closed ones.
2. **21:00.** "Shutter down." The page starts to sink toward Deep night.
3. **21:42.** "Any slot tomorrow evening? Tooth pain since morning." The reply: "Sent 3 open slots. Booked Tue 18:30."
4. **22:16 and 00:40.** An Instagram DM asking the price, and an ad click that lands on the offer page instead of an Instagram grid.
5. **23:30.** A two-star review. "Reply drafted. Waiting for your OK at 8am." It stays outlined, because anything public waits for the owner.
6. **"5 hours later".** An honest break, so the dead hours cost little scroll.
7. **06:50 and 07:20.** Reminders go to today's nine patients, and a cancelled 10:30 is refilled from the waitlist.
8. **09:00.** "Shutter up." The dark lifts and a morning card clips open: "Since 7pm: 3 new bookings, 1 slot refilled, 9 reminders sent. 1 reply waits for you." It is labelled "Sample night".
9. **Work slots.** The track continues into two honest slots, "Real client nights go here", and ends on "Your shop could be the first one here" with "Book a call".

The **With Octavyl / Without** toggle strikes every reply through: "4 people to call back, 1 empty slot, 9 patients not reminded." The trade picker rewrites the whole night for a gym, salon, restaurant or optician. On desktop you can also drag the track, and the cursor reads out the time under it. Phones get a vertical timeline under a sticky clock bar.

## Motion system

One file owns every easing and duration, and each section gets its own verb:

| Section | Trigger | What moves, and why |
|---|---|---|
| Hero | Page load | "Shutter down." drops through a mask like a shutter, then "Still taking bookings." rises. The shutter band lowers onto the register, then requests start arriving |
| A sample night | Pinned scrub, about 300vh | The night runs on your scroll: clock, routes drawing, the dark deepening, the morning card clipping open |
| What we build | Enters at 75%, then your taps | Rows sweep from condensed to open width. After that, only your choices move things |
| How we work | Sticky, scrubbed | A big numeral rolls 1 to 5 like an odometer. Each step opens by clip-path as you reach it |
| About | Enters at 70% | The photo wipes up and the lines rise through masks. Slower and quieter on purpose |
| Contact | Pinned scrub, 150vh | The register from the hero comes back full. Then a 10-slat shutter comes down over it and lands with a small settle. The contact details are painted on the shutter |

| Token | Value | Used for |
|---|---|---|
| arrive | `cubic-bezier(0.16,1,0.3,1)` | Entrances and reveals |
| leave | `cubic-bezier(0.7,0,0.84,0)` | Exits, at 0.65x the entrance time |
| shutter | `cubic-bezier(0.76,0,0.24,1)` | Anything heavy: the shutter, H1 line 1, slots being set |
| settle | Slight overshoot | Magnetic release, slot snap, the shutter landing |
| durations | 0.18 / 0.35 / 0.6 / 0.9 / 1.2s | instant / quick / base / slow / load |

**Mouse.** In the hero, the next request books into the free slot nearest your pointer, and its route bends toward you. Hover or tap a booked slot to see its history. The custom cursor has five states: default ring, link, "Book here" over slots, a time readout over the night track, and a square over photo slots. Inputs keep the native caret. "Book a call" buttons and nav links are magnetic, with pulls of 0.3 and 0.2 and a settle on release. Everything reveals something, and every hover has a tap equivalent. Only transform and opacity animate, apart from SVG strokes and the width axis on single lines.

**Reduced motion.** No pins, scrubs, parallax, magnetism or custom cursor. The register starts full, the night is a static timeline, and the shutter is a still panel. All content stays reachable.

## Page outline

1. **Hero.** Offer, "Book a call", and the live register.
2. **A sample night.** The signature, plus honest work slots.
3. **What we build.** "What's going wrong at your shop?" Tick what's true, such as missed calls when busy, messages after closing, a paper register, unanswered reviews, ads sending people to Instagram, or no website. "Your first build" assembles beside it. Below sits a live demo, "Try it: miss a call": pick a trade, drag the call time and switch English or Tamil to see the exact auto-reply, which changes after closing.
4. **How we work.** Five numbered steps, each with What we do, What you do and When. "Your paper register stays until the new one works."
5. **About.** "The person who builds it answers the phone." A founder photo slot shot at a client's counter, and three plain facts.
6. **Contact.** The shutter: "Bring us the notebook.", "Book a call" and "WhatsApp us", with the number painted large like a real shutter. The last line reads "The shutter's down. This button still works." A street-level footer sits below.

## Critique against the brief

What looked like any AI agency, and what changed:

- **Workflow-graph hero.** The first strong option drew routes from "missed call" to "slot booked". At thumbnail size that's the inputs-to-outputs diagram every automation site ships. The owner's own object replaced it: tomorrow's register, where your pointer chooses the slot.
- **Chat bubbles flying into a calendar.** That's the stock hero of Indian WhatsApp tools. Here messages are written into the register as entries, with one route in flight at a time.
- **Cursor lens over a shader.** This is the most-copied WebGL hero, and it would have put the main text inside a blurry texture. It's gone. There's no WebGL anywhere; it's all real text and SVG.
- **Proximity headlines, a giant footer wordmark, a words-light-up About.** All cut, as CodePen and Apple habits. The width axis only changes when something's state changes.
- **Night-only framing.** It made Octavyl sound like a night-time bot, so a busy-hours beat was added and the subtext says "when you can't". "CRM" became "simple customer records".
- **No proof yet.** Nothing is invented. The night is labelled "Sample night" with made-up names, and the work slots say plainly that real client nights go there.

## Hero and signature concepts considered

1. **Switchyard.** Transit-map routes from each kind of enquiry to an outcome; the points throw toward your cursor, and a scrubbed "One Saturday, rerouted" untangles a messy day. It was the best engineered, but at a glance it's the workflow diagram.
2. **The type is the demo.** A sentence describing the owner's evening ("scroll WhatsApp, copy names into the book, call back who you can") strikes itself through and re-sets as the automated version. It had the best copy, but it's reading rather than seeing, and it's less interactive than you asked for. Its strike-through survives in the Without toggle.
3. **Shutter down (picked).** It's the only one whose central image comes from your customer's world rather than a designer's. Every owner pulls a shutter down at night, so the headline lands in two seconds, the dark blue has a reason, and the ending closes the story instead of decorating it. It also has the cheapest render path of the three: DOM, SVG and GSAP, no canvas.

## Placeholders and questions

Company details are placeholders. Each such line carries a `TODO:` comment, and every one will be listed in the handover. Five answers would sharpen it most:

1. Is it **Octavyl** or **Octaavyl**, as written in your ICP?
2. Do you sell **WhatsApp auto-replies and online booking**? The concept leans on them. If you don't, I'd fall back to the Switchyard concept.
3. Your **booking link** and **WhatsApp number**.
4. The **founder's name and photo**, and the team size.
5. Can the site show **"Projects run INR 10k-1L"**, and do you want **Tamil** copy anywhere beyond the demo?

The project goes in `Desktop\Octavyl`: Next.js 16, Tailwind 4, GSAP 3.15 (SplitText, DrawSVG and Flip are free now) and Lenis 1.3.
