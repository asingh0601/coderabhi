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
