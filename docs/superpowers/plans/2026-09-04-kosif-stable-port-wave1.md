# KOSIF Stable Port — Wave 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make SEE adopt KOSIF Stable's visual identity, 13-module desktop information architecture, five-group mobile navigation, command-center interaction pattern, and safe PWA shell without changing SEE's Cloudflare/D1/R2 source of truth.

**Architecture:** Keep the existing React application and Phase A API contracts. Rework the shell/navigation and styling in focused React/CSS modules, reuse the server-backed command-center model, and add only static-app-shell PWA caching. No engagement payload, API response, or evidence object is persisted in browser storage as authoritative state.

**Tech Stack:** React 19, TypeScript, Vite, Cloudflare Worker, D1, R2, CSS custom properties, Web App Manifest, Service Worker, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-04-kosif-stable-port-design.md`

## Global Constraints

- Product identity remains `SEE — Audit Operating System`.
- KOSIF Stable is a visual/capability reference, not a second product name in the UI.
- Arabic-first RTL and keyboard-visible focus states are mandatory.
- Desktop exposes 13 professional modules; mobile exposes five grouped destinations.
- All displayed production metrics come from SEE server truth, never hard-coded demo values.
- `localStorage` may store presentation preferences such as theme only; it must not become engagement persistence.
- Service Worker caches static app-shell assets only by default; do not cache `/api/*` or evidence files.
- AI/Council cannot approve reports, clear review notes, close high risks, or archive engagements.

---

### Task 1: Lock the KOSIF-derived navigation contract

**Files:**
- Modify: `apps/cloudflare/src/navigation.ts`
- Test: `tests/kosif-navigation.test.ts`

**Interfaces:**
- Produces: `DESKTOP_MODULES`, `MOBILE_GROUPS`, `moduleById(id)`, and module/group ID types consumed by `AppShell.tsx` and `App.tsx`.

- [ ] **Step 1: Write/confirm the failing contract test**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { DESKTOP_MODULES, MOBILE_GROUPS } from '../apps/cloudflare/src/navigation.ts';

test('desktop exposes all KOSIF-derived professional modules', () => {
  assert.deepEqual(DESKTOP_MODULES.map((item) => item.id), [
    'command-center','data','planning','risks','journal','workpapers','pbc',
    'evidence','standards','rounds','council','reports','knowledge',
  ]);
});

test('mobile keeps five grouped destinations with complete module reachability', () => {
  assert.deepEqual(MOBILE_GROUPS.map((item) => item.id), ['home','audit','analytics','council','more']);
  assert.ok(DESKTOP_MODULES.every((module) => MOBILE_GROUPS.some((group) => group.modules.includes(module.id))));
});
```

- [ ] **Step 2: Run the focused test**

Run: `node --experimental-strip-types --test tests/kosif-navigation.test.ts`
Expected: FAIL until all 13 modules and five complete mobile groups are exported.

- [ ] **Step 3: Implement the navigation model**

Use a typed structure equivalent to:

```ts
export const DESKTOP_MODULES = [
  { id: 'command-center', label: 'مركز القيادة', group: 'home' },
  { id: 'data', label: 'البيانات والميزان', group: 'audit' },
  { id: 'planning', label: 'التخطيط والأهمية', group: 'audit' },
  { id: 'risks', label: 'المخاطر والنتائج', group: 'audit' },
  { id: 'journal', label: 'فحص قيود اليومية', group: 'analytics' },
  { id: 'workpapers', label: 'أوراق العمل', group: 'audit' },
  { id: 'pbc', label: 'طلبات المستندات', group: 'audit' },
  { id: 'evidence', label: 'سجل الأدلة', group: 'more' },
  { id: 'standards', label: 'المعايير والمصادر', group: 'more' },
  { id: 'rounds', label: 'الجولات العشر', group: 'audit' },
  { id: 'council', label: 'مجلس المراجعين', group: 'council' },
  { id: 'reports', label: 'التقارير والتصدير', group: 'more' },
  { id: 'knowledge', label: 'مسارات المعرفة', group: 'more' },
] as const;
```

- [ ] **Step 4: Re-run test and full typecheck**

Run: `npm test && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/cloudflare/src/navigation.ts tests/kosif-navigation.test.ts
git commit -m "feat: adopt KOSIF professional navigation"
```

---

### Task 2: Port the KOSIF visual token family into SEE

**Files:**
- Modify: `apps/cloudflare/src/kosif-theme.css`
- Modify: `apps/cloudflare/src/styles.css`
- Modify: `apps/cloudflare/src/main.tsx`

**Interfaces:**
- Produces semantic tokens used by all React components: `--bg`, `--surface`, `--surface-2`, `--text`, `--muted`, `--line`, `--primary`, `--primary-strong`, `--primary-soft`, `--accent`, `--success`, `--warning`, `--danger`, `--info`, radii, shadows, sidebar/topbar dimensions.

- [ ] **Step 1: Add a static-source assertion test**

Create `tests/kosif-theme.test.ts` with:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync('apps/cloudflare/src/kosif-theme.css', 'utf8');

test('KOSIF theme exposes light and dark semantic tokens', () => {
  for (const token of ['--bg:', '--surface:', '--primary:', '--accent:', '--danger:', '--success:']) {
    assert.ok(css.includes(token), token);
  }
  assert.ok(css.includes('[data-theme="dark"]'));
});
```

- [ ] **Step 2: Run it and verify RED if tokens are incomplete**

Run: `node --experimental-strip-types --test tests/kosif-theme.test.ts`

- [ ] **Step 3: Implement semantic token sheets**

Base light theme on KOSIF Stable values near `#f5f3f8`, `#5b21b6`, `#4c1d95`, and teal/emerald accents; implement a deep-plum dark theme. Keep component CSS consuming variables instead of duplicating hex values.

- [ ] **Step 4: Ensure import order**

`main.tsx` must import the token sheet before component styles:

```ts
import './kosif-theme.css';
import './styles.css';
```

- [ ] **Step 5: Verify**

Run: `npm test && npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/cloudflare/src/kosif-theme.css apps/cloudflare/src/styles.css apps/cloudflare/src/main.tsx tests/kosif-theme.test.ts
git commit -m "feat: port KOSIF visual system to SEE"
```

---

### Task 3: Rebuild the shell around the 13 desktop modules and five mobile groups

**Files:**
- Modify: `apps/cloudflare/src/components/AppShell.tsx`
- Modify: `apps/cloudflare/src/App.tsx`
- Modify: `apps/cloudflare/src/types.ts`
- Modify: `apps/cloudflare/src/styles.css`

**Interfaces:**
- Consumes: `DESKTOP_MODULES`, `MOBILE_GROUPS` from Task 1.
- Produces: shell props for `activeModule`, `onNavigateModule`, current engagement selector, blockers, command search, theme toggle, and mobile group sheet.

- [ ] **Step 1: Add navigation behavior tests**

Extend `tests/kosif-navigation.test.ts` to assert every desktop module maps to exactly one mobile group and that `command-center` maps to `home`.

- [ ] **Step 2: Run RED/GREEN cycle for any missing mapping**

Run: `node --experimental-strip-types --test tests/kosif-navigation.test.ts`

- [ ] **Step 3: Implement desktop shell**

`AppShell.tsx` must render:

```tsx
<aside className="sidebar">...</aside>
<div className="workspace">
  <header className="topbar">...</header>
  <main id="main-content">{children}</main>
</div>
```

The sidebar renders all 13 modules with active state and badges. The topbar contains engagement context, command search, theme toggle, blocker notifications, and the existing Demo action.

- [ ] **Step 4: Implement mobile shell**

Render five persistent bottom-navigation destinations. Tapping a group with multiple child modules opens a sheet/drawer; direct groups navigate immediately. Minimum target size is 44px.

- [ ] **Step 5: Preserve command palette and theme preference**

Theme preference may remain in `localStorage`; no engagement data may be written there.

- [ ] **Step 6: Verify**

Run: `npm test && npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/cloudflare/src/components/AppShell.tsx apps/cloudflare/src/App.tsx apps/cloudflare/src/types.ts apps/cloudflare/src/styles.css tests/kosif-navigation.test.ts
git commit -m "feat: reshape SEE shell around KOSIF navigation"
```

---

### Task 4: Make the command center visually and behaviorally match KOSIF Stable

**Files:**
- Modify: `apps/cloudflare/src/components/CommandCenter.tsx`
- Modify: `apps/cloudflare/src/styles.css`
- Test: `tests/readiness.test.ts`

**Interfaces:**
- Consumes: existing `CommandCenter` server model and readiness blockers.
- Produces: hero with readiness ring, current stage, next governed action, server-backed metrics, trace/evidence indicators, and blocker cards.

- [ ] **Step 1: Strengthen readiness tests**

Keep the existing domain readiness tests and add an assertion that readiness never implies report/archive authority when human gates are incomplete.

- [ ] **Step 2: Implement the KOSIF-style hero**

The component must display only values from the passed command-center object:

```tsx
<section className="command-hero">
  <div className="hero-copy">...</div>
  <div className="readiness-ring" style={{'--progress': `${score * 3.6}deg`} as React.CSSProperties}>...</div>
</section>
```

Do not hard-code production account counts, evidence percentages, or journal counts.

- [ ] **Step 3: Add blocker/next-action cards**

Each blocker must show code plus human-readable message; the primary action navigates to the relevant module rather than mutating professional state automatically.

- [ ] **Step 4: Verify**

Run: `npm test && npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/cloudflare/src/components/CommandCenter.tsx apps/cloudflare/src/styles.css tests/readiness.test.ts
git commit -m "feat: port KOSIF command center experience"
```

---

### Task 5: Add a safe SEE PWA shell

**Files:**
- Create: `apps/cloudflare/public/manifest.webmanifest`
- Create: `apps/cloudflare/public/sw.js`
- Create: `apps/cloudflare/public/icon.svg`
- Create: `apps/cloudflare/public/icon-maskable.svg`
- Modify: `apps/cloudflare/index.html`
- Modify: `apps/cloudflare/src/main.tsx`
- Test: `tests/pwa-contract.test.ts`

**Interfaces:**
- Produces installable Arabic RTL app metadata and a static-only cache service worker.

- [ ] **Step 1: Write the failing PWA contract test**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('apps/cloudflare/public/manifest.webmanifest', 'utf8'));
const sw = readFileSync('apps/cloudflare/public/sw.js', 'utf8');

test('SEE PWA is RTL standalone and never caches API responses', () => {
  assert.equal(manifest.name, 'SEE — Audit Operating System');
  assert.equal(manifest.lang, 'ar');
  assert.equal(manifest.dir, 'rtl');
  assert.equal(manifest.display, 'standalone');
  assert.ok(sw.includes("pathname.startsWith('/api/')"));
  assert.ok(sw.includes('return fetch(request)'));
});
```

- [ ] **Step 2: Verify RED**

Run: `node --experimental-strip-types --test tests/pwa-contract.test.ts`
Expected: FAIL until manifest/service worker exist.

- [ ] **Step 3: Implement manifest and icons**

Use SEE product naming and KOSIF-derived purple theme. Add shortcuts to command center, trial balance, journal review, and evidence register.

- [ ] **Step 4: Implement static-only service worker**

For `/api/*`, evidence/object downloads, non-GET requests, or cross-origin requests, always pass through to network. Cache only same-origin static app-shell assets and version the cache name.

- [ ] **Step 5: Register the service worker**

In `main.tsx`, register after page load only when `'serviceWorker' in navigator`.

- [ ] **Step 6: Verify**

Run: `npm test && npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/cloudflare/public apps/cloudflare/index.html apps/cloudflare/src/main.tsx tests/pwa-contract.test.ts
git commit -m "feat: add safe SEE PWA shell"
```

---

### Task 6: Wave 1 release verification

**Files:**
- Modify only if verification finds a concrete defect.

**Interfaces:**
- Produces: a release-ready Wave 1 commit suitable for PR review; no merge to `main` until all checks are green.

- [ ] **Step 1: Run all deterministic tests**

Run: `npm test`
Expected: 0 failures.

- [ ] **Step 2: Validate local D1 migrations**

Run: `npm --workspace @see/cloudflare run db:check`
Expected: all migrations apply successfully.

- [ ] **Step 3: Run TypeScript checks**

Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 4: Build production assets**

Run: `npm run build`
Expected: Vite build succeeds.

- [ ] **Step 5: Inspect the branch diff against `main`**

Confirm no accidental secrets, no replacement of D1/R2 persistence with browser state, no service-worker API caching, and no hard-coded production metrics.

- [ ] **Step 6: Open/update a draft PR**

PR summary must explicitly state that this wave ports visual/navigation/PWA behavior only and that subsequent waves will port deterministic engines and governed journal/standards/rounds capabilities.

---

## Subsequent plans

Wave 1 intentionally stops at a deployable visual/interaction foundation. The approved spec is then implemented by three additional plans:

1. **Wave 2 — Deterministic engines and data intake:** money/text normalization, TB import, classification, materiality, sampling.
2. **Wave 3 — Journal review, ten rounds, standards usage, trace health:** additive D1 migrations, `/api/v1` resources, governed human decisions.
3. **Wave 4 — Reporting/Council/export hardening and release:** reporting workspace, controlled exports, archive snapshot, Council evidence snapshots, production rollout.
