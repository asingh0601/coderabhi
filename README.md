# coderabhi.in

Personal site — single static page, no build step, no dependencies.

## Files

| File | Purpose |
|---|---|
| `index.html` | Home page |
| `forge-pilot.html` | Forge Pilot (Visual Studio extension) |
| `ngx-circle-chart.html` | Library page + live demo |
| `ngx-modern-calendar.html` | Library page + live demo |
| `ngx-easy-captcha.html` | Library page + live demo |
| `styles.css` | Shared stylesheet |
| `page.js` | Shared script for the sub-pages |
| `assets/` | Logo, favicons, social preview card |
| `demo/` | **Built Angular demo apps** — see below |
| `robots.txt` · `sitemap.xml` | Crawler rules + sitemap |
| `CNAME` · `.nojekyll` | GitHub Pages custom domain + skip Jekyll |

CSS lives in `styles.css` so the pages can't drift apart; `page.js` carries the shared
nav/reveal behaviour for every page except `index.html`, which has extra logic of its own.

## The live demos

`demo/` holds the **real, compiled Angular apps** from `D:\Projects\angx-libs`, embedded in
an iframe on each library page. They are genuine builds of the published packages, not
reproductions.

GitHub Pages has no build step, so the compiled output has to be committed. It is ~690 KB
total (44–76 KB transferred per demo).

**To refresh a demo after changing a library:**

```bash
cd D:/Projects/angx-libs/<lib> && npx ng build @angx/<lib> && npx ng build <lib> --base-href=./
```

Then copy `dist/<lib>/browser/` over `demo/<lib>/` in this repo.

Two things to keep right:

- **`--base-href`.** `ngx-circle-chart` and `ngx-modern-calendar` use `./` so they work from
  any path. `ngx-easy-captcha` uses the absolute `/demo/ngx-easy-captcha/` because it is a
  router SPA and its routes need a fixed root. Do not run these builds from Git Bash — MSYS
  rewrites a leading `/` into a Windows path and silently corrupts the base href.
- **Route fallbacks.** GitHub Pages can't rewrite, so `demo/ngx-easy-captcha/<route>/index.html`
  is a copy of the app's `index.html` for each route. Re-copy them after a rebuild.

Iframe `src` values point at an explicit `index.html`, not a directory, so the pages also
work when opened straight off disk rather than through a server.

**The captcha demo** uses Cloudflare's public test key `1x00000000000000000000AA`, which comes
from the library repo itself. It passes automatically, so no visible checkbox is drawn — the
form's "Token received" line is the proof it worked. The page says so explicitly.

## Local preview

Any static server works:

```bash
npx serve .
```

Or just open `index.html` in a browser.

## Deploy — GitHub Pages

Repo: https://github.com/asingh0601/coderabhi (branch `main`, site served from the root).

`CNAME` (contains `coderabhi.in`) and `.nojekyll` are already committed, so Pages will pick up the
custom domain and serve the files as-is without running Jekyll.

**One-time setup in the repo settings:**

1. **Settings → General → Danger Zone → Change visibility → Public.**
   GitHub Pages only serves private repos on paid plans, so a private repo on a free account
   will never publish.
2. **Settings → Pages → Source:** *Deploy from a branch* → branch `main`, folder `/ (root)` → Save.
3. **Settings → Pages → Custom domain:** should auto-fill to `coderabhi.in` from the `CNAME` file.
   Tick **Enforce HTTPS** once the certificate finishes provisioning (can take up to ~24h).

**DNS at the registrar for the apex domain `coderabhi.in`:**

| Type | Name | Value |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |
| CNAME | `www` | `asingh0601.github.io` |

**Publishing an update:** commit and `git push` — Pages redeploys automatically.

### Other hosts

Cloudflare Pages / Netlify / Vercel also work with no build step: build command empty, output
directory `.`.

## Privacy note

No phone number, email address, physical address, employer names, or education details appear
anywhere in the markup. Experience is described by domain only. External links are limited to:

- https://github.com/asingh0601
- https://www.npmjs.com/~onlyabhishek
- https://marketplace.visualstudio.com/publishers/er-abhishek
- https://buymeacoffee.com/er.abhishek
- https://aitranslate.in

> The marketplace link uses the **public** `/publishers/er-abhishek` path, not the
> `/manage/publishers/er-abhishek` dashboard URL — that one requires your login and is not
> viewable by visitors.

## Tone

Written so a **non-technical visitor** (recruiter, client, founder) understands it on first read.
Jargon is either avoided or explained inline:

| Instead of | The page says |
|---|---|
| "high-throughput distributed systems" | "systems that stay fast when thousands of people use them at once" |
| "KYC / straight-through processing" | "customer verification and compliance checks" |
| "OCR with inpainting" | "reads text out of scans, then puts the new text back so the page still looks like the original" |
| "npm packages" | "free building blocks other developers drop into their own apps" |

The engineering personality lives in small accents only, not in the copy:

- Monospace (JetBrains Mono) for tiny labels, dates and the section kickers — never body text
- A `</>` monogram in the header and favicon
- One "code-ish" element: the hero **profile card**, styled as a small window with traffic lights
  and a `// ships on Fridays, sleeps eventually` footer — but its content is plain English rows
- A single blinking cursor on the rotating tagline

## Editing

- **Copy** — the `<main>` sections of each page
- **Colors** — the `:root` CSS variables at the top of `styles.css`
- **Typewriter lines** — the `phrases` array in `index.html`'s `<script>`
- **Profile card rows** — the `<dl class="rows">` in the hero

Adding a nav item means touching **three** places in `index.html`: the `<nav class="menu">`
links, the section's `id`, and the id array passed to the scroll-spy observer near the bottom
of the script — miss the last one and the link works but never highlights.

## Attribution

Forge Pilot is a fork of [VsAgentic](https://github.com/adospace/vs-agentic) by Adolfo
Marinucci (MIT). Its page credits this prominently in a dedicated "Credit where it's due"
section, and links to the upstream extension. **Do not remove or soften that section** — the
MIT licence requires the copyright notice to travel with the work, and presenting a fork as
wholly original work would be misleading regardless of the licence.

## Accessibility / robustness notes

- Scroll-reveal is gated behind `html.js`, so with JavaScript disabled the page renders fully
  instead of sitting at `opacity: 0`. A 3s timeout also force-reveals if `IntersectionObserver`
  never fires (background tab, odd embed).
- No horizontal page scroll at any width (verified at 375px and desktop).
- `prefers-reduced-motion` disables all animation, including the cursor blink.
