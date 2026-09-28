# Octavyl build spec (internal)

The source of truth for the build. The client-facing version is `plan-user.md`. When the two disagree, the client-facing plan wins, and this file gets updated.

## 0. Stack and setup

**Versions** (checked 2026-09-28): next 16.3.6, react 19.3, tailwindcss 4.3.3 with `@tailwindcss/postcss`, gsap 3.15.0, @gsap/react 2.1.2, lenis 1.3.26 (not the 2.0 dev tag), typescript ^5.9.

**create-next-app rejects capital letters** in the target folder's name, so it cannot scaffold directly into `Octavyl`. Either scaffold into `Octavyl/_scaffold` and move the files up, or hand-write package.json and the configs.

**Native binaries.** After `npm i`, confirm `node_modules/@next/swc-win32-x64-msvc` and `@tailwindcss/oxide-win32-x64-msvc` exist.

**Fonts** (next/font/google):
- `Science_Gothic({ subsets:['latin'], axes:['wdth'], variable:'--font-display', display:'swap' })`. Weight is variable by default. Do **not** request CTRS or slnt: they take the latin file from about 96KB to about 240KB.
- `Anek_Latin({ subsets:['latin'], variable:'--font-body' })`.
- `Anek_Tamil({ subsets:['tamil'], preload:false, variable:'--font-tamil' })`, used only for the demo's Tamil output.
- **Fallback if Science Gothic reads badly in sentence case:** Special Gothic (wdth 75-125). Check this visually on day one.

**Global rules:**
- Zero em dashes and zero middle dots in any visible copy.
- Sentence case everywhere.
- No eyebrows.
- Every company-specific line carries a `// TODO:` (or `{/* TODO: */}`) comment on the same line or the line above it.

## 1. Tokens (src/app/globals.css, @theme)

```css
@theme {
  --color-deep: #060B1C;   /* Deep night */
  --color-night: #0A1128;  /* base */
  --color-street: #16264F; /* raised = pressable */
  --color-signal: #3F6FFF; /* rare: primary btn, route in flight */
  --color-dawn: #8FB0FF;   /* handled, links, focus */
  --color-chalk: #E8EEFC;  /* text */
  --color-dim: #8D9CC4;    /* secondary text (solid, never opacity) */
  --color-rule: #1C2F63;   /* hairlines that carry data only */
  --font-display: var(--font-display);
  --font-body: var(--font-body);
  --ease-arrive: cubic-bezier(0.16,1,0.3,1);
  --ease-leave: cubic-bezier(0.7,0,0.84,0);
  --ease-shutter: cubic-bezier(0.76,0,0.24,1);
  --ease-settle: cubic-bezier(0.22,1.2,0.36,1);
}
```

- **Base styles:** body background Night, Chalk text, Anek 17px/1.6. `overflow-x: clip` on html and body.
- **Focus:** `:focus-visible { outline: 2px solid var(--color-dawn); outline-offset: 2px }`.
- **Selection:** Signal background, Deep night text.
- **Radius:** 6px on pressables (buttons, slots, chips, toggles, selects), 0 everywhere else.
- **Primary button:** Signal fill, Deep night label, Anek 600 16px, height 48px (56px on mobile), padding 0 22px.
- **Secondary action:** a text link in Dawn with a 1px underline offset 4px, or an outline in Street.

**Type scale:**

| Role | Size | Weight | wdth | Leading | Tracking |
|---|---|---|---|---|---|
| H1 | clamp(2.6rem, 5vw, 5.5rem) | 780 | 68 | 0.94 | -0.01em |
| H2 | clamp(2.1rem, 3.4vw, 3.75rem) | 700 | 82 | 1.0 | |
| Explorer row | clamp(1.35rem, 2.3vw, 2.1rem) | 500 rest / 720 selected | 85 rest, 95 hover, 115 selected | | |
| Numeral | clamp(6rem, 15vw, 13rem) | 160 | 50 | 0.8 | |
| Clock | clamp(2.5rem, 5vw, 5rem) | 300 | 118 | | |

Register rows use Science Gothic 15-16px, weight 500, wdth 92, with digits in fixed-width spans. Body text is capped at 62ch and the lead at 52ch.

