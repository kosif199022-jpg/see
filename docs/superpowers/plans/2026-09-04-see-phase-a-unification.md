# SEE Phase A Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve the deployed SEE MVP into the first unified audit workspace without breaking the existing TB → Mapping → Materiality → Risk → Evidence → Findings flow.

**Architecture:** Keep the current React/Vite + Cloudflare Worker + D1 + R2 deployment as a modular monolith. Add additive D1 state, pure deterministic lifecycle/readiness rules under `packages/domain` and `packages/audit-engine`, focused Worker route modules, and a new RTL app shell whose five primary destinations are backed by real API state. Phase A introduces lifecycle, PBC, procedures, workpapers/review, evidence trace, analytics/reporting projections, and a governed AI Council shell; no AI provider gains professional authority.

**Tech Stack:** Node.js 22+, TypeScript 5.8+, React 19, Vite 7, Cloudflare Workers, D1, R2, Wrangler 4, Node `node:test` + `assert/strict`.

**Spec:** `docs/superpowers/specs/2026-09-04-see-unified-architecture-design.md`

## Global Constraints

- SEE remains the product and Cloudflare deployment surface.
- Preserve the current production path and use additive migrations only.
- Monetary facts remain integer minor units / BigInt-compatible contracts; no floating-point equality is an accounting control.
- Approved professional records are never silently mutated; changes create a new revision/version.
- AI is advisory only and cannot approve materiality, accept evidence, approve opinion, post adjustments, or lock archive.
- Every professional mutation emits an append-only audit event.
- Server-side authorization remains authoritative; browser controls are presentation only.
- Arabic RTL is native; mobile uses five primary destinations and 44px practical touch targets.
- No hard-coded demo KPI may be rendered as production truth.
- Existing `npm test`, `npm run typecheck`, and `npm run build` must remain green after every task.

---

## File Structure Locked for Phase A

### Domain / deterministic rules

- `packages/domain/src/audit-model.ts` — keep existing shared model; extend only if required for backward compatibility.
- `packages/domain/src/lifecycle.ts` — engagement/PBC/workpaper/evidence/risk/report/council state contracts and transition validation.
- `packages/domain/src/provenance.ts` — compact provenance/version DTOs used by API projections.
- `packages/audit-engine/src/readiness.ts` — deterministic readiness/blocker projection from current engagement state.
- `packages/audit-engine/src/analytics-summary.ts` — deterministic Phase-A analytics projection from TB/risk/finding inputs; indicators only.

### Cloudflare application

- `apps/cloudflare/migrations/0002_phase_a.sql` — additive Phase-A tables/indexes.
- `apps/cloudflare/worker/phase-a/types.ts` — D1-facing DTO shapes and API response types.
- `apps/cloudflare/worker/phase-a/events.ts` — append-only event helper shared by new routes.
- `apps/cloudflare/worker/phase-a/dashboard.ts` — command-center aggregate query/projection.
- `apps/cloudflare/worker/phase-a/lifecycle.ts` — engagement transition/revision routes.
- `apps/cloudflare/worker/phase-a/pbc.ts` — PBC CRUD/state transitions.
- `apps/cloudflare/worker/phase-a/fieldwork.ts` — procedures, procedure runs, workpapers, review notes.
- `apps/cloudflare/worker/phase-a/trace.ts` — evidence links and trace graph projection.
- `apps/cloudflare/worker/phase-a/council.ts` — Council shell records and governance-only state transitions.
- `apps/cloudflare/worker/phase-a/reporting.ts` — report readiness/version shell.
- `apps/cloudflare/worker/phase-a/router.ts` — dispatches only `/api/v1/...` Phase-A routes.
- `apps/cloudflare/worker/index.ts` — retain existing routes and delegate `/api/v1/...` to Phase-A router before compatibility routes.

### React UI

- `apps/cloudflare/src/types.ts` — client DTO types for dashboard/workspaces.
- `apps/cloudflare/src/navigation.ts` — five primary destinations + audit stage labels.
- `apps/cloudflare/src/components/AppShell.tsx` — desktop rail/mobile bottom navigation/topbar.
- `apps/cloudflare/src/components/Status.tsx` — badges, blocker list, loading/empty/error primitives.
- `apps/cloudflare/src/components/CommandCenter.tsx` — real KPI/readiness/timeline surface.
- `apps/cloudflare/src/components/AuditWorkspace.tsx` — stage rail + lifecycle/PBC/fieldwork panels.
- `apps/cloudflare/src/components/AnalyticsCenter.tsx` — deterministic indicators with method labels.
- `apps/cloudflare/src/components/EvidenceTrace.tsx` — accessible trace list plus simple SVG graph.
- `apps/cloudflare/src/components/CouncilWorkspace.tsx` — governed Council shell.
- `apps/cloudflare/src/components/MoreWorkspace.tsx` — evidence/report/settings access.
- `apps/cloudflare/src/App.tsx` — orchestration only; remove monolithic view markup after components are wired.
- `apps/cloudflare/src/styles.css` — replace current basic skin with the governed responsive visual system.

