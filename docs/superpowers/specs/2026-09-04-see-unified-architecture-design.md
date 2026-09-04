# SEE Unified Audit Operating System — Architecture Design

Date: 2026-09-04  
Status: Approved design baseline  
Branch: `design/see-unified-architecture`

## 1. Decision

SEE will remain the product and deployment surface. We will evolve the existing Cloudflare-based SEE application into a unified audit operating system by selectively porting proven capabilities and UX patterns from the supplied KOSIF, Moon, SKY, Aurora and related materials.

We will **not** merge the source projects mechanically and we will **not** replace SEE wholesale. Every imported capability must cross a compatibility boundary, preserve deterministic financial authority, preserve evidence provenance, and pass SEE-native tests before becoming production authority.

This design adopts the third architecture option discussed with the product owner: **progressive unification into SEE**.

## 2. Product goal

SEE should support one traceable professional audit lifecycle:

`Acceptance → Independence → Planning → PBC → Data Intake → Mapping → Materiality → Risk → Procedures → Evidence → Workpapers → Review → Misstatements → Opinion Support → Reports → Archive`

The user must be able to move from a financial statement line, account, risk, procedure or conclusion back to the originating data, evidence, version, human decision and engine method.

The product is Arabic-first and RTL-native. AI is a governed assistant, never the professional authority.

## 3. Source adoption policy

### 3.1 Moon master specification

Moon is the principal product/methodology reference for lifecycle, gates, state machines, AI boundaries, provenance and professional review behavior.

Adopt:
- complete engagement lifecycle and mandatory gates;
- state machines for engagement, workpaper, evidence, risk, PBC, report and council;
- version/revision semantics instead of silent mutation;
- human approval for critical professional judgments;
- application-service boundary between UI and deterministic engines;
- provenance, audit events and rebuildable report snapshots;
- AI prompt boundaries for standards experts and quality reviewers;
- native Arabic RTL, accessibility and consistent loading/empty/error/success states.

Do not treat Moon UI mockups or demo calculations as financial authority.

### 3.2 SKY

SKY is the principal engineering reference for modular boundaries, deterministic analytics, evidence sealing and reporting composition.

Adopt/reimplement in SEE-native packages:
- Money/minor-unit contracts;
- deterministic analytics: ratios, Benford indicator, receivables aging/ECL models, Altman indicator, journal anomaly flags, composite risk indicators, time-series analytics and jurisdiction-aware tax calculations where validated;
- governed reporting sections that bind analytical outputs to evidence/provenance;
- evidence bundle hashing/sealing concepts;
- package separation between accounting, audit, evidence, analytics, reporting, knowledge and AI.

Rules:
- no float is authoritative for money;
- indicators remain review signals, not conclusions;
- wall-clock and randomness are not permitted inside deterministic financial functions unless supplied explicitly as versioned inputs;
- AI has no dependency path into accounting authority.

### 3.3 KOSIF / mahmoud1990 material

Adopt/reimplement:
- TB import and validation improvements;
- GL/journal analytics and anomaly rules;
- PBC lifecycle and dynamic evidence requests;
- reconciliations;
- adjustment proposal/review workflow;
- explicit audit lifecycle stages and blockers;
- Evidence Graph relationships;
- AI Council pattern: independent first-pass opinions, conflict/challenge matrix, synthesis, then human decision;
- mobile audit interaction patterns;
- standards source governance and effective-date metadata.

Do not copy legacy runtime layering, giant HTML/JS shells, owner-only security assumptions, or UI-coupled calculation code.

### 3.4 Aurora / Moon visual prototypes / cinematic dashboard

Adopt UX ideas only:
- cinematic but legible Command Center;
- semantic KPI cards;
- risk radar/orbit presentation backed by real API data;
- Evidence Graph exploration;
- Council status/pulse;
- timeline and audit trail visualization;
- command palette;
- notifications;
- governed themes;
- responsive desktop/mobile behavior;
- bottom navigation on narrow screens.

Do not import hard-coded demo numbers, duplicate analytics engines, or visual calculations as a source of truth.

### 3.5 Standalone Audit OS

Adopt the simplicity of five primary mobile destinations and the request/risk/test/report workflow. Reimplement against server state, not localStorage as the authoritative data store.

