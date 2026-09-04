# SEE KOSIF Stable Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port KOSIF Stable's visual system and deterministic audit capabilities into SEE while keeping React, Cloudflare Worker, D1, R2, `/api/v1`, and human authority gates as the source of truth.

**Architecture:** Keep the current `feat/see-phase-a-unification` branch as the integration base. Extend Phase A additively: domain logic lives in focused TypeScript modules under `packages/audit-engine/src`, governed persistence lives in D1 migrations/API handlers under `apps/cloudflare/worker`, evidence blobs remain in R2, and React surfaces KOSIF-style navigation/components without browser-local engagement state. Existing `/api` compatibility routes remain until the corresponding screen has moved to `/api/v1`.

**Tech Stack:** React 19, TypeScript 5.8, Vite 7, Cloudflare Workers/Wrangler 4, D1, R2, Node 22 test runner.

**Spec:** `docs/superpowers/specs/2026-09-04-kosif-stable-port-design.md`

## Global Constraints

- Product name remains **SEE — Audit Operating System**.
- KOSIF Stable is the visual/capability reference only; do not introduce a second product identity.
- D1/R2 remain authoritative for engagement data; `localStorage` is never authoritative engagement persistence.
- Money and persisted financial calculations use integer/minor units (`bigint`/integer-safe text), never floating-point arithmetic.
- AI/Council cannot approve reports, close high risks, clear review notes, archive engagements, or post accounting entries.
- Existing migrations remain valid; all new D1 changes are additive.
- Existing `/api` compatibility endpoints remain available while screens transition to `/api/v1`.
- Service worker caches only static app-shell assets; no authenticated API responses, evidence files, or confidential engagement payloads.
- Every persisted deterministic run records an engine/method version.
- Every governed mutation creates an append-only audit event.
- Every task must leave `npm test`, `npm run typecheck`, `npm run build`, and local D1 migration validation green before the next task.

---

### Task 1: Restore Phase A green baseline and review-note human gate

**Files:**
- Modify: `packages/domain/src/lifecycle.ts`
- Modify: `apps/cloudflare/worker/phase-a/fieldwork.ts`
- Modify: `apps/cloudflare/src/components/AuditWorkspace.tsx`
- Test: `tests/lifecycle.test.ts`

**Interfaces:**
- Consumes: `AuditActorRole`, existing `review_notes` table and `/api/v1/review-notes/:id/clear` route.
- Produces: `validateReviewNoteClear(input: { actorRole: AuditActorRole; actor: string }): TransitionDecision` and a UI list/action that can clear open notes with a named human reviewer.

- [ ] **Step 1: Keep the existing failing lifecycle test as the RED contract**

The current test already imports and exercises:

```ts
validateReviewNoteClear({ actorRole: 'ai_agent', actor: 'see-council' })
validateReviewNoteClear({ actorRole: 'manager', actor: '   ' })
validateReviewNoteClear({ actorRole: 'manager', actor: 'pilot-manager' })
```

- [ ] **Step 2: Run the lifecycle test and confirm the expected RED state**

Run: `npm test`
Expected: FAIL because `packages/domain/src/lifecycle.ts` does not export `validateReviewNoteClear`.

- [ ] **Step 3: Implement the minimal domain gate**

Add to `packages/domain/src/lifecycle.ts`:

```ts
export interface ReviewNoteClearInput {
  actorRole: AuditActorRole;
  actor: string;
}

export function validateReviewNoteClear(input: ReviewNoteClearInput): TransitionDecision {
  if (input.actorRole === 'ai_agent' || input.actorRole === 'client') {
    return deny('REVIEW_NOTE_HUMAN_REQUIRED');
  }
  if (!input.actor.trim()) {
    return deny('REVIEW_NOTE_ACTOR_REQUIRED');
  }
  return allow();
}
```

- [ ] **Step 4: Make the API route call the domain gate**

Replace the inline check in `fieldwork.ts` with:

