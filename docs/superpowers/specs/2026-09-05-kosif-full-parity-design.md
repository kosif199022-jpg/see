# SEE — KOSIF Stable Full Capability Parity Design

## Status
Approved architectural direction pending written-spec review.

## Context
SEE already carries the first governed KOSIF port: KOSIF-derived visual language, 13 desktop professional modules, five mobile groups, Journal Review, A01–A10 rounds, deterministic sampling, standards provenance foundations, Review Notes, safe PWA shell, and server-derived command-center metrics.

The remaining goal is **100% capability parity with KOSIF Stable (`kosif-audit-studio`) where a capability is evidenced by the reference repository/source tests**, while keeping SEE as the sole product, runtime, persistence model, authority model, and deployment target.

KOSIF Stable remains a capability and interaction reference. SEE remains React + Cloudflare Worker + D1 + R2 with server-side authority gates and append-only professional state.

## Goal
Close every material feature gap between KOSIF Stable and SEE through a governed parity port rather than a literal copy.

Parity means the strongest supported KOSIF behaviors are available natively in SEE, with tests that demonstrate equivalent professional behavior while preserving stronger SEE governance.

## Non-goals
- Do not copy KOSIF `localStorage` as an authoritative data store.
- Do not replace SEE React UI with the static KOSIF HTML/JavaScript application.
- Do not create parallel KOSIF tables when an existing SEE entity can be extended.
- Do not grant AI, Council, or deterministic engines authority to approve reports, post entries, clear review notes, close high risks, approve materiality, or archive engagements.
- Do not treat training, historical, or local reference cards as current authoritative standards without provenance/status labels.
- Do not claim parity for a KOSIF behavior that cannot be supported from the reference source, tests, or documented application behavior.

## Architectural decision
Use a **Governed Parity Port**.

1. Build a parity matrix from the KOSIF reference implementation and tests.
2. Classify each capability as `complete`, `partial`, `missing`, or `intentionally-different`.
3. Port only missing/partial behavior into focused TypeScript domain/engine modules.
4. Keep D1 as the authoritative engagement-state store and R2 as the evidence-object store.
5. Expose mutations through `/api/v1` and record actor/role/rationale plus append-only audit events.
6. Implement UI parity as React surfaces using SEE navigation and design tokens.
7. Add parity tests before each capability is marked complete.
8. Preserve intentionally different SEE behavior where it strengthens governance or security.

## Parity contract
A capability is `complete` only when:

- its deterministic behavior is covered by tests;
- its persisted state is governed by D1/R2 rather than browser-local authority;
- any human decision is represented explicitly and auditable;
- the relevant UI is reachable from the existing 13-module information architecture;
- the production build remains green;
- no capability bypasses SEE authority boundaries.

### Parity status meanings
- `complete`: user-visible and tested native SEE behavior exists.
- `partial`: some behavior exists, but one or more KOSIF-supported behaviors are still absent.
- `missing`: the reference behavior is absent from SEE.
- `intentionally-different`: SEE provides an equivalent or stronger governed behavior by design.

## Capability scope

### 1. Trial Balance and data intake
Complete parity requires:

- CSV and XLSX import;
- Arabic and English column recognition;
- Arabic and Western digit normalization;
- exact minor-unit parsing;
- debit/credit balance validation;
- duplicate-account checks;
- abnormal direction checks;
- import preview and final server validation;
- source provenance, source hash, parser/engine version, sheet selection, and accepted column mapping.

Browser parsing may be used for preview. Accepted rows and accepted import metadata must be persisted and validated server-side.

### 2. Deterministic 5000-account demo
Replace the current account-name-only enterprise demo behavior with a deterministic, actually balanced trial-balance dataset that mirrors the reference intent:

- default 5000 accounts;
- fixed seed support;
- exact debits/credits;
- zero imbalance;
- repeatable output for the same seed;
- realistic account categories/signals sufficient to exercise downstream classification, risks, sampling, and reporting.

The demo must remain clearly labeled and may not create an approved report or archive automatically.

### 3. Materiality parity
Extend materiality from a single amount to a versioned three-threshold model:

- overall materiality;
- performance materiality;
- trivial/misstatement threshold;
- benchmark type;
- risk profile;
- deterministic policy/version metadata;
- immutable revisions;
- supersession links;
- reviewer rationale and human approval.

Materiality calculations remain integer/minor-unit based.

