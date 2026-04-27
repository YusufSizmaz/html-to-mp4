# Security Policy

`html → mp4` is a free, open-source project — but that doesn't mean security
gets a backseat. Because the service spawns headless browsers and shells out
to FFmpeg, the threat surface deserves careful attention. We take reports
from anyone, regardless of whether you're a paying customer (you aren't —
the project is free), a hobbyist, or a security researcher.

## Reporting a vulnerability

**Please do not open a public GitHub issue for security problems.**

Instead, email the maintainers at **security@codynlab.dev** with:

- A clear description of the issue and its impact.
- Reproduction steps or a proof-of-concept (HTML payload, request, etc.).
- Affected version / commit SHA.
- Whether the issue is already public knowledge.

We will acknowledge receipt within **72 hours** and aim to provide an initial
assessment within **7 days**. Coordinated disclosure timelines will be agreed
on a case-by-case basis.

## In-scope

- Remote code execution via crafted HTML payloads
- Path traversal or arbitrary file write/read via the API
- Resource-exhaustion attacks that the configured limits don't catch
- Sandbox escapes from the headless browser
- Bypass of `config.limits` (HTML size, duration, fps)

## Out of scope

- Findings against forks or downstream deployments
- Issues requiring privileged shell access to the host
- Self-inflicted denial of service through legitimate API parameters
- Vulnerabilities in upstream dependencies that already have a CVE — please
  file those upstream and link the CVE in your report

## Hardening checklist for self-hosters

If you are running `html → mp4` in production, please at minimum:

- Run the service behind authenticated reverse-proxy (no public submit).
- Place strict per-IP rate limits on `POST /api/render`.
- Tighten `limits.maxHtmlBytes`, `limits.maxDuration`, `limits.maxFps` to the
  smallest values your workload needs.
- Run the process in a containerised, non-root sandbox (the included
  [`Dockerfile`](Dockerfile) does this).
- Mount `output/` as a temporary volume and clean it on a schedule.

Thank you for helping keep the project and its users safe.