## 4. Non-negotiable invariants

1. **Evidence before conclusion.**
2. **Human judgment is final** for client acceptance, materiality approval, significant risk approval, procedure response approval, evidence sufficiency, misstatement evaluation, opinion approval and archive lock.
3. **Deterministic financial calculations.** Monetary facts use integer minor units / BigInt-compatible contracts or an exact decimal representation where required.
4. **No silent mutation after approval.** Changes create revisions or new versions.
5. **Complete provenance.** Derived records expose source snapshot, method/engine version, actor and timestamp.
6. **Append-only audit trail** for professional state transitions and approvals.
7. **AI is advisory.** AI cannot directly post accounting entries, approve materiality, approve opinion, lock archive, silently accept evidence or mutate approved professional records.
8. **Server-side authorization.** No security decision depends on browser-only controls.
9. **Tenant and engagement isolation** must be enforceable at every query/command boundary before multi-tenant production use.
10. **Arabic RTL is native**, including focus order, table behavior, drawers, mobile navigation and accessible alternatives to graphs.

## 5. Target architecture

SEE remains a Cloudflare application with a modular TypeScript architecture.

### 5.1 Runtime

- Web: React + TypeScript + Vite.
- API/runtime: Cloudflare Worker.
- Relational state: D1 for the current product phase.
- Evidence/blob storage: R2.
- Async work: introduce Queues only when document parsing/import workloads require it.
- AI/provider secrets: Worker secrets only.
- Deployment: GitHub Actions + Wrangler with smoke verification.

The initial architecture remains a **modular monolith**. We split into separate services only when an operational scaling, security or ownership reason exists.

### 5.2 Proposed package boundaries

- `packages/domain` — IDs, revisions, provenance, exact money/value objects, common errors.
- `packages/accounting` — journals, balances, posting/reversal invariants, TB/GL projections.
- `packages/audit-engine` — materiality, assertions, risk, sampling, misstatements, readiness and lifecycle rules.
- `packages/analytics` — deterministic ratios, Benford, aging, journal flags, trend/forecast indicators and other governed analytics.
- `packages/evidence` — evidence metadata, hashing, lineage, integrity verification, optional bundle sealing.
- `packages/reporting` — report definitions, snapshots, exports and rebuildability.
- `packages/knowledge` — source registry, standards metadata, retrieval contracts and citations.
- `packages/ai-gateway` — provider routing, schemas, boundary enforcement, Council orchestration and eval hooks.
- `apps/cloudflare` — application services, D1/R2 adapters, authz, HTTP API, jobs and asset serving.
- `apps/web` or the current web surface — presentation and interaction only.

The UI never calls deterministic packages directly in production. It calls application APIs, and application services invoke domain packages.

## 6. Core data model

The existing tables remain and are expanded through additive migrations. Production history must not be rewritten casually.

### 6.1 Foundation

- `tenants`
- `users`
- `memberships`
- `engagements`
- `engagement_revisions`
- `engagement_members`
- `approval_decisions`
- `audit_events`
- `idempotency_keys`

### 6.2 Data intake and accounting

- `import_jobs`
- `source_files`
- `trial_balance_versions`
- `trial_balance_lines`
- `journal_batches`
- `journal_entries`
- `journal_lines`
- `account_mappings`
- `financial_statement_snapshots`
- `adjustments`
- `adjustment_lines`

### 6.3 Planning and fieldwork

- `materiality_assessments`
- `assertions`
- `risks`
- `risk_assertions`
- `procedures`
- `procedure_runs`
- `samples`
- `sample_items`
- `controls`
- `control_tests`

### 6.4 PBC, evidence and review

- `pbc_requests`
- `documents`
- `document_versions`
- `evidence`
- `evidence_links`
- `workpapers`
- `workpaper_versions`
- `review_notes`
- `findings`
- `management_responses`
- `misstatements`

### 6.5 Standards, AI and reporting

- `standards_sources`
- `standards_versions`
- `standards_citations`
- `ai_runs`
- `council_runs`
- `council_responses`
- `report_definitions`
- `reports`
- `report_versions`
- `archive_locks`

### 6.6 Common record requirements