### Tests / CI

- `tests/lifecycle.test.ts` — state-machine and authority boundary tests.
- `tests/readiness.test.ts` — blocker/readiness tests.
- `tests/analytics-summary.test.ts` — deterministic analytics projection tests.
- `tests/phase-a-contracts.test.ts` — stable API enum/shape contracts that do not require D1.
- `.github/workflows/ci.yml` — add local migration validation after install.
- `apps/cloudflare/package.json` — add `db:check` script only; no new runtime dependency required in Phase A.

---

### Task 1: Deterministic lifecycle state machines

**Files:**
- Create: `packages/domain/src/lifecycle.ts`
- Create: `tests/lifecycle.test.ts`
- Modify: `tests/audit-core.test.ts` only if a shared import changes.

**Interfaces:**
- Consumes: plain string states and a transition context `{ actorRole, reason?, prerequisites }`.
- Produces:
  - `type EngagementStatus = 'draft' | 'acceptance' | 'planning' | 'fieldwork' | 'review' | 'reporting' | 'archived' | 'on_hold'`
  - `type PbcStatus = 'draft' | 'requested' | 'received' | 'under_review' | 'accepted' | 'rejected' | 'need_clarification' | 'overdue'`
  - `type WorkpaperStatus = 'draft' | 'prepared' | 'reviewer_open' | 'cleared' | 'approved' | 'locked'`
  - `type CouncilStatus = 'prepared' | 'running' | 'challenged' | 'synthesized' | 'human_reviewed'`
  - `validateEngagementTransition(from, to, input): TransitionDecision`
  - `validatePbcTransition(from, to): TransitionDecision`
  - `validateWorkpaperTransition(from, to, input): TransitionDecision`
  - `validateCouncilTransition(from, to, input): TransitionDecision`

- [ ] **Step 1: Write failing state-machine tests**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateEngagementTransition,
  validatePbcTransition,
  validateWorkpaperTransition,
  validateCouncilTransition,
} from '../packages/domain/src/lifecycle.ts';

test('engagement cannot skip acceptance and planning', () => {
  const result = validateEngagementTransition('draft', 'fieldwork', {
    actorRole: 'manager', prerequisites: [],
  });
  assert.equal(result.allowed, false);
  assert.ok(result.blockers.includes('ENGAGEMENT_INVALID_TRANSITION'));
});

test('archive requires partner role and all closure prerequisites', () => {
  const denied = validateEngagementTransition('reporting', 'archived', {
    actorRole: 'manager', prerequisites: ['REPORT_APPROVED', 'EVIDENCE_SUFFICIENT'],
  });
  assert.equal(denied.allowed, false);
  assert.ok(denied.blockers.includes('ARCHIVE_PARTNER_REQUIRED'));
});

test('PBC receipt does not equal evidence acceptance', () => {
  assert.equal(validatePbcTransition('requested', 'received').allowed, true);
  assert.equal(validatePbcTransition('received', 'accepted').allowed, false);
  assert.equal(validatePbcTransition('received', 'under_review').allowed, true);
});

test('signed workpaper edit must open a new version instead of mutation', () => {
  const result = validateWorkpaperTransition('approved', 'draft', { actorRole: 'senior' });
  assert.equal(result.allowed, false);
  assert.equal(result.requiresNewVersion, true);
});

test('Council cannot mark itself human reviewed without human actor', () => {
  const result = validateCouncilTransition('synthesized', 'human_reviewed', { actorRole: 'ai_agent' });
  assert.equal(result.allowed, false);
  assert.ok(result.blockers.includes('HUMAN_REVIEW_REQUIRED'));
});
```

- [ ] **Step 2: Run the new test and verify RED**

Run: `node --experimental-strip-types --test tests/lifecycle.test.ts`

Expected: FAIL because `packages/domain/src/lifecycle.ts` does not exist.

- [ ] **Step 3: Implement the transition tables and professional gates**

Use explicit adjacency maps, never fuzzy inference:

```ts
export interface TransitionDecision {
  allowed: boolean;
  blockers: string[];
  requiresNewVersion?: boolean;
}

