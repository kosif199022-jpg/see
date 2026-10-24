# KOSIF SEE → KOSIF C Video Fetch: operational routing (experimental)

**Status:** draft integration for review; not installed in the published KOSIF SEE ChatGPT plugin. The experimental branch was independently verified with a public TikTok and a CC0 sample.

## Trigger
- User explicitly asks to **download / send / retrieve** a video from an HTTPS URL.
- Do not hijack an unrelated request to analyze, translate, summarize, generate, edit, or cite a link.
- Ask for clarification only when the action matters and the intent is genuinely ambiguous.

## Existing authorized executor
- Job repository: `kosif199022-jpg/see`
- Test branch: `main`
- Job file: `video_jobs/<unique-lowercase-id>.json`
- Contents: `{"url":"https://public.example/video"}` and **no extra keys**
- Workflow: `.github/workflows/kosif-c-video-fetch.yml`
- Script: `tools/cloud_video/fetch.py`
- Job isolation: `tools/cloud_video/select_job.py` confirms the triggering `GITHUB_SHA`, fetches depth 2, and selects exactly one file changed in that commit. A shallow history previously caused selection of the wrong URL; do not regress to the original command.

## Execution through ChatGPT tools
1. Confirm the user requests a public video, and the source does not require credentials, payment, DRM circumvention, or unauthorized access.
2. Warn that the **source URL and filename will appear in a public Git repository and commit**; for private/signed links use a private backend only after proper authorization, never this prototype.
3. Check that a GitHub connector with permission to the intended repository is exposed. Do not assume connection because instructions mention a tool.
4. Create **one** unique job JSON on the test branch via GitHub create_file (avoid overwriting existing paths), then collect the resulting commit SHA.
5. Find the matching workflow run for that **exact commit SHA**, not just the latest workflow by timestamp.
6. Check final run/job conclusion and step receipts. If failure, isolate the error (network, extractor, invalid URL, duration/file size, artifact upload); no silent substitution.
7. Fetch the artifact for that exact run, download it, extract `KOSIF-C-Video.mp4` and `KOSIF-C-Video-receipt.json` inside the current authorized container.
8. Run `ffprobe`, hash the MP4 and compare to receipt SHA-256, verify duration, H.264/AAC as applicable, and ensure byte-size is within the configured limit.
9. Share a sandbox link **only if the MP4 exists at the exact path in the active runtime**. If only a GitHub artifact reference is available, use a real GitHub link; never invent a sandbox path.

## Security / cost / source integrity
- Public HTTPS only; block RFC1918/private/localhost/multicast/reserved addresses, unusual ports and userinfo. `yt-dlp` follows source behavior; treat redirections and DNS re-binding as a threat and consider provider allowlisting for production.
- Never copy user cookies, passwords, bot credentials, signed URLs, or private videos to a public repo.
- Do not execute arbitrary user-supplied shell/Python code as a render job. Allowlisted JSON-only jobs.
- Enforce bounded duration (<= 900s) and size (<= 150MB); host/extractor/YouTube/TikTok availability may change.
- Respect rights and terms. Do not bypass login or DRM.
- Free GitHub Actions for public standard runner use has fair use and provider-specific limits; check current plan policies before assuming cost zero.

## Routing truth
- KOSIF SEE: intent routing and capability reporting only until host GitHub tools are verified as exposed.
- KOSIF Montage & Motion v5.6: documented skill + portable fetch script, **not a persistent always-on download backend**.
- GitHub Actions: job execution, media encodes, run logs and artifacts.
- Local/container tool: final QA and user-file delivery.
- Full Pro: independent reasoning capability and **not required for downloading**; do not claim it ran.
- TinyFish: optional browser inspection, not a download or FFmpeg worker.

## Acceptance tests
- Positive: permitted public TikTok URL -> exact job file selected -> MP4, receipt, H.264/AAC -> user link.
- No-trigger: user requests summary only -> no GitHub job.
- Security: non-HTTPS, localhost/private DNS, user:password URL, custom port -> reject.
- Reconciliation: downloaded video's source host and the requested TikTok redirect path match.
- Integrity: malicious or stale media artifact -> reject hash mismatch.
- Tool missing: report blocked and explain next step, never claim execution.
- Drift: if main/branch/workflow moves, re-probe files and current run state before claiming operational.