Where applicable, every professional record carries:
- opaque ID;
- `tenant_id`;
- `engagement_id`;
- revision/version;
- status;
- source/provenance reference;
- created/updated actor;
- UTC timestamps;
- approval metadata when approved.

Approved/versioned entities must retain old versions. Archive state is immutable by default.

## 7. State machines and decision gates

### 7.1 Engagement

`draft → acceptance → planning → fieldwork → review → reporting → archived`

`on_hold` is an explicit governed state. Reopening an approved stage creates a revision and records the reason.

### 7.2 PBC

`draft → requested → received → under_review → accepted | rejected | need_clarification | overdue`

Receipt of a file does not equal acceptance of evidence.

### 7.3 Evidence

`captured → linked → evaluated → accepted | rejected → superseded`

Content hash and R2 object identity remain traceable across versions.

### 7.4 Workpaper

`draft → prepared → reviewer_open → cleared → approved → locked`

Editing a signed version opens a new draft; the signed version remains historical.

### 7.5 Risk

`identified → assessed → significant | non_significant → responded → closed`

Significant-risk classification requires a human decision.

### 7.6 Report

`draft → generated → reviewed → approved → issued | superseded`

The report is rebuilt from a named snapshot/version. Free-text narrative cannot override deterministic factors.

### 7.7 AI Council

`prepared → running → challenged → synthesized → human_reviewed`

Council consensus is informational. It is never an approval mechanism.

## 8. Application services and API behavior

Commands perform validation, authorization, expected-revision checks and prerequisites before mutation. Every successful professional mutation writes an audit event in the same logical transaction or through a reliable outbox strategy.

Initial service groups:
- Engagement Service
- Acceptance & Independence Service
- Import Service
- Accounting/TB/GL Service
- Mapping Service
- Materiality Service
- Risk & Assertion Service
- Procedure/Sampling Service
- PBC Service
- Evidence Service
- Workpaper/Review Service
- Findings/Misstatements Service
- Standards Service
- AI Council Service
- Reporting/Archive Service

HTTP APIs remain versioned under `/api/v1/...` as new contracts are introduced. Existing pilot routes can be retained as compatibility facades during migration.

Structured errors must expose stable codes and corrective context. A blocked transition returns the blocker reasons rather than only disabling a button in the UI.

## 9. UI / UX architecture

### 9.1 Primary navigation

Desktop: fixed RTL command rail.  
Mobile: five primary destinations:

1. `الرئيسية`
2. `المراجعة`
3. `التحليلات`
4. `مجلس AI`
5. `المزيد`

The detailed audit lifecycle appears as a stage rail/workspace inside `المراجعة`, not as a permanently overloaded sidebar.

### 9.2 Command Center

The home view shows only real server-derived values:
- current engagement stage and blockers;
- audit readiness;
- TB/import health;
- mapping completion;
- significant/open risks;
- PBC completion;
- evidence coverage and integrity status;
- open review notes/findings;
- report/archive readiness;
- recent audit events;
- AI Council latest governed status.

No hard-coded KPI is allowed in production mode.

### 9.3 Audit workspace

Bounded-context tabs/drawers:
- Engagement & acceptance
- Data intake / TB / GL
- Mapping & financial statements
- Materiality
- Risks & assertions
- Procedures / sampling / controls
- PBC
- Evidence
- Workpapers & review
- Misstatements & adjustments
- Reporting & archive

Every blocked action explains the missing prerequisite.

### 9.4 Analytics Center

Initial governed modules:
- financial ratios;
- TB/GL health;
- journal anomaly indicators;
- Benford indicator;
- receivables aging and policy-labelled ECL calculations;
- trend/forecast indicators where sufficient data exists;
- risk composition;
- reconciliation status.

Every chart has a table/text fallback and source/method metadata.

### 9.5 Evidence Graph

Graph nodes can include account, statement line, journal, risk, assertion, procedure, evidence, workpaper, finding, adjustment, standard citation, AI run and human decision.

The graph is a navigation/provenance surface, not a calculation authority. Large graphs load incrementally and provide an accessible list fallback.

### 9.6 AI Council