**Grid:** 12 columns, max-width 1440px, margins clamp(16px, 4vw, 56px), 24px gutter. Phones use 4 columns with 16px margins. Section padding runs py-32 to py-48 and varies between sections.

## 2. Motion config (src/lib/motion.ts)

```ts
import gsap from "gsap"; import { CustomEase } from "gsap/CustomEase";
gsap.registerPlugin(CustomEase);
export const ease = {
  arrive: CustomEase.create("arrive", "0.16,1,0.3,1"),
  leave: CustomEase.create("leave", "0.7,0,0.84,0"),
  shutter: CustomEase.create("shutter", "0.76,0,0.24,1"),
  settle: CustomEase.create("settle", "M0,0 C0.18,0.84 0.32,1.035 0.56,1.012 0.78,0.998 1,1"),
  scrub: "none",
};
export const dur = { instant: 0.18, quick: 0.35, base: 0.6, slow: 0.9, load: 1.2 };
export const stagger = { row: 0.03, line: 0.06, slat: 0.04 };
export const scrub = { pin: 1, drift: 0.5 };
export const magnet = { button: { pull: 0.3, label: 0.45, max: 10, field: 32 }, link: { pull: 0.2, max: 6, field: 12 } };
```

**Plugins** are registered once in `src/lib/gsap.ts`: ScrollTrigger, SplitText, DrawSVGPlugin, Flip, CustomEase and useGSAP.

**Media queries** via `gsap.matchMedia`:
- `full`: `(prefers-reduced-motion: no-preference) and (min-width: 1024px)`
- `compact`: `(prefers-reduced-motion: no-preference) and (max-width: 1023.98px)`
- `reduce`: `(prefers-reduced-motion: reduce)`

## 3. Global systems

**SmoothScroll** (the provider in layout):
- `ReactLenis root` with `options={{ autoRaf:false, lerp:0.1, anchors:false }}`.
- `useLenis(ScrollTrigger.update)` keeps ScrollTrigger in sync.
- `gsap.ticker.add(t => lenis.raf(t*1000))` drives Lenis, with `gsap.ticker.lagSmoothing(0)`.
- `ScrollTrigger.config({ ignoreMobileResize:true })`.
- Call `document.fonts.ready.then(() => ScrollTrigger.refresh())`.
- `respectReducedMotion` defaults to true.

**Anchor links.** All in-page links go through `scrollToSection(id)`:
- If the section has a pinned ScrollTrigger (id `night` or `contact`), call `lenis.scrollTo(st.start)`.
- Otherwise call `lenis.scrollTo('#id', { offset: -72 })`.
- Under reduced motion, pass `immediate: true`.

**Cursor** (`src/components/Cursor.tsx`):
- Mounts only when `matchMedia('(hover:hover) and (pointer:fine)')` matches and reduced motion is off. Otherwise it returns null and the native cursor stays.
- A fixed, `pointer-events:none` element driven by `gsap.quickTo` x/y (0.18s, power3.out). One rAF-coalesced pointermove listener on window.
- Its state comes from `closest('[data-cursor]')` on pointerover. The ring morphs by scale/width via a class, and the label text is written directly to the DOM.

| State | Look |
|---|---|
| Default | 10px Chalk ring, 1.5px |
| `link` | 40px Dawn ring, pulled 30% toward the target's centre |
| `slot` | 64x28 rounded rect reading "Book here", in Dawn |
| `time` | Capsule showing the ruler time under the pointer, plus "Drag", over the night track |
| `media` | 64px square outline over photo and work slots |
| `text` | Hidden; native caret |

- Hide the custom cursor on `document` mouseleave. Set `cursor:none` only on the elements that have custom states, never globally, so the native cursor stays everywhere else.

**Magnetic** (`src/components/Magnetic.tsx`, wraps a child):
- Fine pointers only. The field is the element's rect plus the field padding.
- Outer quickTo x/y is `offset*pull`, clamped to max. The inner `[data-magnet-label]` moves at `offset*label`.
- Follow: quickTo 0.45s power3.out. Release: tween to 0 over 0.8s with `settle`.
- Press: scale 0.97 over 0.12s.
- Coarse pointers get only the press scale, done in CSS `:active`.