### 4. Risk signal engine
Add deterministic, explainable signals evidenced by KOSIF reference behavior, including at minimum:

- suspense accounts;
- related parties;
- round amounts;
- unusual balance direction where supported;
- ECL/credit-loss indicators;
- inventory indicators;
- revenue indicators;
- estimate/judgment indicators;
- unusual/manual/period-end journal signals already carried by Journal Review.

Signals are indicators only. A signal does not become a professional conclusion and does not auto-close a risk.

### 5. Evidence quality
Add immutable evidence-quality assessments using objective metadata such as:

- source type/independence;
- whether obtained directly;
- review status;
- document date;
- SHA-256 availability;
- risk linkage;
- workpaper/procedure linkage;
- resulting quality score/grade;
- explicit gaps and rationale;
- engine version and assessment timestamp.

The score is a coverage/quality indicator only, not a sufficiency conclusion.

### 6. Evidence trace health
Extend trace health to detect and expose:

- risks without procedures;
- risks without evidence;
- evidence without risk linkage;
- evidence without workpaper/procedure linkage;
- incomplete paths;
- covered paths such as `account → risk → procedure → run → evidence → workpaper → finding/conclusion`.

Trace health must never be presented as an audit opinion or proof that sufficient appropriate audit evidence exists.

### 7. Tamper-evident audit event integrity
Enhance current `audit_events` with a server-side hash chain.

The chain must:

- assign a deterministic sequence;
- include `previous_hash` and `event_hash`;
- hash canonical event content including engagement/entity/action/payload/actor/timestamp;
- store the hash algorithm/version;
- support verification from chain root to latest event;
- fail verification if a historical event is altered;
- support safe backfill for existing events before integrity becomes an archive prerequisite.

This is a tamper-evidence mechanism, not a digital signature or external notarization service.

### 8. Standards source registry and IFRS for SMEs
Expand the typed standards registry to include:

- source ID;
- source family;
- title;
- jurisdiction;
- version;
- effective date;
- license/source-use metadata;
- current/historical/training/local/adopted/transition status;
- source note/provenance.

Add searchable IFRS for SMEs Sections 1–10 cards with source/version/effective-date metadata and an eligibility-oriented reference surface.

Reference cards remain explanatory aids and do not replace official texts.

### 9. Knowledge paths
Expose searchable knowledge paths based on the professional chain:

`transaction trigger → standard → accounting judgment → audit risk → procedure → evidence → result → report`

Reference-path definitions may be typed/read-only. Engagement-specific usage continues to be stored through existing governed entities and `standard_usages`.

### 10. Reporting and controlled export
Complete reporting parity with:

- printable report workspace;
- browser-print/PDF flow;
- versioned report drafts;
- readiness snapshot per version;
- controlled JSON export;
- controlled CSV export where appropriate;
- export manifest/provenance;
- final archive snapshot only after closure gates and human approval.

No export flow may bypass report/archive authority gates.

### 11. UX parity
Retain the implemented KOSIF-derived SEE shell and complete interaction parity where still absent:

- global search/filter patterns;
- dense professional tables;
- responsive cards/panels;
- evidence/provenance chips;
- clear loading/empty/error states;
- keyboard-visible focus;
- Arabic-first RTL;
- light/dark design tokens;
- installable PWA shell with no confidential API/evidence caching.

## Data model and migration design
Create additive migration `0004_kosif_full_parity.sql`.

No current tables are deleted or renamed.

### `trial_balance_imports`
Stores accepted import metadata:

- `id`
- `engagement_id`
- `source_name`
- `source_kind` (`csv`/`xlsx`)
- `source_sha256`
- `sheet_name`
- `column_mapping_json`
- `parser_version`
- `engine_version`
- `accepted_by`
- `accepted_at`
- `created_at`

Existing trial-balance lines are extended with an optional `import_id` reference.

### Materiality extension
Extend `materiality_assessments` with fields equivalent to:

- `benchmark_type`
- `performance_minor`
- `trivial_minor`
- `risk_profile`
- `engine_version`
- `supersedes_id`
- `approved_by`

A changed assessment creates a new revision rather than mutating prior professional history.

### `risk_signal_runs`
Stores deterministic analysis-run metadata:

- engagement;
- engine version;
- source/version context;
- parameters;
- created_by/created_at.

### `risk_signals`
Stores signal rows:

