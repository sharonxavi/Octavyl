# Home page build spec

The Home page (`/`) explains who Octavyl is and what it builds. The original single page
now lives at `/solutions` and must not be restyled. This spec is the contract for every
Home section. Read it fully before writing code.

## Where things are

- Copy: `src/content/home.ts` (all Home words), `src/content/site.ts` (company facts), `src/content/trades.ts` (sample trade data). **Do not edit these files.** If copy needs changing, say so in your report.
- Motion config: `src/lib/motion.ts`. Use `ease.arrive` (reveals), `ease.leave` (exits), `ease.shutter` (heavy, in-out), `ease.settle` (release with slight overshoot), `"none"` for scrubs. Durations from `dur` (`slow` 0.9 is the reveal default; reveals are 0.7 to 1.1s), staggers 0.05 to 0.1s. Media queries from `MQ` (`full`, `compact`, `reduce`, `finePointer`). Do not invent new easings.
- GSAP: import from `@/lib/gsap` (`gsap, ScrollTrigger, SplitText, Flip, useGSAP`). Plugins are registered there once. If you need Draggable or InertiaPlugin, import from `gsap/Draggable` / `gsap/InertiaPlugin` and register inside your component module with `gsap.registerPlugin` guarded by `typeof window !== "undefined"`.
- Scroll: Lenis is the only scroll source (`src/components/SmoothScroll.tsx`), synced to ScrollTrigger. Use `getLenis()` and `scrollToSection(id)` from `@/lib/scroll`. Never add a second smooth-scroll or rAF loop for scrolling.
- Cursor: `src/components/Cursor.tsx`. Set context with attributes: `data-cursor="explore" data-cursor-label="Explore"`, `data-cursor="view" data-cursor-label="View"`, `data-cursor="drag" data-cursor-label="Drag"`, `data-cursor="media"`, `data-cursor="link"`. Or push state with `cursorBus.set({ state, label })` from `@/lib/cursor`.
- Buttons: `<BookCall />` (primary, magnetic, opens the booking link) from `@/components/BookCall`; `<Magnetic>` from `@/components/Magnetic` for any other magnetic control; classes `btn btn-primary`, `btn btn-quiet`, `btn-sm`, `btn-lg-mobile` (full-width 56px on phones), `link`.
- Internal links between pages: `<TransitionLink href="/solutions?type=gym">` from `@/components/shell/PageTransition`. Same-page anchors: `href="#contact"` with `onClick={onAnchorClick}` from `@/lib/scroll`, or `TransitionLink href="/#contact"`.
- Deep links: `solutionsHref(id)` from `@/lib/trade-param`.
- Contact form rules: `validateField`, `validateContact`, `sendContact` in `src/lib/contact.ts`; the API route is `src/app/api/contact/route.ts` (placeholder; do not change its contract).
- Placeholders: any copy string starting with `TODO:` must render visibly marked with `className="todo"` (inline) or `className="todo-block"` (a paragraph). Never style a placeholder to look like real content.

## Design system (reuse, don't reinvent)

- Tokens (Tailwind v4 `@theme`, usable as `var(--color-x)` or classes like `text-dim`, `bg-street`, `border-rule`):
  `deep #060B1C` (footer, labels on blue), `night #0A1128` (page), `street #16264F` (the one raised surface; raised = pressable or a panel), `signal #3F6FFF` (primary button, the active thing, the message in flight; rare), `dawn #8FB0FF` (links, handled, focus, accent text), `chalk #E8EEFC` (text), `dim #8D9CC4` (secondary text; solid colour, never opacity for text), `rule #1C2F63` (hairlines, only where they carry structure).