```ts
const decision = validateReviewNoteClear({
  actorRole: input.actorRole ?? 'senior',
  actor: input.actor ?? '',
});
if (!decision.allowed) {
  return problem('REVIEW_NOTE_CLEAR_BLOCKED', 'Review note clearance is blocked', 409, decision);
}
```

Import `validateReviewNoteClear` from the domain module.

- [ ] **Step 5: Surface open review notes in the review/workpaper UI**

Load `review_notes` for the engagement through the existing Phase A API surface, render note text/workpaper/status, and call `phaseAApi.clearReviewNote(note.id, { actor: 'pilot-manager', actorRole: 'manager' })`. Do not auto-clear a note when a workpaper changes state.

- [ ] **Step 6: Verify green baseline**

Run:

```bash
npm test
npm --workspace @see/cloudflare run db:check
npm run typecheck
npm run build
```

Expected: all PASS.

---

### Task 2: KOSIF navigation model, SEE design tokens, and KOSIF-style shell

**Files:**
- Modify: `apps/cloudflare/src/navigation.ts`
- Modify: `apps/cloudflare/src/types.ts`
- Modify: `apps/cloudflare/src/components/AppShell.tsx`
- Modify: `apps/cloudflare/src/components/Status.tsx`
- Modify: `apps/cloudflare/src/styles.css`
- Modify: `apps/cloudflare/index.html`
- Test: `tests/kosif-navigation.test.ts`

**Interfaces:**
- Produces: `DesktopModuleId`, `DESKTOP_MODULES`, `MOBILE_GROUPS`, `desktopModuleForWorkspace()`, `workspaceForDesktopModule()`.
- Preserves: `PrimaryWorkspace = 'home' | 'audit' | 'analytics' | 'council' | 'more'` for mobile and existing top-level orchestration.

- [ ] **Step 1: Write navigation contract test**

Create `tests/kosif-navigation.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { DESKTOP_MODULES, MOBILE_GROUPS } from '../apps/cloudflare/src/navigation.ts';

test('desktop exposes all KOSIF-derived professional modules', () => {
  assert.equal(DESKTOP_MODULES.length, 13);
  assert.deepEqual(DESKTOP_MODULES.map((item) => item.id), [
    'command-center','data','planning','risks','journal','workpapers','pbc',
    'evidence','standards','rounds','council','reports','knowledge',
  ]);
});

test('mobile keeps five grouped destinations', () => {
  assert.deepEqual(MOBILE_GROUPS.map((item) => item.id), ['home','audit','analytics','council','more']);
  assert.ok(DESKTOP_MODULES.every((module) => MOBILE_GROUPS.some((group) => group.modules.includes(module.id))));
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test`
Expected: FAIL because `DESKTOP_MODULES` and `MOBILE_GROUPS` are not exported yet.

- [ ] **Step 3: Add the 13-module navigation model**

In `navigation.ts`, add:

```ts
export type DesktopModuleId =
  | 'command-center' | 'data' | 'planning' | 'risks' | 'journal'
  | 'workpapers' | 'pbc' | 'evidence' | 'standards' | 'rounds'
  | 'council' | 'reports' | 'knowledge';

export const DESKTOP_MODULES = [
  { id:'command-center', label:'مركز القيادة', group:'home' },
  { id:'data', label:'البيانات والميزان', group:'audit' },
  { id:'planning', label:'التخطيط والأهمية', group:'audit' },
  { id:'risks', label:'المخاطر والنتائج', group:'audit' },
  { id:'journal', label:'فحص قيود اليومية', group:'analytics' },
  { id:'workpapers', label:'أوراق العمل', group:'audit' },
  { id:'pbc', label:'طلبات المستندات PBC', group:'audit' },
  { id:'evidence', label:'سجل الأدلة', group:'more' },
  { id:'standards', label:'المعايير والمصادر', group:'more' },
  { id:'rounds', label:'الجولات العشر', group:'audit' },
  { id:'council', label:'مجلس المراجعين', group:'council' },
  { id:'reports', label:'التقارير والتصدير', group:'more' },
  { id:'knowledge', label:'مسارات المعرفة', group:'more' },
] as const;
```