**TradeProvider.** React context holding `trade` (dental | gym | salon | restaurant | optician), default dental. It is discrete state, so React state is fine. The hero select, the night H2 select and the demo select all bind to it. Continuous values never go into React state.

**Skip links:**
- "Skip to content" before the nav.
- "Skip the sample night" before #night; it jumps to #build.

## 4. Content model (src/content)

**`site.ts`:**
- BRAND = "Octavyl" // TODO: confirm spelling (ICP says Octaavyl)
- BOOKING_URL // TODO
- WHATSAPP_NUMBER // TODO
- EMAIL // TODO
- ADDRESS // TODO
- HOURS // TODO
- all section copy

**`trades.ts`.** Per trade:
- `label`: "dental clinic", "gym", "salon", "restaurant", "optician" (the text inside "at a ___"; restaurant uses "an"? no, "a restaurant", which is fine).
- `shop`: sample shop name used in the demo reply, e.g. "Anna Nagar Dental" (made up, TODO).
- `hours`: { open:"10:00", close:"20:30" }.
- `register`: 8 fixed rows. Each row is `{ time, preset?: {name, what} }`; exactly 3 are preset.
- `incoming`: 6 messages. Each is `{ channel, text, target: "slot" | "needs", entry: {name, what} }`.
- `night`: 7 events at fixed times, the same across trades: 19:40 call-busy, 21:42 whatsapp, 22:16 dm, 23:30 review (needs), 00:40 ad, 06:50 reminders, 07:20 refill. Each has `{ from, text, reply, without }`, with fixed-width columns.
- `morning`: the morning card copy.
- `demo`: `{ en: {busy, closed}, ta: {busy, closed} }` templates using `{shop}`, `{open}` and `{link}`.

The dental night (the others follow the same shape):

| Time | Source | Customer | Reply | Without |
|---|---|---|---|---|
| 19:40 | Missed call | "You were with a patient." (context line, not a quote) | "WhatsApp sent with your booking link. Booked Thu 10:00." | "Missed call. No reply." |
| 21:42 | WhatsApp | "Any slot tomorrow evening? Tooth pain since morning." | "Sent 3 open slots. Booked Tue 18:30." | "Seen at 9am." |
| 22:16 | Instagram | "Price for cleaning?" | "Sent the price list and a booking link." | "No reply." |
| 23:30 | Google review | "2 stars. Waited 40 minutes." | "Reply drafted. Waiting for your OK at 8am." (needs-you state: outlined) | "Unanswered." |
| 00:40 | Ad click | "Tapped your cleaning offer ad." | "Landed on the offer page. Booked Sat 11:00." | "Landed on your Instagram grid. Left." |
| 06:50 | Reminders | (none) | "Reminders sent to today's 9 patients." | "Not sent." |
| 07:20 | Cancellation | "Can't make 10:30, sorry." | "10:30 refilled from the waitlist." | "10:30 stays empty." |

- **Morning card:** "Since 7pm: 3 new bookings, 1 slot refilled, 9 reminders sent. 1 reply waits for you." Label: "Sample night. Names are made up."
- **Without summary:** "4 people to call back, 1 empty slot, 9 patients not reminded."
- **Tamil templates** must be reviewed by a native speaker (TODO). Busy: "வணக்கம்! {shop} இலிருந்து. உங்கள் அழைப்பை எடுக்க முடியவில்லை. இந்த லிங்கில் நேரம் பதிவு செய்யுங்கள்: {link}". Closed: "வணக்கம்! {shop} இப்போது மூடியுள்ளது. நாளை காலை {open} மணிக்கு திறப்போம். இப்போதே நேரம் பதிவு செய்ய: {link}".

## 5. Sections

### Nav (fixed, 72px; 60px on mobile)

**Layout:** wordmark "Octavyl" (Science Gothic 700, wdth 120, 20px), links, and "Book a call" (magnetic). Transparent at the top. After 40px of scroll, the background becomes Night at 85% with backdrop-blur 12px and a 1px `rule` bottom border (a sticky element, so blur is allowed).

