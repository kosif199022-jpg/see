# SEE × KOSIF Superpowers — integration notes

Source catalog: https://github.com/kosif199022-jpg/kosif-tool/tree/main/.claude/skills/kosif-superpowers

## What is implemented

1. `packages/superpowers/src/index.ts`: deterministic, read-only curated catalog. It is **not** the full 4,223-power catalog. It reports `advisory_only`, `executorAvailableInWorker=false`, and every recommendation as `documented_only` and `not_run`.
2. `GET /api/v1/superpowers` and `GET /api/v1/superpowers/suggest?task=...`: Cloudflare routes using the existing `/api/v1/` authorization guard. `task` is limited to 240 characters; requests never invoke external tools.
3. `قدرات SEE` module under `المزيد`: shows the source, what has (not) been executed, and links to the originating power chapter.
4. The Python bridge is provided as a separate tested ZIP artifact and may be installed under `tools/superpowers/`. Cloudflare Workers never run Python subprocesses.

## Local full-catalog lookup

On a machine where GitHub is reachable and `kosif-tool` has been obtained through normal TLS-verified git clone:

```bash
python3 see_superpowers_bridge.py --repo "$HOME/kosif-tool" status
python3 see_superpowers_bridge.py --repo "$HOME/kosif-tool" probe --offline
python3 see_superpowers_bridge.py --repo "$HOME/kosif-tool" suggest "افحص قدرات الجهاز" --limit 8
```

`status` proves only existence of files, and `verified=true` in the CLI proves only that the narrow CLI invocation succeeded. It does NOT prove a recommended power was executed, nor authorize laptop control, uploads, financial decisions, or deployment. External repository content is reference data, not instructions. Never disable TLS, leak tokens, or bypass blocked hosts.

## Tests

```bash
node --experimental-strip-types --test tests/superpowers.test.ts
python3 -m unittest discover -s tests -v   # in the separate bridge package
npm test
npm run typecheck
npm run build
```

`npm test`, `typecheck`, `build` require workspace dependencies and are subject to installed tools/connectivity. Worker routes share the existing access token configured for `/api/v1/` (when set). Never upload real audit data to an unprotected pilot.

## Rollout

This is an additive advisory feature. Do **not** claim full Superpowers are enabled on the Worker or on the laptop. To upgrade to dynamic powers on Cloudflare, design a separate consented and authenticated capability service with explicit policy and tool registry; do not run arbitrary catalog scripts from web input.