Add `MOBILE_GROUPS` as the existing five destinations with `modules` arrays covering all 13 IDs.

- [ ] **Step 4: Rebuild `AppShell` around the KOSIF layout**

Keep SEE branding, but change the desktop rail to render `DESKTOP_MODULES`. Keep the mobile bottom nav at five groups. Preserve engagement picker, command palette, theme button, gate notification popover, keyboard `Ctrl/Cmd+K`, and RTL.

- [ ] **Step 5: Replace current green/cinema tokens with KOSIF purple/emerald semantic tokens**

Use semantic variables centered on:

```css
:root {
  --bg:#f5f3f8;
  --surface:#ffffff;
  --surface-2:#faf9fc;
  --surface-3:#f0ecf6;
  --text:#231b2d;
  --muted:#6f6578;
  --line:#e5dfeb;
  --primary:#5b21b6;
  --primary-strong:#43178c;
  --primary-soft:#eee7fb;
  --accent:#0f766e;
  --success:#18794e;
  --warning:#a15c00;
  --danger:#b42318;
}
:root[data-theme='dark'] {
  --bg:#15111a;
  --surface:#201923;
  --surface-2:#271f2b;
  --surface-3:#302638;
  --text:#f4edf7;
  --muted:#b9abbf;
  --line:#3c3142;
  --primary:#a879f5;
  --accent:#59c7b9;
}
```

Use the variables throughout; do not copy KOSIF's entire CSS verbatim.

- [ ] **Step 6: Update page metadata and accessibility**

Set `theme-color` to `#4c1d95`, add a skip link target to the React shell, preserve `lang="ar" dir="rtl"`, and ensure desktop/mobile buttons retain >=44px touch targets.

- [ ] **Step 7: Verify**

Run all tests, typecheck, and build.

---

### Task 3: Port deterministic money/text/classification/sampling core

**Files:**
- Create: `packages/audit-engine/src/money.ts`
- Create: `packages/audit-engine/src/text-normalization.ts`
- Create: `packages/audit-engine/src/classification.ts`
- Create: `packages/audit-engine/src/sampling.ts`
- Test: `tests/kosif-money.test.ts`
- Test: `tests/kosif-classification.test.ts`
- Test: `tests/kosif-sampling.test.ts`

**Interfaces:**
- Produces: `parseMoneyMinor(value, decimals?) => bigint`, `normalizeAuditText(value) => string`, `classifyAccount(input) => AccountClassification`, `selectSample(input) => SamplingResult`.
- Persisted sampling metadata later uses `SAMPLING_ENGINE_VERSION = 'SEE-KOSIF-SAMPLING-v1'`.

- [ ] **Step 1: Write money parsing tests**

```ts
assert.equal(parseMoneyMinor('١٬٢٣٤٫٥٠'), 123450n);
assert.equal(parseMoneyMinor('(1,250.25)'), -125025n);
assert.equal(parseMoneyMinor('1,250'), 125000n);
```

- [ ] **Step 2: Write classification determinism tests**

```ts
const result = classifyAccount({ code:'1101', name:'البنك الرئيسي', debitMinor:10000n, creditMinor:0n });
assert.equal(result.category, 'cash_and_banks');
assert.ok(result.standards.includes('IAS 7'));
assert.ok(result.assertions.includes('الوجود'));
assert.equal(result.authority, 'indicator');
```

- [ ] **Step 3: Write sampling reproducibility tests**

```ts
const a = selectSample({ populationIds:['1','2','3','4','5'], method:'random', size:3, seed:380019 });
const b = selectSample({ populationIds:['1','2','3','4','5'], method:'random', size:3, seed:380019 });
assert.deepEqual(a.selectedIds, b.selectedIds);
assert.equal(a.engineVersion, 'SEE-KOSIF-SAMPLING-v1');
```