const ENGAGEMENT_NEXT: Record<EngagementStatus, readonly EngagementStatus[]> = {
  draft: ['acceptance', 'on_hold'],
  acceptance: ['planning', 'on_hold'],
  planning: ['fieldwork', 'on_hold'],
  fieldwork: ['review', 'on_hold'],
  review: ['reporting', 'fieldwork', 'on_hold'],
  reporting: ['archived', 'review', 'on_hold'],
  archived: [],
  on_hold: ['acceptance', 'planning', 'fieldwork', 'review', 'reporting'],
};
```

For `reporting → archived`, require `actorRole === 'partner'` and prerequisite codes `REPORT_APPROVED`, `EVIDENCE_SUFFICIENT`, `OPEN_REVIEW_NOTES_ZERO`, `OPEN_HIGH_RISKS_ZERO`.

- [ ] **Step 4: Run lifecycle tests**

Run: `node --experimental-strip-types --test tests/lifecycle.test.ts`

Expected: PASS.

- [ ] **Step 5: Run full deterministic suite**

Run: `npm test`

Expected: all existing and lifecycle tests PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/domain/src/lifecycle.ts tests/lifecycle.test.ts
git commit -m "feat: add governed audit lifecycle state machines"
```

---

### Task 2: Phase-A additive D1 schema

**Files:**
- Create: `apps/cloudflare/migrations/0002_phase_a.sql`
- Modify: `apps/cloudflare/package.json`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: current `engagements`, `evidence`, `audit_events` tables from `0001_init.sql`.
- Produces: versioned lifecycle/PBC/fieldwork/trace/report/Council storage without deleting or renaming current columns.

- [ ] **Step 1: Write the migration with additive tables**

The migration must contain these concrete tables and foreign keys:

```sql
CREATE TABLE IF NOT EXISTS engagement_revisions (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  reason TEXT NOT NULL,
  actor TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(engagement_id, revision)
);

CREATE TABLE IF NOT EXISTS pbc_requests (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'draft',
  due_at TEXT,
  evidence_id TEXT REFERENCES evidence(id),
  revision INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS procedures (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  risk_id TEXT REFERENCES risks(id),
  title TEXT NOT NULL,
  objective TEXT NOT NULL,
  procedure_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  owner TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS procedure_runs (
  id TEXT PRIMARY KEY,
  procedure_id TEXT NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  result TEXT NOT NULL DEFAULT '',
  conclusion TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  performed_by TEXT NOT NULL,
  performed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workpapers (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  procedure_id TEXT REFERENCES procedures(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  current_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workpaper_versions (
  id TEXT PRIMARY KEY,
  workpaper_id TEXT NOT NULL REFERENCES workpapers(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  conclusion TEXT NOT NULL DEFAULT '',
  preparer TEXT NOT NULL,
  reviewer TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  UNIQUE(workpaper_id, version)
);

CREATE TABLE IF NOT EXISTS review_notes (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  workpaper_id TEXT REFERENCES workpapers(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_by TEXT NOT NULL,
  cleared_by TEXT,
  created_at TEXT NOT NULL,
  cleared_at TEXT
);

CREATE TABLE IF NOT EXISTS evidence_links (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  evidence_id TEXT NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  relation TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(evidence_id, target_type, target_id, relation)
);

CREATE TABLE IF NOT EXISTS council_runs (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'prepared',
  task TEXT NOT NULL,
  evidence_snapshot_json TEXT NOT NULL DEFAULT '{}',
  synthesis_json TEXT,
  human_decision TEXT,
  human_rationale TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  reviewed_at TEXT
);

CREATE TABLE IF NOT EXISTS report_versions (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  readiness_snapshot_json TEXT NOT NULL,
  narrative TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  approved_at TEXT,
  UNIQUE(engagement_id, version)
);
```

Add indexes for `engagement_id,status` on PBC/procedures/workpapers/review_notes/council_runs/report_versions and `engagement_id,target_type,target_id` on `evidence_links`.

- [ ] **Step 2: Add a local migration validation script**

In `apps/cloudflare/package.json` add:

```json
"db:check": "wrangler d1 migrations apply DB --local"
```

- [ ] **Step 3: Add migration validation to CI**

After `npm install`, add:

```yaml
- name: Validate D1 migrations
  run: npm --workspace @see/cloudflare run db:check
```

- [ ] **Step 4: Run migration locally**

Run: `npm --workspace @see/cloudflare run db:check`

Expected: `0001_init.sql` and `0002_phase_a.sql` apply successfully to local D1 with no foreign-key or syntax error.

- [ ] **Step 5: Run CI-equivalent checks**