- Accent blue is a signal, not wallpaper. No gradient washes, no glows, no orbs, no glass.
- Type: Science Gothic (display, variable width axis) via `.t-h1`, `.t-h2`, `.t-h3`, `.t-data`, `.fd` with `--wdth` (condensed 50 to 60 for headlines, 84 to 128 for data and numerals). Body is Anek Latin: `.t-lead`, `.t-body`, `.t-small`. Headlines are sentence case. No all-caps labels, no eyebrow labels in caps, no middle-dot meta strings.
- Radius: 6px on pressables (buttons, cards that are links, inputs), 0 on everything else.
- Layout: `.wrap` (max 1440, side margin `--margin`) and `.grid12` (12 cols desktop, 4 cols below 1024px). Asymmetric, left-aligned layouts. Not everything centered. No identical 3-column card grids.
- Section rhythm: `py-28 lg:py-40` unless the section is pinned. Each section has an `id`, an `aria-labelledby` pointing at its `h2`. Only the hero has an `h1`.
- Existing page for reference of tone and quality: `src/components/sections/*.tsx` and their CSS in `src/app/globals.css`. Match that level of detail. Do not edit those files.

## Motion rules (strict)

1. Every animation needs a purpose: reveal, guide attention, or explain. No decoration.
2. Animate transform and opacity only (the FAQ height and clip-path reveals are the allowed exceptions). No animating width/height/top/left/margins/filters/box-shadows.
3. Create everything inside `useGSAP(() => { ... }, { scope: root })`. Use `const mm = gsap.matchMedia()` with the `MQ` strings and `return () => mm.revert()`. Anything you create outside GSAP (listeners, rAF, observers, canvases) must be cleaned up in the matchMedia callback's return or an effect cleanup. Navigating Home → Solutions → Home must not leave triggers behind (`window.__ST.getAll().length` must return to the same count).
4. Pinned sections: only in `MQ.full` (desktop with motion). Give the pin trigger `id: "pin-<sectionId>"` so `scrollToSection` can find it. Use `start: "top top"`, `end: () => "+=" + window.innerHeight * N`, `pin: true`, `scrub: 1`, `invalidateOnRefresh: true`, `anticipatePin: 1`. On `MQ.compact` (phones/tablets) the section is not pinned: use a simpler stacked layout.
5. `prefers-reduced-motion: reduce`: no scrubbing, no parallax, no canvas motion, no pins. Content fully visible and readable, with at most simple fades. Test with `--reduced`.
6. Touch (`MQ.finePointer` false): no custom cursor, no hover-only content, no tilt. Everything reachable by tap.
7. Reveals set their start state inside the matchMedia callback (so reduced motion and no-JS show content). Use `once: true` or `toggleActions: "play none none reverse"`. Keep text readable before hydration: don't hide above-the-fold text with JS.
8. Heavy work (canvas, many elements) pauses when off-screen (`IntersectionObserver`) and when the tab is hidden.

## Accessibility

