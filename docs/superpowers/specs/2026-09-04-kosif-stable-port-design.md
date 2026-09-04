# SEE — KOSIF Stable Capability & Theme Port Design

## Status
Approved design direction. KOSIF Stable (`kosif-audit-studio`) is the visual and capability reference; SEE remains the product, architecture, persistence, authority, and deployment reference.

## Goal
Transform SEE so that it carries the strongest interaction patterns, visual system, deterministic audit engines, professional workflow modules, PWA ergonomics, and knowledge surfaces from KOSIF Stable without importing KOSIF's browser-local state model or creating a second source of truth.

The result must feel recognizably like KOSIF Stable while behaving like a governed SEE application backed by Cloudflare Worker, D1, R2, versioned domain rules, and auditable human gates.

## Non-goals
- Do not replace React with the static KOSIF HTML/JavaScript application.
- Do not copy KOSIF `localStorage` as the authoritative persistence model.
- Do not store evidence files in browser storage.
- Do not allow AI/Council outputs to approve reports, close archive, post accounting entries, or override deterministic engines.
- Do not treat demo values, training sources, or historical standards summaries as current authoritative standards without provenance/version labels.
- Do not duplicate SEE entities when an existing Phase A entity can be extended.

## Product identity
The product remains **SEE — Audit Operating System**. KOSIF is an implementation reference, not a second product name in the UI.

Core message remains: **Evidence before conclusion. Human approval is mandatory.**

## Architecture decision
Use a **Design + Capability Port** approach:

1. Port the KOSIF visual language and interaction model into React components and SEE design tokens.
2. Port deterministic KOSIF engines into typed domain modules under SEE, with tests before integration.
3. Persist engagement-specific decisions, runs, links, and approvals in D1.
4. Persist evidence objects in R2; D1 stores metadata, hashes, links, review state, and provenance.
5. Expose all new behavior through `/api/v1` Worker routes.
6. Keep current compatibility endpoints until migration is complete.
7. Keep AI/Council advisory; server-side gates remain authoritative.

## Experience architecture

### Desktop navigation
SEE desktop will expose the following professional modules, following KOSIF Stable's information architecture:

1. مركز القيادة
2. البيانات والميزان
3. التخطيط والأهمية
4. المخاطر والنتائج
5. فحص قيود اليومية
6. أوراق العمل
7. طلبات المستندات PBC
8. سجل الأدلة
9. المعايير والمصادر
10. الجولات العشر
11. مجلس المراجعين
12. التقارير والتصدير
13. مسارات المعرفة

Desktop uses a fixed purple sidebar, sticky topbar, engagement context, global search/command access, theme control, readiness/gate notifications, and strong state badges.

### Mobile navigation
Mobile keeps five primary groups to avoid a 13-item bottom bar:

1. الرئيسية
2. المراجعة
3. التحليلات
4. المجلس
5. المزيد

The 13 professional modules are reachable as sub-navigation within those five groups. The bottom navigation remains thumb-friendly and persistent.

### Command center
The SEE command center adopts the strongest KOSIF Stable patterns:

- purple/emerald hero surface;
- current engagement and current audit stage;
- readiness ring;
- next governed action;
- explicit blocker/gate list;
- key metrics from server truth only;
- evidence coverage and trace-health indicators;
- journal-review status;
- human-authority status;
- no hard-coded production metrics.

## Design system

### Tokens
Adopt KOSIF Stable's visual family as SEE tokens:

- Light background family near `#f5f3f8`.
- Primary purple family centered around `#5b21b6` / `#4c1d95`.
- Emerald/teal family for positive evidence/readiness states.
- Semantic warning, danger, success, information, and critical tones.
- White/light surfaces, subtle purple-tinted secondary surfaces, clear borders, modest shadows.
- Dark mode with deep plum surfaces and softened purple/emerald accents.

The implementation must use semantic CSS variables/tokens, not hard-coded repeated values across components.

### Components
Create/rework reusable React components for:

- Sidebar navigation and grouped mobile navigation.
- Topbar and engagement picker.
- Hero/readiness ring.
- Metric cards.
- Gate cards and status badges.
- Dense tables with responsive collapse.
- Filter/search bars.
- Drawers/modals.
- Empty states and loading states.
- Evidence/provenance chips.
- Timeline/audit-event rows.
- Printable report panels.

### Accessibility and RTL
- Arabic-first RTL.
- Keyboard-visible focus states.
- Command search shortcut preserved.
- Skip-to-content support.
- Minimum mobile touch target of approximately 44px.
- Meaning must not rely on color alone.

## Capability port map

### 1. Trial Balance / data intake
Port and harden:

- Arabic and Western digit normalization.
- CSV and Excel intake.
- Arabic/English column recognition.
- exact minor-unit parsing using BigInt/integer-safe logic.
- balance validation.
- duplicate/account-direction checks.
- source metadata and import provenance.

Authoritative rows and import metadata live in D1. Browser parsing may be used for preview, but final accepted data is server validated.

