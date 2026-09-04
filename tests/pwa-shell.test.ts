import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const manifest = () => JSON.parse(readFileSync('apps/cloudflare/public/manifest.webmanifest', 'utf8')) as Record<string, any>;
const sw = () => readFileSync('apps/cloudflare/public/sw.js', 'utf8');
const html = () => readFileSync('apps/cloudflare/index.html', 'utf8');
const main = () => readFileSync('apps/cloudflare/src/main.tsx', 'utf8');

test('PWA manifest keeps SEE Arabic RTL identity and installability metadata', () => {
  const data = manifest();
  assert.equal(data.name, 'SEE — Audit Operating System');
  assert.equal(data.dir, 'rtl');
  assert.equal(data.lang, 'ar');
  assert.equal(data.display, 'standalone');
  assert.ok(Array.isArray(data.icons) && data.icons.length >= 2);
  assert.match(html(), /manifest\.webmanifest/);
});

test('service worker never caches API or authenticated requests', () => {
  const source = sw();
  assert.match(source, /\/api\//);
  assert.match(source, /authorization/i);
  assert.match(source, /fetch\(request\)/);
  assert.doesNotMatch(source, /cache\.put\([^\n]*\/api\//i);
});

test('service worker is registered by the production client shell', () => {
  assert.match(main(), /serviceWorker/);
  assert.match(main(), /register\(['"]\/sw\.js['"]\)/);
});
