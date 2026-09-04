# SEE Cloudflare deployment

The pilot is deployed as one Cloudflare Worker with static React assets, a D1 database, and an R2 bucket.

## Automatic deployment from GitHub

Add these repository Actions secrets:

- `CLOUDFLARE_API_TOKEN` — a Cloudflare API token allowed to deploy Workers and manage the bound D1/R2 resources.
- `CLOUDFLARE_ACCOUNT_ID` — the target Cloudflare account ID.
- `SEE_APP_ACCESS_TOKEN` — optional but strongly recommended. When set, every API route except `/api/health` requires `Authorization: Bearer <token>`.

Push or merge to `main`. The workflow will verify tests/typecheck/build, deploy once to auto-provision D1/R2, apply D1 migrations, configure the optional application token, and deploy the migrated build.

## Local verification

```bash
npm install
npm test
npm run typecheck
npm run build
cd apps/cloudflare
npx wrangler dev
```

## Pilot security note

`ALLOW_PUBLIC_DEMO` is enabled in the checked-in Wrangler configuration so a first deployment is demonstrable before an application access token is configured. Do not use real client data in that mode. Set `SEE_APP_ACCESS_TOKEN` in GitHub before a real pilot.

## Data behavior

- Trial-balance imports are append-safe at the engagement level: the pilot refuses replacement after the first import.
- Mapping approvals create versioned records; approved mappings are not silently edited.
- Materiality and risk calculations are deterministic and versioned.
- Evidence objects are stored in R2 with SHA-256 recorded in D1.
- Audit events are appended for material workflow actions.
- SEE does not autonomously issue a statutory audit opinion.