### 2. Account classification and standards linkage
Port deterministic classification rules that map account signals to:

- account category;
- normal balance expectation;
- IFRS/IAS references;
- ISA references where applicable;
- assertions;
- expected audit responses/evidence types.

Classification output is an indicator and starting point; user overrides must be explicit, versioned, and auditable.

### 3. Materiality and sampling
Port:

- overall materiality;
- performance materiality;
- trivial threshold;
- deterministic/random/systematic/MUS sampling with reproducible seed metadata.

All monetary calculations must remain integer/minor-unit based. Sampling runs are immutable snapshots.

### 4. Audit risk and responses
Extend current SEE risks with:

- deterministic risk signals;
- human risk response/closure decisions;
- assertion/account linkage;
- procedure linkage;
- standards/provenance linkage.

No risk closes automatically because an indicator score falls below a threshold.

### 5. Journal-entry testing
Add a governed Journal Review module inspired by KOSIF Stable/ISA 240 indicators:

- manual entries;
- period-end/close timing;
- weekend/holiday signals when date context exists;
- rounded amounts;
- unusual/low-frequency users when user metadata exists;
- unusual account combinations;
- filterable review queue;
- human review disposition and rationale.

Signals are indicators only. Reviewed state is a human action.

### 6. Ten audit rounds
Represent the KOSIF ten-round model as a professional operational lens over SEE's lifecycle:

A01 acceptance & independence
A02 entity/environment understanding
A03 materiality
A04 risk assessment
A05 controls/testing
A06 substantive procedures
A07 estimates/judgments
A08 going concern/subsequent events
A09 completion/misstatements
A10 reporting/quality review

Rounds do not replace SEE engagement state transitions. They expose readiness, work coverage, and blockers.

### 7. Workpapers, PBC, findings, evidence
Use current Phase A entities as the base:

- `pbc_requests`
- `procedures`
- `procedure_runs`
- `workpapers`
- `workpaper_versions`
- `review_notes`
- `evidence_links`

Enhance UI and API contracts rather than creating parallel KOSIF copies.

### 8. Evidence Trace
Expand existing Evidence Trace to show professional paths such as:

`account → risk → procedure → run → evidence → workpaper → finding/conclusion`

Trace health is a coverage indicator, not an audit conclusion. Missing links surface as actionable gaps.

### 9. Standards and knowledge
Port KOSIF standards/source metadata into a read-only typed knowledge library with explicit provenance:

- standard/source code;
- title;
- jurisdiction/source family;
- version/effective date;
- current/historical/training/local status;
- source-note metadata.

Engagement usage of a standard is stored in D1 separately from the reference library.

No standards card is presented as a substitute for an official authoritative text.

### 10. Council
Retain SEE Council shell and adopt KOSIF's multi-angle reviewer concept:

- accounting/standards angle;
- audit-methodology angle;
- analytics angle;
- professional-skepticism angle.

Council runs operate on a captured evidence snapshot and can recommend/challenge/synthesize. Human review is required before any governed decision. Council cannot approve a report or archive.

### 11. Reporting and export
Port KOSIF's strong reporting surface into SEE:

- printable report workspace;
- versioned report drafts;
- readiness snapshot per version;
- human partner approval gate;
- controlled JSON/CSV export;
- archive snapshot only after all closure gates.

PDF generation may initially use browser print styles. Server-generated PDF is a later enhancement unless required by a specific workflow.

### 12. PWA
Add SEE manifest/service worker behavior inspired by KOSIF:

- Arabic/RTL metadata;
- standalone display;
- SEE icons/theme color;
- shortcuts to key modules;
- app-shell/static-asset caching only by default.

Do not cache authenticated API responses, evidence files, or confidential engagement payloads offline unless a later encrypted-offline design is explicitly approved.

## Data model additions
Phase A schema is preserved. Add additive migrations for the missing KOSIF-derived governed state:

### `journal_entries`
Stores imported journal rows and source provenance where journal datasets are provided.

### `journal_review_runs`
Immutable analysis-run metadata: source version, deterministic engine version, run timestamp, filters/parameters, counts.

### `journal_review_items`
Signal/result rows linked to a run, with indicator codes and deterministic rationale.

### `journal_review_decisions`
Human disposition, rationale, reviewer, timestamp for flagged journal items.

### `sampling_runs`
Population source, method, seed, parameters, selected IDs, engine version, created_by, created_at.

### `risk_responses`
Human response type, rationale, owner, status, linked procedure/evidence references, closure actor/timestamp.

### `round_decisions`
Engagement + round code + status + human rationale + actor + updated_at. This records operational round state without replacing engagement lifecycle status.

### `standard_usages`
Engagement-scoped provenance record linking a standard/source/version to a risk, procedure, workpaper, finding, or report section.

All new tables use engagement IDs, immutable/versioned records where appropriate, and indexes for engagement/status lookup.

## API design
Add `/api/v1` resources with predictable nouns and governed actions:

