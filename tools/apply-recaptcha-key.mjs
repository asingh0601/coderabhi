/*
 * Bakes the reCAPTCHA site key into the built captcha demo.
 *
 * The demo app in angx-libs ships with the literal placeholder
 * YOUR_RECAPTCHA_SITE_KEY, which is correct for that repo -- a site key is
 * per-domain, and angx-libs shouldn't carry coderabhi.in's. So the key is
 * applied here instead, as a post-build step, and angx-libs stays untouched.
 *
 * Run it after copying dist/ngx-easy-captcha/browser/ over demo/ngx-easy-captcha/:
 *
 *   node tools/apply-recaptcha-key.mjs
 *
 * WHY IT RENAMES THE BUNDLE
 * Angular names bundles by a hash of their contents. Editing a bundle in place
 * leaves the old name on new content, so every browser and CDN that already
 * holds main-<oldhash>.js keeps serving the unpatched copy -- which fails with
 * "Invalid site key or not loaded in api.js: YOUR_RECAPTCHA_SITE_KEY". So the
 * patched file is renamed to a hash of its new contents and every referencing
 * index.html is rewritten, which is what makes the change actually reach users.
 *
 * A reCAPTCHA *site* key is public -- it is served in the HTML of every page
 * that uses it. The *secret* key is the sensitive half and must never be here.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PLACEHOLDER = 'YOUR_RECAPTCHA_SITE_KEY';
const SITE_KEY = '6Le9VnMtAAAAAAlCqh19tFxqekrMEx1xjFDg077x';
const DEMO_DIR = 'demo/ngx-easy-captcha';

if (!/^6L[\w-]{30,}$/.test(SITE_KEY)) {
  console.error(`Refusing to apply "${SITE_KEY}" -- that is not a reCAPTCHA site key.`);
  process.exit(1);
}

/** Every index.html under the demo, including the per-route copies. */
function htmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...htmlFiles(path));
    else if (entry.endsWith('.html')) out.push(path);
  }
  return out;
}

const bundles = readdirSync(DEMO_DIR).filter((f) => /^main-.*\.js$/.test(f));

if (bundles.length === 0) {
  console.error(`No main-*.js in ${DEMO_DIR}. Copy the build output first.`);
  process.exit(1);
}

for (const oldName of bundles) {
  const oldPath = join(DEMO_DIR, oldName);
  const source = readFileSync(oldPath, 'utf8');

  if (!source.includes(PLACEHOLDER)) {
    if (source.includes(SITE_KEY)) {
      console.log(`${oldName}: already patched, nothing to do`);
      continue;
    }
    console.error(`${oldName}: no placeholder and no key -- did the demo app change?`);
    process.exit(1);
  }

  const patched = source.split(PLACEHOLDER).join(SITE_KEY);

  // Rename to a hash of the patched contents so the URL changes with the file.
  const hash = createHash('sha256').update(patched).digest('base64url').slice(0, 8).toUpperCase();
  const newName = `main-${hash}.js`;

  writeFileSync(oldPath, patched);
  renameSync(oldPath, join(DEMO_DIR, newName));

  let rewritten = 0;
  for (const html of htmlFiles(DEMO_DIR)) {
    const before = readFileSync(html, 'utf8');
    if (!before.includes(oldName)) continue;
    writeFileSync(html, before.split(oldName).join(newName));
    rewritten += 1;
  }

  console.log(`${oldName} -> ${newName}  (key applied, ${rewritten} html file(s) updated)`);

  if (rewritten === 0) {
    console.error(`Nothing referenced ${oldName} -- the demo would now load nothing.`);
    process.exit(1);
  }
}