- engagement/run;
- account/target identifiers;
- signal code;
- severity/weight metadata;
- deterministic rationale;
- standards/assertion references when applicable;
- created_at.

Professional `risks` remain separate governed judgments.

### `evidence_quality_assessments`
Stores immutable evidence-quality snapshots:

- evidence ID;
- score;
- grade;
- source type;
- obtained-directly flag;
- document date;
- review status snapshot;
- risk/workpaper/procedure linkage snapshot;
- gaps JSON;
- engine version;
- actor/created_at.

### `audit_event_chain`
Stores chain metadata for existing `audit_events`:

- engagement;
- sequence;
- event ID;
- previous hash;
- event hash;
- algorithm/version;
- computed_at.

Historical events receive an explicit backfill operation. Archive integrity may only depend on the chain after successful backfill/verification.

### `archive_snapshots`
Stores immutable final closure snapshots:

- engagement;
- report version;
- readiness snapshot JSON;
- trace summary JSON;
- audit-chain root/latest hash;
- export manifest JSON;
- approved_by;
- approved_at;
- created_at.

Creation is blocked unless all archive prerequisites and human authority checks pass.

## Standards storage rule
Do not duplicate the static reference catalogue into D1 by default.

The reference catalogue remains typed/read-only source-controlled data. Engagement-specific professional usage stays in `standard_usages`, which already exists.

## Original-file retention rule
CSV/XLSX import does not require retaining the original file in browser storage.

If the user explicitly elects to retain the source file, it may be placed in R2 with D1 provenance metadata. Otherwise SEE stores the accepted rows plus source hash/import metadata only.

## API design
All parity behavior uses `/api/v1`.

### Data import
- `GET /engagements/:id/trial-balance/imports`
- `POST /engagements/:id/trial-balance/imports/preview`
- `POST /engagements/:id/trial-balance/imports`

Final acceptance is server validated.

### Materiality
- `GET /engagements/:id/materiality/revisions`
- `POST /engagements/:id/materiality/revisions`
- governed approval action for a specific revision.

### Risk signals
- `GET /engagements/:id/risk-signals`
- `POST /engagements/:id/risk-signals/runs`

Risk creation/response remains a separate professional action.

### Evidence quality
- `GET /engagements/:id/evidence/:evidenceId/quality-assessments`
- `POST /engagements/:id/evidence/:evidenceId/quality-assessments`

### Event integrity
- `GET /engagements/:id/audit-events/integrity`
- controlled backfill/repair route only where operationally required and never as silent mutation.

### Standards and knowledge
- `GET /standards`
- `GET /knowledge-paths`
- existing engagement-scoped `standard-usages` remains the mutation surface for professional usage.

### Reporting/export/archive
- `POST /engagements/:id/exports`
- `GET /engagements/:id/exports/:exportId` where persisted metadata is required;
- `POST /engagements/:id/archive-snapshots` behind human-only archive gates.

## Mutation governance
Every professional mutation records actor metadata appropriate to the current pilot model.

Human-sensitive actions require actor + role + rationale where applicable.

AI/Council cannot:

- approve materiality;
- close high risks;
- clear review notes;
- approve report versions;
- create/approve archive snapshots;
- post accounting entries;
- claim a statutory audit opinion.

## Error handling
- Import errors identify source row/column/sheet where possible.
- Unsupported/ambiguous XLSX structures fail explicitly rather than silently dropping data.
- Large import limits are explicit.
- Validation and gate responses use stable codes plus Arabic messages.
- Evidence-quality failures never mark evidence as complete.
- Audit-chain verification failure is surfaced prominently and blocks archive when integrity is required.
- API failures never substitute fake production values.

## Testing strategy
Use TDD for every new capability.

### Parity tests
Add a dedicated parity suite proving KOSIF-evidenced behavior, including at minimum:

- Arabic/Western money parsing remains exact;
- CSV Arabic headers;
- XLSX import with Arabic/English columns;
- deterministic 5000-account balanced demo;
- overall/performance/trivial materiality;
- risk-sensitive materiality policy;
- suspense/related-party and other deterministic risk indicators;
- repeatable random/systematic/MUS sampling remains intact;
- journal review behavior remains intact;
- evidence-quality scoring and gap reporting;
- evidence graph orphan/coverage metrics;
- tamper detection for changed historical event payloads;
- immutable materiality revisions;
- versioned/license-aware standards sources;
- IFRS SME Sections 1–10;
- archive blocked without human approval and valid chain.

