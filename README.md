# coderabhi.in

Personal site — single static page, no build step, no dependencies.

## Files

| File | Purpose |
|---|---|
| `index.html` | The entire site (inline CSS + JS) |
| `robots.txt` | Crawler rules |
| `sitemap.xml` | Sitemap for `coderabhi.in` |

## Local preview

Any static server works:

```bash
npx serve .
```

Or just open `index.html` in a browser.

## Deploy

Drop the folder on any static host — Cloudflare Pages, Netlify, Vercel, GitHub Pages, or IIS.

**Cloudflare Pages / Netlify:** build command empty, output directory `.`

**GitHub Pages:** push to a repo, enable Pages on the branch root.

Then point the `coderabhi.in` DNS record at the host.

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

Everything lives in `index.html`:

- **Copy** — the `<main>` sections (`hero`, `about`, `skills`, `experience`, `projects`, `contact`)
- **Colors** — the `:root` CSS variables at the top of `<style>`
- **Typewriter lines** — the `phrases` array in the `<script>` block
- **Profile card rows** — the `<dl class="rows">` in the hero

## Accessibility / robustness notes

- Scroll-reveal is gated behind `html.js`, so with JavaScript disabled the page renders fully
  instead of sitting at `opacity: 0`. A 3s timeout also force-reveals if `IntersectionObserver`
  never fires (background tab, odd embed).
- No horizontal page scroll at any width (verified at 375px and desktop).
- `prefers-reduced-motion` disables all animation, including the cursor blink.
