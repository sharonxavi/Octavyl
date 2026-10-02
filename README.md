# Octavyl website

The site for Octavyl, an AI agency that builds booking agents, receptionists, WhatsApp automation and follow-ups for clinics, gyms, salons and shops in Chennai.

Two pages share one shell:

| Route | What it is |
|---|---|
| `/` | **Home.** Who we are and what we build: hero over a WebGL signal terrain (lines in perspective that rise to the right, carry messages, lift toward the cursor and ripple on click), manifesto, services (pinned), how we work (pinned), industries row, about, recent work (pinned, sideways), FAQ, contact form. |
| `/solutions` | **See it for your business.** The original "Shutter down" experience: pick a trade and watch a sample evening and night. Unchanged apart from the shared nav and footer. |
| `/solutions?type=salon` | Opens the sample with a trade already chosen. Accepts `dental`, `clinic`, `diagnostics`, `lab`, `gym`, `fitness`, `salon`, `parlour`, `optician`, `optical`. Changing the trade on the page updates the address. |
| `/api/contact` | Placeholder handler for the Home form. It validates and logs; it does not send anything yet. |

The nav, footer, cursor, smooth scroll and the page transition (a shutter that comes down over the old page and rolls up on the new one) live in the root layout and persist across routes.

## Run it

You need Node 20.9 or newer (built with Node 24).

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Other scripts: `npm run build`, `npm start`, `npm run typecheck`, `npm run lint`, `npm run todos`.

## Where things live

| What | Where |
|---|---|
| Home copy (every line) | `src/content/home.ts` |
| Company facts: links, phone, email, hours, nav, social | `src/content/site.ts` |
| Solutions copy and the five sample trades | `src/content/site.ts`, `src/content/trades.ts` |
| Colours, type, buttons (tokens at the top) | `src/app/globals.css` |
| Nav, menu, page shutter, footer, placeholder style | `src/styles/shell.css`, `src/components/Nav.tsx`, `src/components/shell/` |
| Home sections and their styles | `src/components/home/*.tsx`, `src/styles/home/*.css` |
| Solutions sections | `src/components/sections/*.tsx` (styles in `globals.css`) |
| Every easing and duration | `src/lib/motion.ts` |
| Contact form rules (shared by browser and server) | `src/lib/contact.ts` |
| Titles, descriptions, social cards | `src/lib/meta.ts`, each `page.tsx`, `opengraph-image.png` in `src/app/` and `src/app/solutions/` |
| Home build spec | `docs/home-spec.md` |

## Placeholders

Anything you still need to supply is marked `TODO:` in the code, and anything visible on the page is drawn with a dashed outline so it can't pass for real content. To list them all with file and line numbers (this also rewrites `TODO.md`):

```bash
npm run todos
```

The ones to answer first:

1. **Contact form delivery.** `src/app/api/contact/route.ts` only logs enquiries. Connect it to email or a CRM before the site goes live, or enquiries are lost.
2. Brand spelling (Octavyl or Octaavyl), `BOOKING_URL`, `WHATSAPP_NUMBER`, `PHONE_DISPLAY`, `EMAIL`, `SITE_URL` in `site.ts`.
3. The five services and their bullets in `home.ts`, especially whether you offer voice calls.
4. The four steps and timings in `home.ts`.
5. The About story, team names, roles, bios and photos.
6. Three real projects for Recent work, shared with each owner's permission.
7. FAQ facts marked "TODO: confirm" (pricing, timings, data handling, support terms).
8. Social links in `site.ts` (Instagram, LinkedIn, Google Maps).

## Motion and accessibility

- **Reduced motion** (`prefers-reduced-motion`): nothing pins, scrubs, drifts or follows the cursor. Diagrams show their finished state, accordions open instantly, and the page transition is a short fade.
- **Touch**: native cursor, no tilt, no hover-only content. Pinned sections become stacked layouts below 1024px.
- **Keyboard**: every control is a real button or link with a visible focus ring. The mobile menu traps focus and closes on Escape. After a page change, focus moves to the new page's heading.
- **Route changes** clean up every scroll trigger. `node scripts/routes.mjs` goes Home to Solutions and back repeatedly and prints the trigger count each time, so a leak shows up as a growing number.

## Checks

The scripts drive the Microsoft Edge already installed on Windows through `playwright-core`, headless. Start the dev server on port 3210 first.

```bash
node scripts/routes.mjs
```

```bash
node scripts/home-checks.mjs
```

```bash
node scripts/shoot.mjs --only=desktop,mobile --steps=hero,services:0.5,how:0.5,work:0.5,contact
```

`node scripts/hero-terrain.mjs` captures the hero idle, under a moving pointer and after a click, and prints the terrain's frame cost.

`routes.mjs` covers navigation, deep links, hash links, reload and back. `home-checks.mjs` covers the form (errors, failure, success), the FAQ, and industry-card drag versus click. `shoot.mjs` writes screenshots to `.captures/`; add `--reduced` for the reduced-motion version. `node scripts/og-home.mjs` re-renders Home's social card from the live hero.