### Migration tests
CI applies `0001` through `0004` locally.

Migration tests must cover legacy rows so additive columns/backfill behavior are proven safe.

### API contract tests
Cover new `/api/v1` resources, actor/rationale requirements, authority blockers, import validation, chain integrity responses, and archive-gate failures.

### UI/build tests
- navigation reachability;
- professional surfaces display real server state;
- no confidential PWA caching regression;
- typecheck;
- production build.

### Release verification
Production deployment must:

1. install dependencies;
2. run all tests;
3. typecheck;
4. build;
5. verify R2;
6. deploy Worker/assets;
7. apply D1 migrations remotely;
8. perform final deploy;
9. pass `/api/health` before success is declared.

## Delivery waves

### Wave 0 — Parity matrix and baseline
- Add machine-readable/documented parity matrix.
- Verify current `main` baseline is green.
- Mark already-complete capabilities instead of rebuilding them.

### Wave 1 — Data intake and demo parity
- XLSX/CSV importer abstraction.
- bilingual column mapping.
- import provenance.
- deterministic balanced 5000-account demo.

### Wave 2 — Materiality and risk parity
- three-threshold materiality revisions.
- risk profile policy.
- expanded deterministic risk signals.
- D1/API/UI integration.

### Wave 3 — Evidence quality and integrity
- evidence-quality engine.
- trace-health enhancements.
- audit-event hash chain and backfill.
- integrity UI and archive blocker.

### Wave 4 — Standards and knowledge depth
- source/version/license registry.
- IFRS SME 1–10.
- eligibility/reference surface.
- searchable knowledge paths.

### Wave 5 — Reporting/export/archive parity
- print/PDF surface.
- JSON/CSV exports.
- export manifest.
- immutable archive snapshot.
- final mobile/accessibility review.

Each wave must leave CI green before the next wave is merged.

## Compatibility
- Existing Phase A/KOSIF-port data remains valid.
- Existing `/api` compatibility endpoints remain until current screens no longer depend on them.
- New parity APIs use `/api/v1`.
- No automatic import of old KOSIF `localStorage` data is included.
- Browser-local KOSIF state is not authoritative.

## Security and privacy
- D1 remains authoritative for professional metadata/state.
- R2 remains the evidence/source-object store when retention is explicitly used.
- No secrets are embedded in the client.
- Service worker continues to bypass authenticated API and evidence payloads.
- Public demo mode remains separate from real client use.
- Real client data must not be used until deployment access controls are configured.

## Intentionally different behavior from KOSIF Stable
These differences are considered successful parity because SEE is more governed:

- D1/R2 replaces KOSIF browser-local authority.
- server-side audit-event hash chain replaces a local-only chain.
- evidence files may be retained in governed R2 rather than browser-local metadata only, subject to explicit retention policy.
- archive/report/materiality/review-note/high-risk approvals remain server-gated human actions.
- PWA never caches confidential API/evidence responses by default.

## Acceptance criteria
Full parity is achieved when:

1. A parity matrix shows no unexplained `missing` capability supported by the KOSIF reference repository/tests.
2. CSV and XLSX imports support bilingual columns and accepted-import provenance.
3. The default demo can generate a deterministic, exactly balanced 5000-account dataset.
4. Materiality supports overall, performance, and trivial thresholds with immutable versions and human approval.
5. Deterministic risk signals cover the KOSIF-evidenced risk families without auto-closing professional risks.
6. Evidence quality produces transparent scores/grades/gaps while remaining an indicator only.
7. Trace health identifies risk/evidence/procedure/workpaper coverage gaps and orphan evidence.
8. Historical audit-event mutation is detectable through a server-side hash chain.
9. Standards sources are version/effective-date/jurisdiction/license/status labeled and IFRS SME Sections 1–10 are searchable.
10. Knowledge paths expose the transaction-to-report professional chain.
11. Reporting supports print/PDF, controlled JSON/CSV export, and a human-gated immutable archive snapshot.
12. Existing Journal Review, A01–A10, sampling, Review Notes, Council, command-center metrics, 13-module navigation, RTL/light-dark theme, and safe PWA remain functional.
13. D1/R2 remain the sole professional source of truth.
14. AI remains advisory and cannot perform governed human approvals.
15. All migrations, parity tests, API tests, typecheck, build, Cloudflare deployment, remote D1 migration, and production health checks pass before release is declared complete.
