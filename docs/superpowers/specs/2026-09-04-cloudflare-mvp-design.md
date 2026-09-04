# SEE Cloudflare MVP Design

## Goal
Ship a production-shaped pilot of SEE on Cloudflare Workers while preserving the repository's audit principles: deterministic calculations, traceability, human approval, and no silent mutation.

## Scope
This delivery is a vertical audit slice, not a claim that the full 3,380-hour roadmap is complete. It covers engagement creation, trial-balance ingestion, validation, account mapping and approval, materiality, risk assessment, evidence registration, findings, and a controlled report summary.

## Architecture
- React + Vite Arabic RTL SPA.
- Cloudflare Worker for `/api/*` routes.
- Cloudflare D1 for persistence.
- Wrangler migrations for schema changes.
- Deterministic audit functions for financial calculations and scoring.
- Human approval endpoints for mapping and critical conclusions.
- GitHub Actions for test/build and opt-in deployment when Cloudflare secrets are configured.

## Data model
D1 tables: engagements, trial_balance_lines, account_mappings, materiality_assessments, risks, evidence, findings, audit_events.

## Safety and auditability
- Monetary values stored as integer minor units where practical.
- Approved mappings are versioned by inserting a new audit event; edits never erase history.
- Risk scoring remains deterministic and exposes rationale.
- Report output is a structured summary; it does not autonomously issue a statutory audit opinion.

## Testing
Vitest covers deterministic engines and API helpers. CI runs typecheck, tests, and build. Cloudflare deployment is gated on `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets.