Run: `npm test && npm run typecheck && npm run build`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/cloudflare/migrations/0002_phase_a.sql apps/cloudflare/package.json .github/workflows/ci.yml
git commit -m "feat: add phase A audit workflow schema"
```

---

### Task 3: Deterministic readiness and analytics projections

**Files:**
- Create: `packages/audit-engine/src/readiness.ts`
- Create: `packages/audit-engine/src/analytics-summary.ts`
- Create: `tests/readiness.test.ts`
- Create: `tests/analytics-summary.test.ts`

**Interfaces:**
- Produces `computeAuditReadiness(input): AuditReadiness` and `buildAnalyticsSummary(input): AnalyticsSummary`.
- No D1, wall-clock, random, browser, or AI dependency.

- [ ] **Step 1: Write failing readiness tests**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { computeAuditReadiness } from '../packages/audit-engine/src/readiness.ts';

test('readiness exposes blocker codes instead of autonomous opinion', () => {
  const result = computeAuditReadiness({
    tbBalanced: true,
    unmappedAccounts: 0,
    unapprovedMateriality: 0,
    openHighRisks: 1,
    openPbc: 2,
    openReviewNotes: 0,
    openFindings: 0,
    evidenceCount: 3,
    reportApproved: false,
  });
  assert.equal(result.readyForArchive, false);
  assert.ok(result.blockers.some((x) => x.code === 'OPEN_HIGH_RISKS'));
  assert.ok(result.blockers.some((x) => x.code === 'PBC_INCOMPLETE'));
  assert.doesNotMatch(result.label, /unmodified opinion/i);
});
```

- [ ] **Step 2: Write failing analytics tests**

```ts
import { buildAnalyticsSummary } from '../packages/audit-engine/src/analytics-summary.ts';

test('analytics summary labels all outputs as indicators', () => {
  const result = buildAnalyticsSummary({
    totalDebit: 1000000n,
    totalCredit: 1000000n,
    accountCount: 10,
    highRiskCount: 2,
    mediumRiskCount: 3,
    openFindingCount: 1,
  });
  assert.equal(result.method, 'SEE-ANALYTICS-SUMMARY-v1');
  assert.equal(result.tbDifferenceMinor, 0n);
  assert.equal(result.authority, 'indicator');
});
```

- [ ] **Step 3: Run both tests and verify RED**

Run: `node --experimental-strip-types --test tests/readiness.test.ts tests/analytics-summary.test.ts`

Expected: FAIL because modules do not exist.

- [ ] **Step 4: Implement exact projections**

`computeAuditReadiness` returns:

```ts
interface AuditReadiness {
  score: number;
  label: 'blocked' | 'in_progress' | 'ready_for_human_review';
  readyForArchive: boolean;
  blockers: Array<{ code: string; message: string; count?: number }>;
  method: 'SEE-READINESS-v1';
}
```

Compute score as an integer 0–100 by subtracting fixed weights from 100: unbalanced TB 30, unmapped accounts up to 20, unapproved materiality 10, high risks up to 20, PBC up to 10, review notes up to 10. Clamp 0–100. `readyForArchive` additionally requires zero blockers and `reportApproved === true`.

`buildAnalyticsSummary` returns only deterministic counts/differences, not ratios that require unavailable balance classifications in Phase A.

- [ ] **Step 5: Run tests and full suite**

Run: `npm test`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/audit-engine/src/readiness.ts packages/audit-engine/src/analytics-summary.ts tests/readiness.test.ts tests/analytics-summary.test.ts
git commit -m "feat: add deterministic readiness and analytics projections"
```

---

### Task 4: Phase-A Worker router and command-center aggregate

**Files:**
- Create: `apps/cloudflare/worker/phase-a/types.ts`
- Create: `apps/cloudflare/worker/phase-a/events.ts`
- Create: `apps/cloudflare/worker/phase-a/dashboard.ts`
- Create: `apps/cloudflare/worker/phase-a/router.ts`
- Modify: `apps/cloudflare/worker/index.ts`
- Create: `tests/phase-a-contracts.test.ts`

**Interfaces:**
- `handlePhaseA(request, env): Promise<Response | null>` returns `null` for non-`/api/v1/` paths.
- `GET /api/v1/engagements/:id/command-center` returns `{ engagement, readiness, metrics, stages, recentEvents, analytics, council }`.
- Existing `/api/...` compatibility routes remain untouched.

- [ ] **Step 1: Write failing contract tests for stable enums**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { PRIMARY_WORKSPACES, AUDIT_STAGES } from '../apps/cloudflare/worker/phase-a/types.ts';

test('Phase A exposes five primary workspaces', () => {
  assert.deepEqual(PRIMARY_WORKSPACES, ['home', 'audit', 'analytics', 'council', 'more']);
});

test('audit stages preserve professional order', () => {
  assert.deepEqual(AUDIT_STAGES.slice(0, 4), ['acceptance', 'planning', 'pbc', 'data_intake']);
  assert.equal(AUDIT_STAGES.at(-1), 'archive');
});
```