Council UI separates:
- supplied facts/evidence snapshot;
- independent agent outputs;
- disagreements;
- unsupported claims/citation gaps;
- challenge round;
- synthesized advisory output;
- human reviewer decision and rationale.

Forbidden actions are visible as governance policy, not hidden prompt text only.

### 9.7 Visual system

Adopt the strongest cinematic-dashboard ideas while preserving professional density and legibility:
- dark premium default with controlled light/emerald alternatives;
- semantic colors for success/warning/risk/evidence/AI;
- restrained motion, disabled by `prefers-reduced-motion`;
- command palette;
- notifications;
- responsive sheets/drawers;
- safe-area-aware mobile navigation;
- minimum practical touch target 44px;
- no content depends on animation to become visible.

Visual code cannot derive or mutate accounting/audit values.

## 10. AI and standards boundary

### 10.1 Permitted AI work

AI may:
- summarize supplied evidence;
- suggest mappings with confidence and rationale;
- propose risks/assertions/procedures;
- challenge missing evidence;
- draft PBC requests;
- draft workpaper/report narrative;
- compare agent perspectives;
- retrieve and explain verified standards sources;
- flag uncertainty and escalation needs.

### 10.2 Forbidden AI authority

AI may not:
- create authoritative financial amounts;
- post or approve journals/adjustments;
- approve materiality;
- accept evidence automatically;
- close significant risks without human workflow;
- approve final opinion;
- lock archive;
- fabricate paragraph numbers, quotations or standards citations.

### 10.3 Standards data

Standards records preserve authority, jurisdiction, version, issued/effective dates, adoption status, source URL/provenance and last verification time. Exposure drafts and training materials must not be labelled as effective professional authority.

## 11. Deterministic analytics policy

A governed analytics function must expose:
- typed input schema;
- exact amount representation;
- deterministic output;
- method/version identifier;
- validation errors;
- unit/property/golden tests;
- explicit label distinguishing indicator vs conclusion;
- provenance linkage when persisted.

Imported Aurora/Moon demo formulas are never promoted automatically. SKY/KOSIF implementations are candidates only after semantic review and regression tests.

## 12. Security and privacy

Before real multi-user/client data use:
- replace pilot shared access-token security with user identity/session management;
- enforce tenant/engagement scoping server-side;
- deny by default;
- add RBAC/ABAC and separation of duties;
- validate upload MIME/size/content policy;
- prevent IDOR/cross-tenant access;
- protect provider credentials in Worker secrets;
- rate-limit sensitive endpoints;
- record security-relevant decisions without logging secrets or document bodies;
- add backup/restore and disaster-recovery verification for production data.

The public demo mode remains explicitly labelled and must not imply that real client data is present.

## 13. Migration strategy from current SEE

### Phase A — Experience + lifecycle foundation

Deliver first:
- new app shell/navigation and responsive system;
- engagement lifecycle/revision model;
- PBC requests;
- procedures and procedure runs;
- workpapers/review notes;
- evidence links/trace graph foundation;
- analytics center shell using existing deterministic data only;
- reporting center shell;
- AI Council shell with no provider authority;
- additive D1 migration and compatibility API facade.

This phase must preserve the existing deployed TB → Mapping → Materiality → Risk → Evidence → Finding path.

### Phase B — Accounting data depth

- GL/journal ingestion;
- canonical import jobs;
- duplicate/unbalanced/unusual journal indicators;
- reconciliation foundations;
- financial statement snapshots;
- adjustments and adjusted TB.

### Phase C — Audit methodology depth

- assertions;
- significant-risk governance;
- audit programs;
- controls/substantive testing;
- deterministic sampling;
- misstatement aggregation;
- quality/review gates.

### Phase D — Standards and governed AI

- source registry and effective-date engine;
- citation-grounded retrieval;
- AI gateway/provider adapters;
- Council independent/challenge/synthesis workflow;
- AI eval dataset and forbidden-action tests.

### Phase E — Reporting, client collaboration and production hardening

- report versions and exports;
- opinion-support factors;
- archive lock;
- client PBC portal;
- mobile evidence capture/offline queue where justified;
- auth/tenant isolation hardening;
- E2E, accessibility, performance, backup/restore and security verification.

## 14. Testing strategy

### Unit/property tests