- [ ] **Step 4: Verify RED**

Run: `npm test`
Expected: missing modules/functions.

- [ ] **Step 5: Implement focused modules**

Port only deterministic behavior from KOSIF. Normalize Arabic/Persian digits, parse minor units without float arithmetic, classify a conservative initial set of account categories, and implement seeded random/systematic/MUS selection with immutable result metadata.

The sampling result must have this shape:

```ts
export type SamplingResult = {
  method: 'random' | 'systematic' | 'mus';
  seed: number;
  populationSize: number;
  requestedSize: number;
  selectedIds: string[];
  engineVersion: 'SEE-KOSIF-SAMPLING-v1';
};
```

- [ ] **Step 6: Verify green**

Run tests/typecheck/build.

---

### Task 4: Add additive D1 schema for KOSIF-derived governed state

**Files:**
- Create: `apps/cloudflare/migrations/0003_kosif_port.sql`
- Modify: `.github/workflows/ci.yml` only if migration validation does not already run `db:check`.

**Interfaces:**
- Produces tables: `journal_entries`, `journal_review_runs`, `journal_review_items`, `journal_review_decisions`, `sampling_runs`, `risk_responses`, `round_decisions`, `standard_usages`.

- [ ] **Step 1: Create migration with foreign keys and indexes**

Use additive `CREATE TABLE IF NOT EXISTS`. Important columns:

```sql
CREATE TABLE IF NOT EXISTS journal_review_runs (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  engine_version TEXT NOT NULL,
  source_version TEXT,
  parameters_json TEXT NOT NULL DEFAULT '{}',
  total_entries INTEGER NOT NULL DEFAULT 0,
  flagged_entries INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sampling_runs (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  population_source TEXT NOT NULL,
  method TEXT NOT NULL,
  seed INTEGER NOT NULL,
  parameters_json TEXT NOT NULL,
  selected_ids_json TEXT NOT NULL,
  engine_version TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

Create the other six tables with engagement FKs, rationale/actor/status where governed, and indexes on `(engagement_id, status)` or `(engagement_id, created_at)`.

- [ ] **Step 2: Validate migration locally**

Run: `npm --workspace @see/cloudflare run db:check`
Expected: `0001_init.sql`, `0002_phase_a.sql`, and `0003_kosif_port.sql` all apply successfully.

- [ ] **Step 3: Run full verification**

Run tests/typecheck/build.

---

### Task 5: Journal signals, ten rounds, standards library, and API contracts

**Files:**
- Create: `packages/audit-engine/src/journal-signals.ts`
- Create: `packages/audit-engine/src/rounds.ts`
- Create: `packages/audit-engine/src/standards.ts`
- Create: `apps/cloudflare/worker/phase-a/journal.ts`
- Create: `apps/cloudflare/worker/phase-a/rounds.ts`
- Create: `apps/cloudflare/worker/phase-a/standards.ts`
- Modify: `apps/cloudflare/worker/phase-a/router.ts`
- Modify: `apps/cloudflare/worker/phase-a/dashboard.ts`
- Modify: `apps/cloudflare/worker/phase-a/types.ts`
- Test: `tests/journal-signals.test.ts`
- Test: `tests/rounds.test.ts`
- Test: `tests/standards.test.ts`

**Interfaces:**
- `analyzeJournalEntry(entry, context) => { signals: JournalSignal[]; authority:'indicator'; engineVersion:'SEE-JOURNAL-v1' }`.
- `AUDIT_ROUNDS` contains A01..A10 in the KOSIF order.
- `STANDARDS_LIBRARY` contains provenance-labeled reference records; no card is marked authoritative without source/version metadata.

- [ ] **Step 1: Add RED tests for journal signals**

Test manual entry, rounded amount, period-end timing, weekend indicator, and deterministic repeated output. Assert that the result explicitly says `authority: 'indicator'`.

- [ ] **Step 2: Add RED tests for A01..A10 order**

```ts
assert.deepEqual(AUDIT_ROUNDS.map((r) => r.code), ['A01','A02','A03','A04','A05','A06','A07','A08','A09','A10']);
```

- [ ] **Step 3: Add RED tests for standards provenance**

Require each record to expose `code`, `titleAr`, `sourceFamily`, `status`, and at least one of `version`, `effectiveDate`, or `sourceNote`.

- [ ] **Step 4: Implement domain modules**

Keep journal signals conservative and data-dependent. Do not synthesize weekend/low-frequency-user flags when the required metadata is absent.

- [ ] **Step 5: Add `/api/v1` routes**

Implement:

```text
GET/POST /api/v1/engagements/:id/journal-review
POST     /api/v1/journal-review-items/:id/decisions
GET/POST /api/v1/engagements/:id/sampling-runs
GET/POST /api/v1/engagements/:id/rounds
GET      /api/v1/standards
GET/POST /api/v1/engagements/:id/standards-usage
```

All POST mutations require actor metadata and call `auditEventStatement`.

- [ ] **Step 6: Extend command-center metrics**

Add server-derived `journalFlagged`, `journalPendingReview`, `traceHealth`, and `roundsReady` fields without hard-coded demo metrics.

- [ ] **Step 7: Verify**

Run migrations, tests, typecheck, build.

---

### Task 6: Build the 13 KOSIF-style React module surfaces

**Files:**
- Modify: `apps/cloudflare/src/App.tsx`
- Modify: `apps/cloudflare/src/api.ts`
- Modify: `apps/cloudflare/src/types.ts`
- Modify: `apps/cloudflare/src/components/CommandCenter.tsx`
- Modify: `apps/cloudflare/src/components/AuditWorkspace.tsx`
- Modify: `apps/cloudflare/src/components/AnalyticsCenter.tsx`
- Modify: `apps/cloudflare/src/components/CouncilWorkspace.tsx`
- Modify: `apps/cloudflare/src/components/EvidenceTrace.tsx`
- Modify: `apps/cloudflare/src/components/MoreWorkspace.tsx`
- Create: `apps/cloudflare/src/components/JournalReview.tsx`
- Create: `apps/cloudflare/src/components/AuditRounds.tsx`
- Create: `apps/cloudflare/src/components/StandardsWorkspace.tsx`
- Create: `apps/cloudflare/src/components/KnowledgeWorkspace.tsx`
- Create: `apps/cloudflare/src/components/ReportsWorkspace.tsx`

**Interfaces:**
- Desktop module selection maps to the correct existing/new component.
- Mobile group navigation still maps to the five top-level workspaces and exposes its submodules through tabs/cards.

- [ ] **Step 1: Add typed client API methods**

Extend `phaseAApi` with `journalReview`, `reviewJournalItem`, `samplingRuns`, `createSamplingRun`, `rounds`, `updateRound`, `standards`, `standardsUsage`, and `createStandardsUsage`.

- [ ] **Step 2: Make command center match KOSIF interaction hierarchy**

Render a purple/emerald hero with current stage, next governed action, readiness ring, blockers, TB status, evidence/trace status, journal pending status, and human-authority status.

- [ ] **Step 3: Add Journal Review**

Render filterable flagged items with code/rationale and human disposition buttons. Require rationale for reviewed/cleared dispositions. Never show a signal as a conclusion.

- [ ] **Step 4: Add Ten Rounds**

Render A01..A10 with status, gate text, blocker count, and a human action to record round status/rationale. Do not mutate engagement lifecycle from a round card.

- [ ] **Step 5: Add Standards/Knowledge**

Show provenance/status badges (`current`, `historical`, `training`, `local`) and a visible notice that cards do not replace authoritative texts. Engagement usage is a separate action that writes `standard_usages`.

- [ ] **Step 6: Strengthen Reports and Evidence Trace**

Reports use versioned server data and print styles. Evidence Trace adds account/risk/procedure/run/evidence/workpaper/finding/report relationships when present and shows missing links as gaps.

- [ ] **Step 7: Verify mobile reachability**

At <=900px, all 13 modules must remain reachable from the five bottom-nav groups with no horizontal overflow in primary navigation.

- [ ] **Step 8: Verify**

Run tests/typecheck/build.

---

### Task 7: PWA shell caching and installability without confidential offline data

**Files:**
- Create: `apps/cloudflare/public/manifest.webmanifest`
- Create: `apps/cloudflare/public/sw.js`
- Create: `apps/cloudflare/public/icon.svg`
- Create: `apps/cloudflare/public/icon-maskable.svg`
- Modify: `apps/cloudflare/index.html`
- Modify: `apps/cloudflare/src/main.tsx`
- Test: `tests/pwa-policy.test.ts`

**Interfaces:**
- Manifest identifies SEE, Arabic, RTL, standalone mode, purple theme, and shortcuts.
- Service worker only handles same-origin static assets and explicitly bypasses `/api/`.

- [ ] **Step 1: Write PWA policy test**

Read `sw.js` and assert it contains a guard equivalent to:

```js
if (url.pathname.startsWith('/api/')) return;
```

Assert manifest name starts with `SEE` and `dir` is `rtl`.

- [ ] **Step 2: Verify RED**

Run `npm test`; expected missing files.

- [ ] **Step 3: Implement manifest and service worker**

Cache `/`, built static assets, manifest, and icons only. Use network for `/api/*`, evidence downloads, and non-GET requests. Do not put bearer tokens or engagement payloads into Cache Storage.

- [ ] **Step 4: Register service worker**

In `main.tsx`, register `/sw.js` only when `serviceWorker` exists in `navigator` and the page is not in a development localhost flow where caching would obstruct iteration.

- [ ] **Step 5: Verify**

Run tests/typecheck/build.

---

### Task 8: Demo seed, release verification, PR, merge, and Cloudflare deployment

**Files:**
- Modify: `apps/cloudflare/worker/phase-a/demo-seed.ts`
- Modify: `README.md`
- Modify: `.github/workflows/deploy-cloudflare.yml`
- Test: `tests/demo-seed.test.ts`

**Interfaces:**
- Demo includes safe KOSIF-derived sample signals/rounds/standards usage but still does not create an approved report or archived engagement.
- Deploy workflow runs tests/typecheck/build, ensures R2, deploys, applies migrations, deploys again, and verifies a public health endpoint before success.

- [ ] **Step 1: Extend demo contract first**

Require demo seed to include at least one journal review run, one pending journal signal, round decisions that are not all complete, and provenance-labeled standards usage. Assert no `report_versions.status='approved'` seed and no archive state.

- [ ] **Step 2: Implement minimal demo data**

Use deterministic IDs/data and mark all sample content as demo/training. Do not seed statutory conclusions.

- [ ] **Step 3: Add deployment health check**

After final deploy, run a check against the stable worker health endpoint and fail the workflow if it does not return 2xx. Do not print secrets.

- [ ] **Step 4: Full verification before PR**

Run:

```bash
npm install
npm --workspace @see/cloudflare run db:check
npm test
npm run typecheck
npm run build
```

Expected: all PASS, no skipped required checks.

- [ ] **Step 5: Review diff and open PR**

Compare `feat/see-phase-a-unification` against `main`, remove accidental/generated files, then open a PR summarizing the KOSIF Stable design/capability port and authority boundaries.

- [ ] **Step 6: Wait for PR CI and only merge when green**

Do not merge with a failing migration/test/typecheck/build check.

- [ ] **Step 7: Verify production deployment**

After merge, inspect the Cloudflare deploy job logs for successful R2/D1/final Worker deployment, extract the actual `workers.dev` URL, and test the root plus health endpoint. Only then report the new SEE version as deployed.