- [ ] **Step 2: Verify RED**

Run: `node --experimental-strip-types --test tests/phase-a-contracts.test.ts`

Expected: FAIL because `phase-a/types.ts` does not exist.

- [ ] **Step 3: Implement DTO constants/types and shared event helper**

`events.ts` exports:

```ts
export async function appendAuditEvent(
  env: Env,
  input: { engagementId: string; entityType: string; entityId: string; action: string; actor: string; payload?: Record<string, unknown> },
): Promise<void>
```

Use the existing `audit_events` table; do not create a parallel event store.

- [ ] **Step 4: Implement command-center aggregate**

Query current TB, latest mappings, materiality, risks, evidence, findings plus new PBC/review/procedure/Council counts. Convert stored minor-unit integers to `bigint` before calling deterministic packages. Return strings for monetary minor units over JSON.

- [ ] **Step 5: Wire router before compatibility routes**

At the top of `handleApi` in `worker/index.ts`, after health/auth checks but before current endpoint matching:

```ts
const phaseA = await handlePhaseA(request, env);
if (phaseA) return phaseA;
```

- [ ] **Step 6: Run tests/typecheck/build**

Run: `npm test && npm run typecheck && npm run build`

Expected: PASS and no existing endpoint removal.

- [ ] **Step 7: Commit**

```bash
git add apps/cloudflare/worker/phase-a apps/cloudflare/worker/index.ts tests/phase-a-contracts.test.ts
git commit -m "feat: add phase A API router and command center"
```

---

### Task 5: Lifecycle, PBC, procedures, workpapers, and review APIs

**Files:**
- Create: `apps/cloudflare/worker/phase-a/lifecycle.ts`
- Create: `apps/cloudflare/worker/phase-a/pbc.ts`
- Create: `apps/cloudflare/worker/phase-a/fieldwork.ts`
- Modify: `apps/cloudflare/worker/phase-a/router.ts`

**Interfaces:**
- `POST /api/v1/engagements/:id/transitions` body `{ to, reason, actorRole }`.
- `GET|POST /api/v1/engagements/:id/pbc`
- `POST /api/v1/pbc/:id/transitions` body `{ to }`.
- `GET|POST /api/v1/engagements/:id/procedures`
- `POST /api/v1/procedures/:id/runs`
- `GET|POST /api/v1/engagements/:id/workpapers`
- `POST /api/v1/workpapers/:id/review-notes`
- `POST /api/v1/review-notes/:id/clear`

- [ ] **Step 1: Implement lifecycle transitions using the pure validator**

Read current `engagements.status`, call `validateEngagementTransition`, and return HTTP 409 with:

```json
{"error":{"code":"TRANSITION_BLOCKED","blockers":["..."]}}
```

On success update status, insert next `engagement_revisions.revision = MAX(revision)+1`, and append event `engagement.transitioned`.

- [ ] **Step 2: Implement PBC create/list/transitions**

Creation requires `title`; transition uses `validatePbcTransition`. `received` never sets evidence to accepted. If evidence is linked later, it remains a separate reviewer action.

- [ ] **Step 3: Implement procedures and procedure runs**

Procedure body:

```ts
{ title: string; objective: string; procedureType: 'controls' | 'substantive' | 'analytics' | 'other'; riskId?: string; owner?: string }
```

A run body contains `{ result: string; conclusion: string; status: 'open' | 'completed'; actor: string }`. Completed runs require non-empty conclusion.

- [ ] **Step 4: Implement workpaper version creation and review notes**

Create a workpaper + version 1 in one D1 batch. When an approved workpaper is edited, insert `current_version + 1` instead of updating the signed version. Clearing a review note records `cleared_by`, `cleared_at`, and an audit event.

- [ ] **Step 5: Exercise routes locally with Wrangler**

Run:

```bash
npm --workspace @see/cloudflare run db:check
npm --workspace @see/cloudflare run dev
```

In another shell, create/use demo engagement and issue one request for each route. Expected: JSON 2xx for valid state; HTTP 409 + blocker code for invalid transitions.

- [ ] **Step 6: Run full checks**