Required for:
- money parsing and rounding boundaries;
- TB/journal balancing;
- materiality;
- risk scoring;
- sampling;
- misstatement aggregation;
- analytics;
- state-machine transitions;
- evidence hash/integrity;
- report snapshot rebuildability.

### Integration tests

Required for:
- D1 migrations;
- application command authorization;
- version/revision conflicts;
- idempotent uploads/imports;
- R2 evidence lifecycle;
- evidence-to-finding/workpaper/report lineage;
- cross-engagement isolation.

### AI evaluation tests

Required for:
- citation groundedness;
- unsupported claim handling;
- forbidden actions;
- ambiguity/escalation;
- Council disagreement preservation;
- no AI-derived monetary authority.

### Browser/E2E tests

Critical workflows:
- create engagement → acceptance/planning;
- import TB → validate → map → approve;
- materiality → risk/assertion → procedure;
- PBC → upload evidence → evaluate;
- workpaper → review note → revision/approval;
- finding/misstatement → reporting blockers;
- report review → human approval → archive gate.

Desktop RTL and iPhone-class mobile layouts are release gates. Keyboard navigation, reduced motion and graph fallback are covered.

## 15. Observability and release provenance

Production exposes a safe build/about endpoint containing:
- product version;
- Git commit;
- schema migration version;
- deterministic engine versions;
- standards catalog version/date;
- public-demo/auth configuration flags without secrets.

Every deployment runs:
1. dependency install;
2. unit/property tests;
3. TypeScript checks;
4. production build;
5. migration validation;
6. Wrangler dry-run where feasible;
7. deploy;
8. migrations/resource checks;
9. production health/smoke checks.

## 16. Phase A acceptance criteria

Phase A is complete only when:

- current production MVP capabilities still work;
- the new navigation works on desktop and mobile;
- engagement lifecycle and blocker reasons are server-derived;
- PBC request lifecycle persists in D1;
- procedures can be linked to risks;
- evidence can be linked to procedures/findings/workpapers through persisted edges;
- workpapers support versioned prepare/review states;
- Command Center contains no hard-coded production KPI values;
- analytics presentation cites method/source and uses deterministic results only;
- Council UI cannot approve or mutate protected professional records;
- all mutations create auditable events;
- D1 migration is additive and production-safe;
- CI is green;
- Cloudflare deployment succeeds;
- production smoke checks pass.

## 17. Explicitly deferred from Phase A

These capabilities are part of the long-term target but not prerequisites for the first unified release:
- full multi-office enterprise administration;
- SSO/SCIM;
- continuous-audit streaming feeds;
- realtime voice assistant;
- broad external ERP connectors;
- advanced 3D analytics;
- automatic standards web monitoring;
- full client-side encrypted company vaults;
- provider-specific AI production integration before gateway/evals are ready.

Deferral prevents breadth from outrunning audit correctness again.

## 18. Architectural decisions summary

- SEE remains product authority and deployment surface.
- Cloudflare Worker + D1 + R2 remain the current production runtime.
- Modular monolith first.
- Port capabilities by contract, not by repository merge.
- Additive migrations and compatibility facades protect the existing pilot.
- Deterministic packages are the sole monetary/calculation authority.
- AI and presentation layers are non-authoritative.
- Evidence/provenance/versioning are cross-cutting requirements.
- Phase A prioritizes a complete, visible audit workflow over adding more isolated module names.

## 19. Source provenance for this design

This architecture was derived from the materials supplied in the conversation, chiefly:
- `Moon_AI_Audit_Operating_System_Complete_Master_Specification.pdf`;
- `Moon_Developer_Package_v1.zip` and its extracted architecture/API/test/prompt/deployment documents;
- `sky.json` / SKY repository export;
- `mahmoud1990.json` / KOSIF repository export;
- `aurora-finance.json`;
- `moon.json`;
- `KOSIF_Cinematic_Dashboard.html`;
- `KOSIF_Audit_OS_Standalone.html`;
- the supplied project archives for SKY, Aurora, KOSIF stable/unified/audit-studio and related implementations.

Where source implementations conflict, this design chooses the stricter professional boundary: deterministic accounting, human critical approvals, complete provenance, server-side authorization and versioned history.