**Mobile:** wordmark, a compact "Book a call", and a Menu button. The menu opens a full sheet on Street with a focus trap, Escape to close, and the rest of the page `inert`.

### 1. Hero (#top, min-h-[100dvh], pt-24 max)

**Layout:**
- **Left (cols 1-7):**
  - H1 in two nowrap line spans: "Shutter down." / "Still taking bookings."
  - Sub, 20 words max: "Websites, WhatsApp replies and online booking for Chennai clinics, gyms and salons. Your customers get an answer when you can't." // TODO: confirm services
  - CTAs: "Book a call" (primary) and "See a sample night" (link to #night).
- **Right (cols 8-12):** the Register panel, a Street background with 0 radius.
  - **Shutter band on top:** 4 slats, each 14px tall, with 2px Deep night grooves (repeating-linear-gradient). The clock "21:42" sits at the band's right in Science Gothic wdth 118. The band's bottom rail is 6px of darker Street.
  - **Header row:** "Tomorrow at a [select]". The select is native, styled as a 6px pressable.
  - **List:** an `<ol>` of 8 rows, each 44px tall with a 1px rule separator (the rules carry the time grid). Each row holds the time, the entry, and the status.
  - **Footer:** "Needs you: N" and a Pause button (`aria-pressed`, WCAG 2.2.2).
- **Incoming notes:** a single absolutely-positioned element in the gutter between the columns. It shows the channel ("WhatsApp, 21:42") in 13px dim and the customer's words in Anek 16px, quoted. The channel is written in words, never as an icon.

**Stream loop** (compositor-friendly; only while the hero is on screen and the tab is visible):
- Every 3.2s, the next incoming message appears: opacity plus a 12px y rise, quick.
- **Target:** if the pointer is over the panel, the free row nearest the pointer's y; otherwise the next free row in order. `needs` messages go to the footer counter instead of a row.
- **Route:** one SVG `<path>` in an overlay `<svg>` spanning the hero. A cubic from the note's right-middle to the row's left edge.
  - Control point = midpoint plus a pull toward the pointer. The pull is applied if the pointer is within 260px: 0.45x the offset, eased with quickTo 0.5s power3.out on the stored control-point object. It is recomputed on the same ticker frame as the parallax, so the endpoints never lag.
  - The route draws with DrawSVG from 0 to 100% over 0.6s in `shutter` ease, stroke Signal 1.5px.
- **On land:**
  - The row's entry text is set: clip-path inset from right to 0 over 0.35s (a small element, acceptable).
  - The status reads "Booked on WhatsApp, 21:44" in Dawn.
  - The row background flashes Street to Night once.
  - The route turns Dawn, then fades over 0.6s.
  - The note fades.
- **When all rows are full:** a 2.5s hold, then "turn the page". The rows clear with a quick stagger, and the clock and header day advance ("Wednesday"). Reset immediately on trade change.

**Hover or tap a filled row:** reveal a history line under it ("WhatsApp 21:42. Replied in 20 seconds. Confirmed 21:44."). Rows are `<button>`s when filled. Free rows are buttons with the `slot` cursor state; clicking one pins it as the next target.

**Parallax (fine pointer only):** the note layer moves ±10px with the pointer and the panel ∓4px (quickTo 0.6). Messages travel above the book.

**Load timeline** (useGSAP, `full` and `compact`):
1. The nav fades in (0.6).
2. H1 line 1 goes from yPercent -105 to 0 inside an overflow mask (0.9, shutter). Line 2 goes from yPercent 105 to 0 (0.9, arrive, +0.15).
3. The sub and CTAs fade in with a 12px y rise (0.6, +0.35).
4. The shutter band goes from scaleY 0 to 1 at transform-origin top (0.9, shutter, +0.2).
5. The rows appear (opacity 0 to 1, stagger row, +0.5).
6. The stream starts at 1.8s.

**Exit** (`full` only), a ScrollTrigger from `top top` to `bottom top` at scrub 0.5: the panel goes to y -60, and the H1 wrapper to y -6vh with opacity 0.4.

**Mobile:** the H1 is 2.6rem in 3 lines at wdth 60. The sub and both CTAs come next, then the panel, full width and 6 rows. There is no pointer targeting; tapping a free row targets it. The autopilot runs as normal.

**Reduced motion:** no stream. Every row is shown filled with its final text and 1 needs-you. The Pause button is hidden.

**Accessibility:** the panel is `role="region" aria-label="Sample appointment register"`. Its live updates are `aria-live="off"`. A visually hidden sentence summarises: "Sample: late messages are booked into tomorrow's register automatically."

### 2. A sample night (#night)

**Markup** (valid without JS):
- `<section aria-labelledby>` with H2 "One night at a [select]."
- A supporting line: "A sample night. Every message is the kind owners get when they're busy or closed."
- The toggle, `<button aria-pressed>`: "With Octavyl" / "Without".
- The counter: "Handled N" or "Waiting for you N".
- An `<ol class="track">` of `<li>` events. Each holds `<time>`, source, `<q>` for the customer's words, and the reply (`<p>`), with markers for 21:00 "Shutter down", the "5 hours later" break, 09:00 "Shutter up", the morning card, 2 work slots and the end frame.

**Desktop pin** (`full`):
- The section is 100dvh with the header fixed at the top (flex) and the track row filling the rest. The ruler (1px rule) runs through the middle of the track. Customer text sits above the ruler, replies below. Each event column is `width: clamp(300px, 26vw, 420px)`.
- **Track tween:**
  - `gsap.to(track, { x: () => -(track.scrollWidth - innerWidth), ease: "none" })`
  - ScrollTrigger: `{ trigger: section, start: "top top", end: () => "+=" + innerHeight * 3, pin: true, scrub: 1, invalidateOnRefresh: true }`
- **Playhead:** a vertical 1px Signal line at 38% of the width, spanning the track row, with the clock capsule on top. It is fixed in the pinned section, not in the track.
- **Clock:** an anchors array of `{x, minutes}` taken from each event's `offsetLeft` plus the markers, measured in `onRefresh`. `onUpdate` computes the track x under the playhead, interpolates the minutes, and writes `textContent` only when the minute changes.
- **Darkness:** an overlay div (Deep night) whose opacity is set via quickSetter from a function of time:
  - 0 at 19:30
  - 0.35 at 21:00
  - 0.7 at 01:00
  - 0.7 until 06:00
  - 0.2 at 08:00
  - 0 at 09:00
  - The overlay sits behind the text (z-order: bg, overlay, content), so contrast only rises.
- **Per event** (containerAnimation = track tween), trigger li, from `start: "left 46%"` to `end: "left 30%"`, scrub true:
  - The route path (a short vertical SVG from the quote to the reply) runs DrawSVG from 0 to 100%.
  - The reply's filled layer goes from opacity 0 to 1 over its outline layer.
  - At progress 1, a class switch turns the route's stroke Signal to Dawn (only one Signal route is live at a time).
  - The needs-you event keeps its outline layer.
- **Counter:** the number of anchors passed, written on change.
- **Morning card:** a ScrollTrigger with containerAnimation at `left 60%`, toggleActions `play none none reverse`. Clip-path goes from `inset(0 0 100% 0)` to `inset(0)` (0.9, shutter), then the lines rise.
- **Drag** (fine pointer): pointerdown on the track captures the pointer; pointermove calls `lenis.scrollTo(lenis.scroll - dx * (st.end - st.start) / travel, { immediate:true })`. The cursor state is `time`, and its label reads the time under the pointer x using the same anchor interpolation. The native cursor is suppressed while dragging.
- **Toggle (Without):**
  - `section[data-mode=without]`.
  - The replies' inner wrapper gets 2px Chalk strike bars, scaleX 0 to 1 from left, with stagger row, timed 0.35.
  - The reply text goes to dim, and the "without" text line crossfades in.
  - The counter label becomes "Waiting for you" and the summary caption appears.
  - This animates inner wrappers only, never the elements the scrub moves.
- **Trade change:** re-render the text only. Column widths are fixed, so scrollWidth is unchanged and no refresh is needed. As a safety net, call `ScrollTrigger.refresh()` in a `requestAnimationFrame` if the scrollWidth measured after the render differs.

**Compact and mobile:**
- No pin. A vertical `<ol>` with a sticky 56px clock bar at top 60px, showing the time of the event nearest the viewport's middle (an IntersectionObserver per event).
- Each event row: time and source on the left rail, the quote, then the reply.
- The route draws down in 0.5s as the row enters `top 70%`.
- Each row's background tint steps with time (a static class from the darkness function).
- The toggle works the same way.

**Reduced motion:** the same vertical list, fully drawn, with no sticky transitions.

**Work slots** (end of the track), each a `media` cursor target:
- Slot 1 and slot 2 are Street frames with 0 radius:
  - Header: "Real client nights go here."
  - Line: "After launch, with the owner's permission: bookings after closing, per week, before and after."
  - Label: "Placeholder"
  - // TODO: first client case
- End frame: "Your shop could be the first one here." with a "Book a call" button.

### 3. What we build (#build)

**Layout:**
- **Left (cols 1-7):**
  - H2 "What's going wrong at your shop?"
  - Lead: "Tick what's true. We'll show what we'd build first."
  - A `<ul>` of 6 rows. Each is a `<button aria-pressed>`: a 22px square tick box (6px radius) plus the line in Science Gothic. Rows are fixed height (64px desktop, 56px mobile) and `white-space: nowrap`, with `contain: layout paint`.
- **Right (cols 9-12), sticky top 96px:** the "Your first build" panel on Street.
  - A list of pieces. Each is a name in Science Gothic 600 and a one-line description in Anek dim.
  - Footer: "Most projects run INR 10k-1L. We'll quote after one call." // TODO. Then "Book a call".
  - Empty state: "Tick what's true. Most shops start with one."

**Rows** (TODO: confirm each mapping):

| Row | Piece | What it does |
|---|---|---|
| We miss calls when we're busy. | Missed-call reply | A WhatsApp reply to every missed call, with your booking link. |
| Messages after closing wait till morning. | After-hours replies | Answers timing and price questions and books a slot while you're closed. |
| Our register is paper. | Online booking and records | Customers pick a slot. You get one list with every customer's visits. |
| Google reviews go unanswered. | Review follow-up | Every customer gets a review request the next morning. You approve every reply. Everyone is asked, not only the happy ones, because Google bans review gating. |
| Our ads send people to Instagram. | Offer pages | A page for each offer that takes the booking. |
| No website, or an old one. | A site that books | Fast on a phone, found on Google, takes bookings. |

**Motion:**
- **Enter:** H2 and lead lines use SplitText mask lines (0.9, arrive, stagger line, `top 75%`). The rows then sweep from wdth 62 to 85, one after another (stagger 0.06, 0.6, arrive).
- **Hover** (fine pointer): the row goes to wdth 95 (timed 0.35).
- **Select:**
  - Selected: wdth 115, weight 720, Chalk, and the tick box fills Signal (a Signal item, one per viewport; it's the choice).
  - Deselected: back to rest.
- **Panel:** Flip captures state before and after the pieces change (0.6, arrive), and entering pieces fade in with a y of 10px.

**Mobile:**
- Rows cap at wdth 85 when selected (wdth 100 max), with the font scaled so the widest fits 328px.
- The panel becomes a sticky bottom bar, "Your build: 2 pieces", with an Open button. It opens a sheet (a dialog with a focus trap and Escape), showing the same content.

**Demo slab** (below, full width cols 1-12, a Street slab with 0 radius, py-16):
- **Left (cols 1-5):**
  - H3 "Try it: miss a call."
  - Controls:
    - Trade select, bound to the context.
    - Call time: a native `<input type=range>` from 07:00 to 23:30 in 15-minute steps, styled with a 44px thumb, `aria-valuetext` such as "9:40 pm", and the `time` cursor state.
    - Language: two toggle buttons, English and தமிழ்.
  - The shop state reads "Shop open, you're busy" or "Shutter down" from `hours`.
- **Right (cols 7-12):**
  - A message frame on Night with a 1px rule border (radius 0; it is not pressable). No WhatsApp green and no bubble tail.
  - A header row: "Sent from your WhatsApp Business number, 20 seconds after the missed call." // TODO confirm
  - The reply text in Anek (Anek Tamil for ta), rendered from the template.
  - When the output changes, the old text leaves at y -8 (quick, leave) and the new text arrives. Under reduced motion it swaps instantly.
- It is a pure function, `renderReply(trade, minutes, lang)`, in `src/lib/demo.ts`.

### 4. How we work (#process)

**Layout:**
- **Left (cols 1-4):** a sticky container (top 20vh) holding the numeral in an overflow mask. A vertical stack of 1 to 5 is moved by yPercent (-20% per step).
- **Right (cols 5-12):**
  - H2 "What happens after you book."
  - Lead: "Five steps. Your paper register stays until the new one works."
  - An `<ol>` of 5 steps. Each has the step verb (H3, Science Gothic, clamp 1.6-2.4rem) and a `<dl>` with 3 columns: What we do, What you do, When. It stacks on mobile.

**Steps** (TODO: all timings):

| # | Step | What we do | What you do | When |
|---|---|---|---|---|
| 1 | Talk | A short call about your busiest day and where customers slip away. | Tell us how bookings arrive today. | Day 1 |
| 2 | Visit | Sit at your front desk for a morning. | Show us a normal day. | Week 1 |
| 3 | Build | Set up the site, replies, booking and records on your own number and accounts. | Approve the wording. | Weeks 1-3 |
| 4 | Run together | Run it beside your paper register for a week. | Tell us what feels off. | Week 4 |
| 5 | Hand over | Train you and your staff in Tamil or English. | Call us when something breaks. | Then monthly |

**Motion:**
- The numeral stack uses a scrub tied to the `<ol>` (`top 40%` to `bottom 60%`), snapped to the 5 steps via a stepped function.
- Each step: clip-path goes from `inset(0 0 100% 0)` to `inset(0)` at `top 70%` (0.9, arrive), then the dl cells rise with stagger line.
- A 2px Signal line on the left edge of the list scales in Y with the scrub (transform-origin top). It's the progress lamp.

**Mobile:** the numeral shrinks to 4.5rem, is not sticky, and sits inline beside each step. The progress lamp stays.

**Reduced motion:** everything is static and visible.

### 5. About (#about)

**Layout:**
- **Text (cols 3-7):**
  - H2 "The person who builds it answers the phone." // TODO confirm
  - Body, 2 short paragraphs: "We're a small team in Chennai building websites, WhatsApp replies and booking systems for shops, clinics and gyms." // TODO. "We set everything up on your own number and accounts, so it stays yours." // TODO confirm.
  - A facts `<ul>` (3 lines, no icons): "We work in Tamil and English." / "We come to your shop." / "You own the accounts and the number." // TODO confirm each
- **Photo slot (cols 9-12):** 4:5, a Street frame with ruled lines every 44px, like register paper. Caption: "Photo placeholder: the founder at a client's counter." // TODO. Cursor state `media`. Real alt text once the photo exists.

**Motion:** the photo clip-path goes from `inset(100% 0 0 0)` to `inset(0)` (0.9, shutter, at `top 70%`). The H2 uses SplitText words with a mask, stagger 0.04. The body lines fade with a y of 16 (base). This is the only plain fade in the page, used on purpose for the quiet section.

### 6. Contact: the shutter (#contact)

**Structure:** `<section id="contact">`, pinned at `top top` for `end: "+=150%"`, scrub 1. It has three layers:
1. **Inside the shop** (bg Night): the Register panel, centred at 560px wide, showing all 8 rows filled for the current trade and the header "Tomorrow at a dental clinic: full". This reuses the hero Register in `static` mode.
2. **The shutter sheet**, absolutely positioned at inset 0 and starting at yPercent -100:
   - 10 slats, each 10% of the height, Street with grooves.
   - The bottom rail is 14px of darker Street with a centred lock-plate rectangle (plain rect, no drawn padlock).
3. **The paint layer**, which travels inside the sheet (so it moves with it):
   - Top slat: wordmark "Octavyl" plus "Websites, WhatsApp replies and booking".
   - Middle: H2 "Bring us the notebook."
   - Sub: "One call. You'll know what we'd build first and roughly what it costs." // TODO
   - Buttons: "Book a call" (primary, magnetic) and "WhatsApp us" (a wa.me link prefilled with "Hi, I run a {trade label} in Chennai." // TODO number).
   - A large painted phone number: "Call +91 XXXXX XXXXX" // TODO, Science Gothic wdth 150, weight 800, in Dawn.
   - Bottom rail line: "The shutter's down. This button still works."

**Timeline:**
- 0 to 0.12: the register rows glow in (a Street flash).
- 0.12 to 0.85: the sheet goes from yPercent -100 to 0 (ease `shutter`, within the scrub).
- 0.85 to 0.9: a settle, yPercent -1.2 then 0.
- 0.9 to 1: the paint lines rise through masks (stagger line).

**Fine pointer:** slats within 120px of the pointer shift y by up to 2px (quickTo 0.3), like a hand on metal. This is a candidate for "remove one thing".

**Focus safety:** a focusin inside #contact while the pin progress is below 1 calls `lenis.scrollTo(st.end, { immediate: true })`.

**Compact:** no pin. The sheet is already down and the paint lines reveal on enter (timed).

**Reduced motion:** static.

**Footer** (bg Deep night, `<footer>`):
- A 4-column grid: Visit (address // TODO), Hours (// TODO), Write (email // TODO), "Serving Chennai and the rest of Tamil Nadu."
- A bottom row: "© 2026 Octavyl AI Solutions" // TODO legal name, and a "Back to top" link.

## 6. Performance budget

- Nothing uses WebGL or canvas.
- Fonts come to about 200KB latin above the fold.
- Every ticker callback checks a `running` flag. The hero pauses via a ScrollTrigger `onToggle` (isActive) and `visibilitychange`.
- Pointer handlers set target values only, and the gsap ticker applies them.
- Only transform, opacity, clip-path on small or one-shot elements, SVG stroke-dashoffset (DrawSVG), and font-variation on single rows.
- Every animation lives in `useGSAP` with a scope, and `gsap.matchMedia` reverts on change.
- Targets: LCP under 2.5s (the H1 text is LCP), CLS under 0.1, and Lighthouse a11y of 95 or higher.

## 7. Meta and deliverables

**Metadata:**
- Title: "Octavyl: websites, WhatsApp replies and booking for Chennai shops"
- Description: "We build websites, WhatsApp replies and online booking for clinics, gyms and salons in Chennai. Your customers get an answer when you can't." // TODO
- `metadataBase`: TODO domain
- themeColor: #0A1128

**Social cards:** `app/opengraph-image.tsx` renders with ImageResponse at 1200x630: a Night background, shutter slats across the top third, and the H1 "Shutter down. Still taking bookings." in Science Gothic (TTF fetched at build time or stored in `src/app/_og/`). `twitter-image` is re-exported from the same file.

**Handover files:**
- `README.md`: setup (Node 20.9+, `npm i`, `npm run dev`), structure, where copy lives, and how to change trades.
- `TODO.md`: every TODO, generated by grep with file:line.

**Remove one thing** before finishing. Candidates: the slat ripple on the shutter, the hero parallax, and the nav link magnet. Pick after screenshots.

## 8. Slop blacklist check

| Blacklist item | How it's avoided |
|---|---|
| Gradients, orbs, blobs | Flat fills only. Depth comes from luminance steps and the time-driven overlay |
| Neural nets, particles | None. The only lines are single routes, message to reply |
| Glass card grids | No cards in grids. Street panels are single objects |
| Robots, circuits, stock AI | No imagery except the photo slot. The register and shutter are made of type and rules |
| Banned headlines | Checked. Every headline is 8 words or fewer and concrete |
| Highlighted words | None. Emphasis is weight or width |
| All-caps eyebrows | Zero eyebrows |
| Middle dots, "WORD — fragment" | Commas and full stops only |
| Fake proof | Sample night labelled; work slots labelled as placeholders; no logos or quotes |
| Emoji icons | No icons at all; words instead |
| Three-column icon grids | None |