Run: `npm test && npm run typecheck && npm run build`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/cloudflare/worker/phase-a/lifecycle.ts apps/cloudflare/worker/phase-a/pbc.ts apps/cloudflare/worker/phase-a/fieldwork.ts apps/cloudflare/worker/phase-a/router.ts
git commit -m "feat: add governed PBC and fieldwork APIs"
```

---

### Task 6: Evidence trace graph, Council shell, and report-version shell

**Files:**
- Create: `apps/cloudflare/worker/phase-a/trace.ts`
- Create: `apps/cloudflare/worker/phase-a/council.ts`
- Create: `apps/cloudflare/worker/phase-a/reporting.ts`
- Modify: `apps/cloudflare/worker/phase-a/router.ts`

**Interfaces:**
- `GET /api/v1/engagements/:id/trace`
- `POST /api/v1/engagements/:id/evidence-links`
- `GET|POST /api/v1/engagements/:id/council-runs`
- `POST /api/v1/council-runs/:id/transitions`
- `GET|POST /api/v1/engagements/:id/report-versions`

- [ ] **Step 1: Implement evidence-link validation**

Accept target types only from:

```ts
const TRACE_TARGETS = ['trial_balance_line','risk','procedure','procedure_run','workpaper','finding','report_version','council_run'] as const;
```

Verify evidence and target engagement ownership before inserting `evidence_links`; reject cross-engagement references with HTTP 404 to avoid leaking existence.

- [ ] **Step 2: Implement trace projection**

Return:

```ts
{
  nodes: Array<{ id: string; type: string; label: string; status?: string }>,
  edges: Array<{ id: string; from: string; to: string; relation: string }>,
  summary: { evidenceNodes: number; linkedTargets: number; unlinkedEvidence: number }
}
```

Use current D1 rows only. The graph never computes readiness or money.

- [ ] **Step 3: Implement Council shell with forbidden authority**

Creation body `{ task, evidenceIds: string[], createdBy }`. Store only an evidence metadata snapshot (`id`, `sha256`, `name`, `status`), not document bytes. Transitions use `validateCouncilTransition`. Only a human actor role can set `human_reviewed`, `human_decision`, and `human_rationale`.

No external model call is made in Phase A.

- [ ] **Step 4: Implement report-version shell**

On create, call command-center/readiness projection and store the full readiness snapshot JSON. Version is `MAX(version)+1`. Status starts `draft`. Reject an `approved` state while readiness has blockers. Never derive a statutory opinion string.

- [ ] **Step 5: Local route smoke**

Use the demo engagement: link the demo evidence to its finding/procedure, fetch `/trace`, create a Council run, and create a report version. Expected: trace nodes/edges are present; Council remains advisory; report snapshot includes method `SEE-READINESS-v1`.

- [ ] **Step 6: Run full checks and commit**

Run: `npm test && npm run typecheck && npm run build`

```bash
git add apps/cloudflare/worker/phase-a/trace.ts apps/cloudflare/worker/phase-a/council.ts apps/cloudflare/worker/phase-a/reporting.ts apps/cloudflare/worker/phase-a/router.ts
git commit -m "feat: add evidence trace council and reporting shells"
```

---

### Task 7: Replace the monolithic UI shell with five real workspaces

**Files:**
- Create: `apps/cloudflare/src/types.ts`
- Create: `apps/cloudflare/src/navigation.ts`
- Create: `apps/cloudflare/src/components/AppShell.tsx`
- Create: `apps/cloudflare/src/components/Status.tsx`
- Create: `apps/cloudflare/src/components/CommandCenter.tsx`
- Modify: `apps/cloudflare/src/App.tsx`
- Modify: `apps/cloudflare/src/styles.css`

**Interfaces:**
- `AppShell` props: `{ active, onNavigate, engagementName?, children }`.
- Primary destination IDs exactly `home | audit | analytics | council | more`.
- `CommandCenter` consumes only `/api/v1/engagements/:id/command-center` DTO.

- [ ] **Step 1: Add client DTOs/navigation constants**

Use the same enum order as `phase-a/types.ts`; Arabic labels:

```ts
export const PRIMARY_NAV = [
  ['home', 'الرئيسية'],
  ['audit', 'المراجعة'],
  ['analytics', 'التحليلات'],
  ['council', 'مجلس AI'],
  ['more', 'المزيد'],
] as const;
```

- [ ] **Step 2: Build AppShell**

Desktop ≥ 981px: fixed RTL rail. Mobile ≤ 700px: fixed bottom nav with safe-area padding. All nav buttons min-height 44px, `aria-current="page"` on active destination. Preserve engagement selector and access-token control.

- [ ] **Step 3: Build real Command Center**

Render current stage, readiness score/label, blockers, TB health, mapping completion, high risks, PBC outstanding, evidence count, open review notes/findings, latest Council status, and audit event timeline. Values come from API DTO; no fixture numbers.

- [ ] **Step 4: Recompose `App.tsx` as orchestration**

Keep current engagement creation/demo and legacy flows callable. Replace current `Tab` navigation with `PrimaryWorkspace`. Do not delete TB/mapping/materiality/risk/evidence forms; move them under the audit/more components in Task 8.

- [ ] **Step 5: Implement visual tokens and responsive layout**

Use one token namespace in `:root`: background, surface, line, text, muted, success, warning, risk, evidence, AI, accent, radii, shadow, sidebar width. Add dark default; optional `data-theme="dawn"` and `data-theme="emerald"`. Respect `prefers-reduced-motion`.

- [ ] **Step 6: Typecheck/build and manual responsive smoke**

Run: `npm run typecheck && npm run build`.

Open local dev at desktop and iPhone-width viewport. Expected: no horizontal page overflow, bottom nav visible on mobile, all five destinations keyboard/touch reachable, existing engagement selector still works.

- [ ] **Step 7: Commit**

```bash
git add apps/cloudflare/src/types.ts apps/cloudflare/src/navigation.ts apps/cloudflare/src/components/AppShell.tsx apps/cloudflare/src/components/Status.tsx apps/cloudflare/src/components/CommandCenter.tsx apps/cloudflare/src/App.tsx apps/cloudflare/src/styles.css
git commit -m "feat: add unified SEE command shell"
```

---

### Task 8: Audit, analytics, evidence, Council, and More workspaces

**Files:**
- Create: `apps/cloudflare/src/components/AuditWorkspace.tsx`
- Create: `apps/cloudflare/src/components/AnalyticsCenter.tsx`
- Create: `apps/cloudflare/src/components/EvidenceTrace.tsx`
- Create: `apps/cloudflare/src/components/CouncilWorkspace.tsx`
- Create: `apps/cloudflare/src/components/MoreWorkspace.tsx`
- Modify: `apps/cloudflare/src/App.tsx`
- Modify: `apps/cloudflare/src/api.ts`
- Modify: `apps/cloudflare/src/styles.css`

**Interfaces:**
- Existing pilot API methods continue to support TB/mapping/materiality/risk/evidence/findings.
- New `/api/v1` methods are added to `api.ts` as typed wrappers, not ad-hoc fetch calls spread across components.

- [ ] **Step 1: Build AuditWorkspace with stage rail**

Stage order:

`Acceptance → Planning → PBC → Data Intake → Mapping → Materiality → Risk → Procedures → Evidence → Workpapers → Review → Misstatements → Reporting → Archive`

For Phase A, unsupported deep stages show explicit `قيد التطوير في المرحلة التالية` only when no server capability exists; existing/current and new Phase-A stages are interactive. Blocked transition buttons render blocker text returned by API.

- [ ] **Step 2: Move existing functional forms into AuditWorkspace**

Move TB import, mapping approval, materiality, risk creation from `App.tsx` without changing their API semantics. Add PBC/procedure/workpaper/review-note panels using `/api/v1` routes.

- [ ] **Step 3: Build AnalyticsCenter**

Show only Phase-A deterministic fields: TB debit/credit/difference, account count, risk mix, open findings, readiness. Every analytical card displays `method` and an `مؤشر — ليس استنتاج مراجعة` label.

- [ ] **Step 4: Build EvidenceTrace**

Render an accessible list first, then an SVG node/edge view from `/trace`. SVG nodes are buttons/links where possible; include a `عرض كقائمة` toggle. No canvas-only information.

- [ ] **Step 5: Build CouncilWorkspace**

Display governance banner: `المجلس استشاري ولا يملك صلاحية الاعتماد`. Allow creation of a Council task from selected evidence metadata and lifecycle progress through prepared/running/challenged/synthesized. Phase A does not call external AI providers; show this clearly.

- [ ] **Step 6: Build MoreWorkspace**

Contain evidence upload/findings, report-version readiness, audit trail, access-token settings, and build/version information. Preserve R2 download behavior.

- [ ] **Step 7: Run typecheck/build and functional smoke**

Run: `npm test && npm run typecheck && npm run build`.

Manual demo acceptance: create demo → home reflects real counts → audit opens TB/mapping/planning → create PBC → create procedure/workpaper/review note → link evidence → trace shows link → Council shell stores task → report shell shows blockers.

- [ ] **Step 8: Commit**

```bash
git add apps/cloudflare/src/components/AuditWorkspace.tsx apps/cloudflare/src/components/AnalyticsCenter.tsx apps/cloudflare/src/components/EvidenceTrace.tsx apps/cloudflare/src/components/CouncilWorkspace.tsx apps/cloudflare/src/components/MoreWorkspace.tsx apps/cloudflare/src/App.tsx apps/cloudflare/src/api.ts apps/cloudflare/src/styles.css
git commit -m "feat: add unified audit workspaces"
```

---

### Task 9: Demo seeding, migration-safe compatibility, and release verification

**Files:**
- Modify: `apps/cloudflare/worker/index.ts`
- Modify: `apps/cloudflare/worker/phase-a/dashboard.ts`
- Modify: `README.md`
- Modify: `.github/workflows/deploy-cloudflare.yml` only if remote migration ordering does not already run before final deploy.

**Interfaces:**
- Existing `/api/demo` remains valid and seeds enough Phase-A records to demonstrate PBC/procedure/workpaper/trace without inventing audit conclusions.
- Existing production URL remains `https://see-audit.kosif199022.workers.dev` unless Cloudflare changes it.