Semantic HTML, keyboard reachable, visible focus (global `:focus-visible` outline in dawn, don't remove it), `aria-expanded`/`aria-controls` on disclosures, labels on every input, `aria-live` for form status, decorative art `aria-hidden="true"`, meaningful `alt`/`aria-label` for image placeholders. Contrast: body text chalk or dim on night/deep/street only.

## Files you own

Each section is one component in `src/components/home/<Name>.tsx` (replace the stub, keep the export name and the section `id`) plus its CSS in `src/styles/home/<file>.css` (already imported from globals.css). Prefix classes with the section key (`hh-`, `mf-`, `sv-`, `hw-`, `in-`, `ab-`, `wk-`, `fq-`, `ct-`). You may add helper components or files under `src/components/home/` with your prefix. Do not edit any other file. If you believe another file needs a change, describe it in your report.

## Verification (do all of it)

- `npx tsc --noEmit` must show no errors in your files (other agents are editing in parallel; ignore errors in files you don't own, but mention them).
- The dev server is already running at http://localhost:3210 (do not start or stop it). Screenshot with
  `node scripts/shoot.mjs --only=desktop,mobile --steps=<id>,<id>:0.5 --out=.captures/<your-key>` (a step `id:0.5` means halfway through the pin with id `pin-<id>`; a plain `id` scrolls to the section top). Add `--reduced` for the reduced-motion check. Read the PNGs and critique them honestly: alignment, spacing, overflow at 360px, contrast, whether the motion state reads.
- `node scripts/probe.mjs "<js expression>"` evaluates JS on the page (set `URL=` env for another route). Use it to check for overflow: `document.documentElement.scrollWidth <= innerWidth`.
- Check the console output of shoot.mjs for errors or warnings from your code.

---

## Section specs

### 1. Hero (`HomeHero.tsx`, `hero.css`, prefix `hh-`, id `top`)

Full viewport (`min-height: 100svh`, min 620px). Content left-aligned in columns 1 to 8, vertically centered slightly low. `h1` is `HOME_HERO.lines`, two lines, each inside its own `overflow-hidden` mask, bigger than `.t-h1`: display face, `--wdth` 52 to 54, weight ~740, `clamp(3rem, 7vw, 7rem)`, line-height 0.92. Then `sub` (`.t-lead`, chalk, max 44ch), then actions: `<BookCall wide />` and a `TransitionLink` to `/solutions` styled `btn btn-quiet btn-lg-mobile` with the `secondary` text.

**Load-in (CSS keyframes, not JS, so it runs before hydration and doesn't delay LCP):** line 1 slides up from its mask at 0.1s, line 2 at 0.2s (0.9s, `--ease-arrive`), sub rises 14px at 0.55s, actions at 0.65s (0.7s each, transform only, no opacity on the sub). Total under 1.8s. Wrap in `@media (prefers-reduced-motion: no-preference)`. Don't reuse the `.hero` / `.h1-line-a` classes from the original page; use `hh-` classes.

**Background: the route field** (`HeroField.tsx`, a `<canvas>`, loaded with `next/dynamic(..., { ssr: false })` and started after first paint via `requestIdleCallback` or a short timeout; fades in with CSS opacity when ready). It is a map of the business's messages, not sparkles and not a brain:
- Nodes on a jittered grid (~110px spacing on desktop, ~90px on phones), denser toward the right half; a CSS `mask-image` fades the field out behind the text on the left (a technical fade, not a visible gradient).
- Edges connect each node to its right and lower neighbours (street-grid feel), with ~15% of edges removed at random (seeded, so it's stable). Hairlines in `--color-rule`.
- Three node kinds, drawn as small squares (radius 0): customers (2.5px, dim), agents (~7px outline squares in signal, about 1 in 9 nodes), booked slots (4px dawn squares, a few near the right edge).
- Every ~0.8 to 1.4s a message (a short bright segment in signal with a dawn head) leaves a customer node, travels edge by edge along a precomputed shortest path to the nearest agent, the agent square pulses once, then continues to a booked-slot node which lights up and fades. That's the story: message → agent → booking. At most ~5 messages in flight.
- Pointer (fine pointer only): nodes within ~180px are pushed away from the cursor with a smooth falloff (eased with a lerp per frame), and edges are drawn as quadratic curves whose control point is the displaced midpoint, so the lines visibly bend around the cursor. Edges near the cursor brighten slightly (rule → dim). Keep it subtle.
- Touch: no pointer, a slow drift (each node wobbles a few px on a slow sine), fewer messages. Reduced motion: one static frame with two or three routes drawn lit, no animation loop at all.
- Performance: devicePixelRatio capped at 2; rebuild the grid on resize (debounced); pause the loop when the hero is off-screen or the tab is hidden; no allocations per frame in the hot loop if you can avoid it. Target < 2ms per frame on desktop.
- A small legend bottom-right on desktop (bottom-left under the actions on phones, or hidden if cramped): three tiny squares with `HOME_HERO.legend` labels and `legendNote` in `.t-small text-dim`. It explains the art.

**Scroll cue:** bottom-left, `HOME_HERO.cue` in `.t-small text-dim` beside a 1px × 40px rule with a small signal square travelling down it (CSS animation, 2.4s loop, hidden under reduced motion). Hide it after the user scrolls 40px.

**Hand-off (full mode only):** as the hero scrolls out, the headline block moves up ~12% slower than the page (scrubbed) and the field's opacity drops to ~0.35. Purpose: it recedes as the story starts.

### 2. Manifesto (`Manifesto.tsx`, `manifesto.css`, prefix `mf-`, id `belief`)

`h2` is `MANIFESTO.label` rendered small (`.t-small text-dim`, sentence case) on the left (columns 1 to 3, sticky on desktop). The paragraph (`MANIFESTO.text`, parse `[[...]]` into `<em class="mf-key">` accent phrases in `--color-dawn`, not italic) sits in columns 4 to 12, display face at `--wdth` ~70, weight ~560, `clamp(1.9rem, 3.7vw, 3.9rem)`, line-height 1.08, `text-wrap: pretty`. It must read as a paragraph, not a headline.

Scroll-scrubbed reading: split into words with `SplitText` (`type: "words"`, `aria: "none"` because the paragraph text stays in the DOM order; add the full text as `aria-label` on the wrapper only if needed; test with the accessibility tree). Each word's opacity goes from 0.5 to 1 (lower fails large-text contrast), scrubbed (`scrub: 0.6`, `start: "top 78%"`, `end: "bottom 55%"`, stagger across words, ease "none"), so the paragraph brightens as you read down it. Not pinned. Reduced motion: all words at full opacity, no split. Compact: same effect, scrub 0.4. Padding `py-32 lg:py-48`.

### 3. Services (`Services.tsx` + `ServiceArt.tsx`, `services.css`, prefix `sv-`, id `services`)

Header: `h2` `SERVICES.title` and `lead` above the list, left-aligned.

**Desktop, motion (`MQ.full`): pinned** for `innerHeight * 3` (id `pin-services`). Left (columns 1 to 6): the five items as a big numbered list: number `01` to `05` in `.t-data` dim, title in display face (`--wdth` ~56, weight 680, `clamp(1.7rem, 2.6vw, 2.75rem)`, line-height 1.02). Active item chalk with its number in signal and a 2px signal bar that grows on its left (scaleY); inactive items dim (`--color-dim`, not opacity). Right (columns 7 to 12): the detail panel on `--color-street` (radius 0), containing: the title (`.t-h3`), the `outcome` (`.t-lead` chalk), a `SERVICES.buildsLabel` small label, the `builds` list as three lines with a hairline between them, and the illustration (`ServiceArt`) filling the top ~55% of the panel.
- Scroll progress picks the active item: `Math.min(4, Math.floor(progress * 5))`. Changing item swaps panel content: outgoing text moves up 12px and fades (0.25s, `ease.leave`), incoming text clip-reveals from below (0.5s, `ease.arrive`, lines staggered 0.05). The panel itself doesn't move.
- Hover (fine pointer) or keyboard focus on a list item also activates it. Each list item is a `<button>`; click scrolls Lenis to the centre of that item's segment of the pin (`st.start + (i + 0.5) / 5 * (st.end - st.start)`).
- A thin progress track under the list: 5 segments, the current one filled signal.

**Compact and reduced motion: accordion.** Stacked items, each a `<button aria-expanded aria-controls>` row (number, title, a plus/minus drawn with two 1.5px lines). Opening one closes the others and animates height with GSAP (0 → auto, 0.5s, `ease.arrive`; instant under reduced motion) and reveals the panel content (outcome, builds, and the illustration at a smaller size). The first item starts open. Call `ScrollTrigger.refresh()` after the height animation completes.

**ServiceArt** (`<svg viewBox="0 0 480 300">`, stroke 1.5px, `vector-effect: non-scaling-stroke`, colours from tokens via CSS classes, labels in Anek 12px `dim`, radius 0 everywhere): each art is a three-stage flow, source → agent → result, with the agent as the same square in the middle every time (so the five read as one family). A small signal "message" square travels the connectors on a loop while the item is active (GSAP timeline or CSS animation gated by a `data-active` attribute; paused when inactive or under reduced motion, where the final state is shown statically).
1. `booking`: left, a chat bubble with a text line "Can I come at 5?"; right, a 4 × 3 calendar grid; on arrival one cell fills signal and a tick draws in.
2. `reception`: left, a phone handset outline with 5 waveform bars (scaleY loop while ringing); right, two outputs forking from the agent: "Answered" with two transcript lines, and "Sent to you" with a smaller line (for the unusual case).
3. `whatsapp`: left, three incoming bubbles stacked; right, three reply bubbles, whose double ticks turn dawn one after another.
4. `leads`: left, a small form/ad card; right, a timeline with dots "Day 1", "Day 3", "Day 7" lighting in sequence, the last one becoming a booked square.
5. `workflow`: left, a document with lines (a bill); right, a three-row table whose rows fill one by one, and a small "Summary at 9pm" line.

### 4. How we work (`HowWeWork.tsx` + `HowArt.tsx`, `how.css`, prefix `hw-`, id `how`)

Header: `h2` `HOW.title` + `lead`.

**Desktop, motion: pinned** for `innerHeight * 3.2` (id `pin-how`), one scrubbed timeline (`scrub: 1`) with 4 labelled stages.
- Left (columns 1 to 5): the four steps as a vertical list with a 2px progress line on its left (rule track, signal fill, `scaleY` scrubbed with the timeline). Each step: step name (display face, `--wdth` 58, weight 700, ~2rem), `when` in `.t-data` dim. The active step expands to show `does` (chalk) and a `getsLabel` / `gets` pair (`gets` in dawn). Inactive steps collapse to the name line and dim. Use transforms/opacity for the swap (the text blocks can be absolutely stacked or use a `grid-template-areas` stack trick so no height animates).
- Right (columns 7 to 12): `HowArt`, one SVG (`viewBox="0 0 560 460"`) whose same ~12 pieces transform between four states as the timeline scrubs. This is the explanation of the process, so it must read:
  - Discover: 12 small squares/tags scattered loosely like notes on a counter, a few with tiny labels ("missed call", "Sunday enquiry", "paper register", "Instagram DM"), slight rotations.
  - Design: the pieces line up into three columns (in → agent → out) and dashed connector lines draw between them (`stroke-dashoffset`).
  - Build: dashed lines become solid, the agent block fills street and gets a signal outline, pieces snap into a neat grid of slots.
  - Launch & support: small signal squares run along the connectors continuously (this part can loop independently while the stage is active), and a small "Week 1, 2, 3, 4" tick row lights up.
  Tween positions with `x`/`y`/`rotation`/`scale`/`opacity` and `ease.shutter`, driven by the scrubbed timeline.

**Compact:** not pinned. Steps stacked; `HowArt` sits sticky at the top on tablets or above each step on phones, and switches state as each step enters (toggle-based tweens, not scrub). **Reduced motion:** steps stacked and fully expanded, the art shows the final (Build) state statically.

### 5. Industries (`Industries.tsx`, `industries.css`, prefix `in-`, id `industries`)

Header left: `h2` `INDUSTRIES.title`, `lead`, and `hint` (`.t-small text-dim`, desktop only).

A horizontal row of cards that bleeds off the right edge: the five `INDUSTRIES.cards` plus the `other` card. Each trade card is a `TransitionLink` to `solutionsHref(id)` (radius 6px, `--color-street`, ~340 × 440px desktop, ~78vw × 400px phones) with `data-cursor="explore" data-cursor-label="Explore"`. Content: the index `01`, the `name` in display face (`--wdth` 56, ~2.4rem), a mini message: from `TRADES[id].incoming[0]` show the `channel` and `at` in `.t-data` dim and the customer's words (`said`) in quotes, then from `TRADES[id].night[0].reply` the reply in dawn with a small signal square before it (this is real sample data from the /solutions page), the `line` at the bottom in dim, and `INDUSTRIES.open` with a small arrow drawn in CSS. The `other` card is a `TransitionLink` to `/#contact`, outlined (1px rule, no fill), with `other.name`, `other.line`, `other.cta`.

- Scrolling: the row is a native horizontal scroller (`overflow-x: auto`, `scroll-snap-type: x proximity`, hidden scrollbar, `overscroll-behavior-x: contain`, add `data-lenis-prevent-wheel` only if vertical page scrolling still works over it; test both). On fine pointers add click-drag with momentum (pointer events + `gsap.to(el, { scrollLeft })` for the throw, or Draggable `type: "scrollLeft"` with inertia). A drag must not trigger the card link (suppress the click if the pointer moved > 6px). Keyboard: tabbing to a card scrolls it into view (native).
- Tilt (fine pointer + motion only): each card tilts toward the pointer, `rotateX`/`rotateY` up to 7deg via `gsap.quickTo`, `transformPerspective: 900`, and a soft light (a ~260px circle, `radial-gradient` of dawn at ~14% alpha to transparent, as a child element moved with `x`/`y` transforms, opacity 0 → 1 on enter) follows the pointer inside the card. On leave, settle back with `ease.settle`.
- Entrance: cards rise 40px and fade in with a 0.07 stagger when the row enters. Reduced motion: no tilt, no drag throw, plain fades.

### 6. About (`AboutHome.tsx`, `about.css`, prefix `ab-`, id `about`)

- Columns 1 to 5: `h2` `ABOUT_HOME.title` (word mask reveal like the original About), then `story` rendered as a `.todo-block` (it's a TODO) at `.t-lead` size.
- Columns 7 to 12: `principlesTitle` small label, then the four `principles` as a ledger: each row has a hairline top border, the title in display face (`--wdth` 62, weight 650, ~1.6rem) and the `line` in dim below or to the right. Rows reveal with a clip-path wipe from the left, staggered. Not cards.
- Below, full width: `teamTitle` and the `team` people in a two-column layout on desktop (stack on phones): a portrait placeholder (4:5, `--color-street` with the horizontal slat lines used by `.photo-slot` in globals.css, a `.tag` "Photo placeholder", `role="img"` with an `aria-label`), then name, role, bio (each is a `TODO:` string, render with `.todo`). The portrait reveals with `clip-path: inset(100% 0 0 0)` → `inset(0)` (1.1s, `ease.shutter`) and its inner layer has a subtle scrubbed parallax (`yPercent` -6 → 6) in full mode only. `data-cursor="media"` on portraits.
- No numbers, no counters.

### 7. Work (`Work.tsx`, `work.css`, prefix `wk-`, id `work`)

Header: `h2` `WORK.title` + `lead`.

**Desktop, motion: pinned horizontal** (id `pin-work`): vertical scroll drives a track of three large cards plus an end panel (`WORK.end` with `<BookCall />`). Track `x` tween with `ease: "none"`, `end: () => "+=" + (track.scrollWidth - innerWidth)`, `scrub: 1`, `invalidateOnRefresh: true`. Each card (~58vw × 68vh) is a `TransitionLink` to `solutionsHref(item.trade)` (it opens the sample for that trade until real case-study pages exist), so it is pressable: radius 6px. It has an image area (top ~65%) and a caption. The image area is a placeholder composition (no stock images): a `--color-street` block with a drawn mini "screen" of register rows or chat lines in `rule`/`dim`/`dawn`, plus a `.tag` "Placeholder". The inner composition parallaxes horizontally against the track (`xPercent` -8 → 8 using `containerAnimation`). Caption: `client` and `place` (each rendered `.todo`), then `built` and `result` (also `.todo`), in a two-column caption grid. `data-cursor="view" data-cursor-label="View"` on each card.
- A small progress readout (`1 / 3`) in `.t-data` that updates as cards pass.

**Compact and reduced motion:** not pinned; cards stacked vertically, full width, no parallax.

### 8. FAQ (`Faq.tsx`, `faq.css`, prefix `fq-`, id `faq`)

Columns 1 to 4 (sticky on desktop): `h2` `FAQ.title`, then `lead` with "WhatsApp" as a link (`whatsappHref(...)` from site.ts, `target="_blank"`). Columns 6 to 12: the six items. Each question is a `<button aria-expanded aria-controls>` inside an `h3`, full-width row with a hairline, question in display face (`--wdth` 64, weight 600, ~1.5rem), and a plus that rotates to a minus (two 1.5px lines, transform only). The answer region (`role="region"`, `aria-labelledby`) animates height 0 → auto with GSAP (0.5s `ease.arrive`, answer text fades up 8px), collapse 0.35s `ease.leave`. Several can be open. If `confirm` is present, render it after the answer as a `.todo`. After each toggle completes call `ScrollTrigger.refresh()`. Reduced motion: instant open/close.

### 9. Final CTA + contact (`ContactHome.tsx` + `ContactForm.tsx`, `contact.css`, prefix `ct-`, id `contact`)

- Giant `h2` `CONTACT_HOME.title`: display face `--wdth` 52, weight 780, `clamp(3rem, 8vw, 8.5rem)`, line-height 0.92, spanning columns 1 to 11, revealed line by line from masks (SplitText lines, `mask: "lines"`, once). Then `sub` (`.t-lead`), then a large magnetic `<BookCall />`.
- Below, columns 7 to 12 on desktop (full width on phones): `formTitle` and the form. Columns 1 to 5 beside it: the direct details from site.ts (email link, WhatsApp link, `PHONE_DISPLAY`, `AREA`, `HOURS`), with placeholder values rendered as they come (they're already marked TODO in site.ts; show `PHONE_DISPLAY` as-is).
- Form fields: name (text, `autocomplete="name"`), business (native `<select>` with `options`, first option the placeholder), contact (text, `inputmode="email"`, `autocomplete="email"`; accepts email or phone), message (textarea, 4 rows). Plus a visually hidden honeypot input `name="company"` (`tabindex={-1}`, `autocomplete="off"`, `aria-hidden`). Inputs: `--color-street` background, 6px radius, 52px tall, chalk text, a 1px rule inset border that turns dawn on focus, visible focus ring. Labels always visible above fields (not placeholders-as-labels). Hints in `.t-small text-dim` linked with `aria-describedby`.
- Validation with `validateField`: on blur (after the first touch) and on submit. Invalid: `aria-invalid="true"`. There is no red in the palette, so mark the field with a 2px dawn left bar and show the error text in chalk with a small dawn square before it, linked via `aria-describedby`. On submit with errors, focus the first invalid field and shake nothing (no shake animations).
- Submit button (`btn btn-primary`, magnetic): states idle `submit`, sending (`sending` with a 3-square progress animation, button `aria-disabled`), then:
  - Success: the form collapses (clip-path up, 0.5s `ease.shutter`) and a success panel reveals in its place: `success.title` with `{name}` replaced, `success.body`, a `success.again` quiet button that resets the form. Announce via an `aria-live="polite"` region and move focus to the success heading.
  - Failure: keep the form and its values, show `failure.title` / `failure.body` in a panel above the button with `failure.retry` (resubmits) and a `failure.whatsapp` link (`whatsappHref`).
- Submission uses `sendContact` (POST `/api/contact`). The handler is a placeholder; leave the `// TODO: connect to email service / CRM` note where it is (in the API route) and add a one-line comment in the form pointing to it.
