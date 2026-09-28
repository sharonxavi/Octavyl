# Octavyl website

A one-page site for Octavyl: websites, WhatsApp replies and online booking for Chennai clinics, gyms and salons.

The concept is **Shutter down**. The page runs one evening of a shop on the visitor's own trade:

- **Hero.** A live appointment register fills itself while the shutter is down, and your pointer picks the slot.
- **A sample night.** A pinned, sideways night from 19:30 to 09:00.
- **What we build.** A checklist of what's going wrong at your shop, which builds a first project beside it, plus a working "miss a call" demo.
- **How we work.** A five-step timetable.
- **About.** Who the team is.
- **Contact.** Closes on a shop shutter that comes down with the contact details painted on it.

The design plan the build follows is in `docs/plan.md`, and the full build spec is in `docs/build-spec.md`.

## Run it

You need Node 20.9 or newer (built with Node 24).

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

For a production build, run `npm run build` and then `npm start`.

## Where things live

| What | Where |
|---|---|
| All copy, links, phone, email, prices | `src/content/site.ts` |
| Trades (dental, diagnostics, gym, salon, optician): sample register, messages, sample night | `src/content/trades.ts` |
| Colours, type, component styles | `src/app/globals.css` (tokens at the top) |
| Every easing and duration | `src/lib/motion.ts` |
| Sections | `src/components/sections/*.tsx` |
| Smooth scroll (Lenis driven by GSAP's ticker) | `src/components/SmoothScroll.tsx` |
| Custom cursor, magnetic buttons | `src/components/Cursor.tsx`, `src/components/Magnetic.tsx` |
| Missed-call demo logic (a pure function) | `src/lib/demo.ts` |
| Social preview image | `src/app/opengraph-image.png` (1200x630) |

**Add or change a trade.** Copy one block in `trades.ts`. Keep the same number of register rows (8), incoming messages (6) and night events (7). The sample night's layout depends on the counts matching, so switching trade never jumps the pinned section.

**Fonts.** Science Gothic is used for headlines, the register and the clock; its width axis carries meaning (condensed for headlines, wide for time). Anek Latin sets the body text, and Anek Tamil is used for the Tamil demo reply. All three load through `next/font/google` and are self-hosted at build time.

## Placeholders

Every company-specific line is marked `TODO:`. Run the lister to get the full list with file and line numbers. It also rewrites `TODO.md`.

```bash
npm run todos
```

The ones to answer first:

1. Brand spelling: Octavyl or Octaavyl.
2. `BOOKING_URL`, `WHATSAPP_NUMBER`, `PHONE_DISPLAY`, `EMAIL`, `SITE_URL` in `site.ts`.
3. Whether you sell WhatsApp auto-replies and online booking (the concept leans on them).
4. The founder's photo and name for About.
5. Whether "Projects run INR 10k-1L" can be shown.
6. A native speaker's check of the two Tamil templates in `trades.ts`.

## Motion and accessibility

- **Visitors who ask for less motion** (`prefers-reduced-motion`) get a calm version with nothing pinned, scrubbed, magnetic or custom-cursored. The register starts full, the night is a plain timeline and the shutter is already down.
- **Touch devices** keep the native cursor. Every hover has a tap equivalent.
- **The hero's live register** has a Pause button.
- **Pinned sections** have skip links.
- **The contact shutter** jumps to its landed state when a keyboard user tabs into it.

## Screenshots

`scripts/shoot.mjs` drives the Microsoft Edge already installed on Windows through `playwright-core`, headless, with no browser download. With the dev server running on port 3210:

```bash
node scripts/shoot.mjs --only=desktop,mobile --steps=hero,night:0.3,build,contact:1
```

Add `--reduced` for the reduced-motion version. Images go to `.captures/`.