- [ ] **Step 1: Extend demo seeding with clearly labelled Phase-A records**

Seed one PBC request, one procedure linked to the existing revenue risk, one procedure run, one draft workpaper, one open review note, one evidence link to the existing demo evidence, and one Council run in `prepared`. Do not seed an approved report or archive state.

- [ ] **Step 2: Verify compatibility facades**

The old dashboard endpoint and all existing mutation endpoints must still respond. New UI may prefer `/api/v1`, but no old route is removed in Phase A.

- [ ] **Step 3: Verify deployment workflow ordering**

Required order: install → tests/typecheck/build → ensure R2 → deploy bindings/resources as currently required → apply `0002_phase_a.sql` remotely → final deploy → production health check. Do not delete the already-working D1/R2 provisioning logic.

- [ ] **Step 4: Update README with production capability boundary**

Document:
- Phase A capabilities now available;
- AI Council is shell/governance only, no external-provider authority yet;
- demo vs real-data warning;
- `APP_ACCESS_TOKEN` requirement before real data;
- local test/build/migration commands.

- [ ] **Step 5: Run the complete release gate**

Run:

```bash
npm install
npm --workspace @see/cloudflare run db:check
npm test
npm run typecheck
npm run build
```

Expected: every command exits 0.

- [ ] **Step 6: Open implementation PR and wait for CI**

