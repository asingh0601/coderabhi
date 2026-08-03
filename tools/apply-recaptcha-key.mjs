/*
 * Bakes the reCAPTCHA site key into the built captcha demo.
 *
 * The demo app in angx-libs ships with the literal placeholder
 * YOUR_RECAPTCHA_SITE_KEY, which is correct for that repo -- a site key is
 * per-domain, and angx-libs shouldn't carry coderabhi.in's. So the key is
 * applied here instead, as a post-build step, and angx-libs stays untouched.
 *
 * Run it after copying dist/ngx-easy-captcha/browser/ over demo/ngx-easy-captcha/.
 * The placeholder is always present in a fresh copy, so this is idempotent in
 * the only order that matters.
 *
 *   node tools/apply-recaptcha-key.mjs
 *
 * A reCAPTCHA *site* key is public -- it is served in the HTML of every page
 * that uses it. The *secret* key is the sensitive half and must never appear
 * in this repo.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PLACEHOLDER = 'YOUR_RECAPTCHA_SITE_KEY';
const SITE_KEY = '6Le9VnMtAAAAAAlCqh19tFxqekrMEx1xjFDg077x';
const DEMO_DIR = 'demo/ngx-easy-captcha';

if (!/^6L[\w-]{30,}$/.test(SITE_KEY)) {
  console.error(`Refusing to apply "${SITE_KEY}" -- that is not a reCAPTCHA site key.`);
  process.exit(1);
}

const bundles = readdirSync(DEMO_DIR).filter((f) => f.startsWith('main-') && f.endsWith('.js'));

if (bundles.length === 0) {
  console.error(`No main-*.js found in ${DEMO_DIR}. Copy the build output first.`);
  process.exit(1);
}

let patched = 0;

for (const file of bundles) {
  const path = join(DEMO_DIR, file);
  const before = readFileSync(path, 'utf8');

  if (!before.includes(PLACEHOLDER)) {
    if (before.includes(SITE_KEY)) {
      console.log(`${file}: already carries the key, nothing to do`);
      continue;
    }
    console.error(`${file}: neither the placeholder nor the key is present -- did the demo app change?`);
    process.exit(1);
  }

  const after = before.split(PLACEHOLDER).join(SITE_KEY);
  writeFileSync(path, after);
  patched += 1;
  console.log(`${file}: applied site key`);
}

console.log(patched > 0 ? `Done -- ${patched} bundle(s) patched.` : 'Nothing to patch.');