- `/engagements/:id/command-center`
- `/engagements/:id/trial-balance`
- `/engagements/:id/classification`
- `/engagements/:id/materiality`
- `/engagements/:id/sampling-runs`
- `/engagements/:id/journal-review`
- `/engagements/:id/risk-responses`
- `/engagements/:id/rounds`
- `/engagements/:id/standards-usage`
- existing PBC/procedure/workpaper/evidence/council/report resources remain and are expanded only as needed.

Mutation routes require actor metadata appropriate to the current pilot authority model and must create append-only audit events.

## Deterministic engine policy
Port KOSIF logic into focused TypeScript modules. Avoid a single giant `engine.ts`.

Suggested modules:

- `money.ts`
- `text-normalization.ts`
- `tb-analysis.ts`
- `classification.ts`
- `materiality.ts`
- `sampling.ts`
- `journal-signals.ts`
- `risk-signals.ts`
- `rounds.ts`
- `trace-health.ts`
- `standards.ts`

Every deterministic output carries engine/version metadata where persisted.

## Authority boundaries
Server-side rules remain authoritative:

- AI may recommend, summarize, challenge, or draft.
- AI may not approve audit opinions.
- AI may not close high risks.
- AI may not clear review notes.
- AI may not approve report versions.
- AI may not archive an engagement.
- AI may not post accounting entries.
- deterministic indicators never equal professional conclusions.

## Error handling
- Validation errors return structured codes and human-readable Arabic messages.
- Gate violations return conflict/blocked responses with blocker codes.
- Import errors identify row/column context without silently dropping data.
- Large import limits are explicit.
- R2 upload/download errors do not create a false evidence-complete state.
- UI uses retryable states and never substitutes mock production data when an API fails.

## Testing strategy

### Domain tests
Test at minimum:

- Arabic/Western money parsing.
- balanced/unbalanced TB.
- classification determinism.
- materiality determinism.
- sampling reproducibility.
- journal indicator determinism.
- round readiness logic.
- trace-health gap detection.
- human-only closure/approval gates.

### Migration tests
Apply all D1 migrations locally in CI.

### API contract tests
Cover the new `/api/v1` resources and blocked transitions.

### UI/build checks
Typecheck and production build on every push/PR.

### Release checks
Production deployment runs tests/typecheck/build, applies migrations, performs final deploy, and checks a health endpoint before success is declared.

## Delivery sequence

### Port Wave 1 — Visual system + navigation
- KOSIF visual tokens in SEE.
- desktop 13-module sidebar.
- mobile five-group navigation.
- KOSIF-style topbar/search/theme.
- command-center hero/readiness ring.
- reusable cards/tables/status components.

### Port Wave 2 — Deterministic core
- text/money normalization.
- TB import hardening.
- classification.
- materiality refinements.
- sampling.
- tests.

### Port Wave 3 — Journal review + rounds
- migrations.
- journal engine/API/UI.
- round model/API/UI.
- human review decisions.

### Port Wave 4 — Evidence/standards/knowledge depth
- trace expansion.
- standards reference library.
- standard usage provenance.
- knowledge surfaces.

### Port Wave 5 — Council/report/PWA polish
- Council UX parity.
- report/export workspace.
- PWA manifest/service worker.
- print styles.
- final mobile/accessibility pass.

Each wave must leave the branch buildable and testable. No wave is merged to `main` until CI is green.

## Compatibility and migration
- Existing MVP and Phase A data remain valid.
- New migrations are additive.
- Existing `/api` compatibility paths remain until new screens use `/api/v1` equivalents.
- KOSIF browser-local data is not automatically imported into production SEE. A deliberate import/export migration tool can be designed later if needed.

## Security and privacy
- Evidence remains in R2 with D1 metadata/hash.
- No API token or provider secret is embedded in the client.
- Service worker does not cache sensitive API/evidence content.
- Public demo mode remains clearly separated from real engagement use.
- Before real audit data, server access protection must be enabled and public-demo policy reviewed.

## Acceptance criteria
The port is successful when:

1. SEE visually matches the KOSIF Stable design language in light and dark mode while retaining SEE branding.
2. Desktop exposes the 13 KOSIF-derived professional modules; mobile exposes five grouped destinations with complete reachability.
3. Command center shows server-derived readiness, blockers, next action, evidence/trace and journal indicators.
4. KOSIF-derived monetary and sampling logic runs as tested deterministic TypeScript modules.
5. Journal review supports flagged indicators plus human dispositions.
6. Ten audit rounds are visible and governed without replacing engagement lifecycle.
7. Evidence Trace spans account/risk/procedure/evidence/workpaper/conclusion paths where data exists.
8. Standards/knowledge records are version/provenance labeled.
9. Council remains advisory and report/archive gates remain human-only.
10. D1/R2 remain the source of truth; no engagement state depends on KOSIF localStorage.
11. PWA installs without caching confidential API/evidence payloads.
12. Tests, migration validation, typecheck, build, and release health check pass before merge/deploy.