PR body must enumerate Phase-A tables, routes, deterministic tests, preserved legacy routes, and UI workspaces. Do not merge while CI is pending or red.

- [ ] **Step 7: After green CI, merge and verify Cloudflare production**

Confirm GitHub deploy workflow succeeds, remote D1 migration applies, R2 binding remains valid, and `/api/health` plus the production home page respond.

- [ ] **Step 8: Commit documentation/release prep**

```bash
git add apps/cloudflare/worker/index.ts apps/cloudflare/worker/phase-a/dashboard.ts README.md .github/workflows/deploy-cloudflare.yml
git commit -m "docs: prepare SEE phase A release"
```

---

## Self-Review Against the Approved Spec

### Spec coverage in Phase A

- Unified five-destination Arabic RTL shell: Task 7/8.
- Engagement lifecycle/revisions: Task 1/2/5.
- PBC: Task 2/5/8.
- Procedures/procedure runs: Task 2/5/8.
- Workpapers/review notes: Task 2/5/8.
- Evidence links/trace graph foundation: Task 2/6/8.
- Deterministic analytics center shell: Task 3/4/8.
- Reporting center/version shell: Task 2/6/8.
- AI Council governed shell: Task 1/2/6/8.
- Compatibility with existing MVP: Task 4/8/9.
- Additive D1 migration + Cloudflare release: Task 2/9.
- AI provider routing, standards RAG, GL/reconciliation, full tenant identity, client portal, offline capture, advanced analytics, and archive lock are intentionally **not Phase A**; they are explicit Phase B–E work in the approved architecture spec.

### Placeholder scan

The plan contains no `TBD`, `TODO`, or unspecified implementation step. Any `قيد التطوير في المرحلة التالية` UI copy is an explicit product state for spec-defined later phases, not an engineering placeholder.

### Type consistency

- Workspace IDs: `home | audit | analytics | council | more` in API contracts and UI navigation.
- Readiness method: `SEE-READINESS-v1` in deterministic package, API snapshot, and report shell.
- Council states: `prepared → running → challenged → synthesized → human_reviewed` everywhere.
- Engagement states preserve the approved spec order and do not introduce an autonomous opinion state.
