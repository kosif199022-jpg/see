# SEE — Advanced Financial Audit Operating System

SEE is a traceable, AI-assisted financial audit workspace. It is designed as a professional audit operating system rather than a chat application.

## Architecture principles

- Evidence before conclusion
- Human approval for critical professional judgments
- Deterministic financial calculations
- Full provenance and version tracking
- No silent mutation of approved records
- AI remains advisory unless an explicitly authorized human gate is satisfied

## Phase A — unified governed pilot

Phase A establishes the first end-to-end operating layer while preserving the existing pilot API. It includes:

- Five-workspace Arabic RTL shell: Command Center, Audit, Analytics, AI Council, and More
- Engagement lifecycle with recorded revisions and guarded transitions
- Trial Balance ingestion and deterministic balance validation
- Human-approved account mapping and materiality workflows
- Risk assessment, PBC requests, procedures, procedure runs, workpapers, and review notes
- Evidence storage in R2 with SHA-256 metadata in D1
- Evidence trace links and an accessible trace graph foundation
- Deterministic readiness and analytics projections with explicit method/version labels
- Versioned report shell with readiness snapshots and Partner-only approval gate
- Governed AI Council shell with evidence metadata snapshots and human-review gates
- Append-only audit events for professional workflow actions
- Additive D1 migrations; legacy `/api/...` routes remain available alongside `/api/v1/...`

### AI Council boundary

The Phase A Council is a governance and workflow shell. It does **not** call an external model provider and does **not** have authority to approve materiality, post entries, issue a statutory audit opinion, approve adjustments, or lock the archive. A human reviewer is required for the `human_reviewed` state and must record a decision and rationale.

### Capabilities intentionally deferred

Provider-routed AI execution, standards RAG, full GL/reconciliation engines, tenant identity/RBAC expansion, client portal workflows, offline capture, advanced analytics, and final archive-lock infrastructure remain later-phase work. The UI labels those areas as future capabilities instead of presenting synthetic results.

## Demo versus real data

`/api/demo` creates clearly labelled demonstration records, including a PBC request, procedure/run, draft workpaper, open review note, evidence link, and a prepared Council run. The demo deliberately does **not** seed an approved report or archived engagement.

The public pilot configuration may allow demo creation. **Do not upload real client data until access controls are configured for the deployment.** Set the Cloudflare Worker secret `APP_ACCESS_TOKEN` (the deploy workflow reads it from the GitHub Actions secret `SEE_APP_ACCESS_TOKEN`) and apply the organization-specific access, retention, and authorization controls required for real audit data.

## Local verification

From the repository root:

```bash
npm install
npm --workspace @see/cloudflare run db:check
npm test
npm run typecheck
npm run build
```

For local Cloudflare development:

```bash
npm --workspace @see/cloudflare run dev
```

`db:check` applies all D1 migrations to the local Wrangler database so SQL changes are validated before production deployment.

## Production deployment

The production workflow runs only from `main` (or manual dispatch). It verifies tests/typecheck/build, ensures the R2 evidence bucket, deploys resource bindings, applies D1 migrations remotely, performs a final deploy, and checks `/api/health` on the production Worker.

Current Worker target: `https://see-audit.kosif199022.workers.dev`.

## Source selection

This repository is a clean implementation baseline. Features are selected and redesigned from previous audit projects rather than copied blindly.
