<div align="center">

# `html → mp4`

### **Render any HTML page into a real-time, frame-accurate MP4 video.**

A small, focused TypeScript service that drives headless Chromium over the
DevTools Protocol, samples the live screencast at your target frame rate, and
pipes the stream straight into FFmpeg.

<br />

[![CI](https://img.shields.io/github/actions/workflow/status/codynlab/html-to-mp4/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/codynlab/html-to-mp4/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-9a9aa3?style=flat-square)](LICENSE)
[![Free & Open Source](https://img.shields.io/badge/free%20%26%20open%20source-a3e635?style=flat-square)](#license)
[![Node](https://img.shields.io/badge/node-%E2%89%A520-3c873a?style=flat-square)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square)](https://www.typescriptlang.org)
[![Hono](https://img.shields.io/badge/Hono-4-ff6b35?style=flat-square)](https://hono.dev)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-libx264-007808?style=flat-square)](https://ffmpeg.org)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-a3e635?style=flat-square)](CONTRIBUTING.md)

<sub><strong>100% free · open source · for everyone</strong></sub>

<sub>An MIT-licensed project by <strong>CodynLab Dev</strong> — free to use for personal projects, client work, or commercial products. No fees, no "premium tier", no strings attached. Built in the open and maintained by the community.</sub>

</div>

---

## What is it?

`html → mp4` is a free, self-hosted service that turns any HTML page —
including its CSS animations, JavaScript-driven scenes, `<canvas>` art,
SVG, web fonts, and embedded media — into a high-quality MP4 video file.

Drop a `.html` file (or paste markup) into the web UI, choose an aspect
ratio and duration, and get back a frame-accurate H.264 video where every
animation plays at its natural, wall-clock speed. There's also a clean
HTTP API for embedding the renderer in your own pipelines.

**Built for:**

- 🎞️  **Social content** — turn HTML mockups into Reels, Shorts, or TikToks
- 📺  **Product demos & intros** — animated landing pages exported once, used everywhere
- 📊  **Data viz** — D3, Chart.js, or Three.js scenes shareable as a clip
- 🎨  **Banner-as-video** — render an animated ad once, ship it to any platform
- 🪄  **Motion graphics** — CSS keyframes and Canvas animations as ready-to-publish video
- 🤖  **Automated pipelines** — generate clips programmatically via the HTTP API
- 📧  **Email previews** — MP4 thumbnails for inboxes that won't render rich HTML

Because the renderer is a real headless Chromium browser, the output looks
exactly like the page would in your browser — fonts, gradients, blend modes,
WebGL, and all. There's no "approximation" of the layout; it's the actual
browser output, captured frame by frame.

---

## Free and open source — for everyone

This project is released under the **MIT License**, which means it's free
for anyone to use, modify, self-host, embed in products, or ship in client
work — personal or commercial, no permission required, no fee, no catch.
The whole codebase lives in this repository; nothing is held back behind a
"pro" version. Pull requests, issues, and ideas are welcome from anyone.

> **TL;DR** — clone it, run it, ship it. Forever free, forever open.

---

## Why this exists

Most browser-to-video pipelines fall into one of two traps:

- **Per-frame screenshots on a virtual clock.** Fast and deterministic, but
  decouples animation timing from real-world expectations. CSS keyframes are
  authored in seconds; you want them to *feel* the same in the export.
- **Wall-clock screen recording with a media stream.** Preserves real time,
  but jitters with host load and rarely produces a clean, frame-accurate file.

`html → mp4` takes a different path. It uses Chromium's
[`Page.startScreencast`](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-startScreencast)
to receive frames as the browser composites them, holds the most recent frame
in memory, and emits it to FFmpeg at exactly `1 / fps` second intervals over a
real wall-clock window. The page is never throttled, never fast-forwarded —
and the output is always exactly `durationSec × fps` frames long, no matter
how loaded the host is.

```
┌──────────────────┐    PNG over CDP     ┌──────────────────┐    image2pipe    ┌──────────┐
│  Headless        │ ──────────────────► │  Sampler         │ ───────────────► │  FFmpeg  │ ──► .mp4
│  Chromium        │   Page.screencast   │  (real-clock,    │                  │  libx264 │
│  (real-time)     │   ◄── ack each frame│   target fps)    │                  │  CRF 18  │
└──────────────────┘                     └──────────────────┘                  └──────────┘
```

---

## Table of contents

- [What is it?](#what-is-it)
- [Free and open source — for everyone](#free-and-open-source--for-everyone)
- [Features](#features)
- [Quick start](#quick-start)
- [Try the examples](#try-the-examples)
- [HTTP API](#http-api)
- [How it works](#how-it-works)
- [Project layout](#project-layout)
- [Configuration](#configuration)
- [Docker](#docker)
- [Limitations](#limitations)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Community](#community)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## Features

| | |
|---|---|
| 🎬  **Three formats** | Landscape (16:9), Portrait (9:16), Square (1:1) — at HD, Full HD, or QHD |
| ⏱  **Real-time fidelity** | The page runs at wall-clock speed; animations export at their natural rate |
| 🎯  **Frame-accurate output** | Always exactly `duration × fps` frames, regardless of host load |
| 🪟  **Three input modes** | Paste markup, drag-and-drop a `.html` file, or pick from disk |
| 📡  **Live progress** | Server-Sent Events stream status and per-frame counters |
| 🎨  **Visually lossless** | H.264 CRF 18, lanczos rescaling, faststart muxing |
| 🐳  **Container-ready** | One-command Docker / docker-compose deployment |
| 🪶  **Tiny stack** | Hono · Puppeteer · FFmpeg — no build step on the frontend |
| 🌑  **Polished UI** | Single-page, dark mode, file drop zone, format pills |

---

## Quick start

You'll need **Node ≥ 20** and **FFmpeg** on your `PATH`.

```bash
git clone https://github.com/codynlab/html-to-mp4
cd html-to-mp4

npm install      # installs deps and downloads the Chromium build
npm run dev      # starts http://localhost:3000
```

Open the UI, drop a `.html` file (or paste markup), pick an aspect ratio, hit
**Render to MP4**, and download the result.

For production:

```bash
npm run build
npm start
```

---

## Try the examples

The [`examples/`](examples) directory ships three self-contained HTML files
you can drop straight into the UI:

| Example | What it demonstrates |
|---|---|
| [`counter.html`](examples/counter.html) | Real-time `performance.now()` clock — proves wall-clock fidelity |
| [`spinner.html`](examples/spinner.html) | CSS keyframes, layered animations, gradient text |
| [`wave.html`](examples/wave.html) | `<canvas>` + `requestAnimationFrame` rendering |

> Got something cool to show off? Open a PR adding it to `examples/` —
> see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## HTTP API

Three JSON endpoints. No auth, no database — designed to be embedded behind
your own gateway.

### `POST /api/render`

Submit a render job.

```json
{
  "html": "<!doctype html>...",
  "durationSec": 5,
  "fps": 30,
  "width": 1920,
  "height": 1080
}
```

Response `200 OK`:

```json
{ "jobId": "8f3c…", "framesTotal": 150 }
```

### `GET /api/jobs/:id/stream`

Open a Server-Sent Events stream of the job's progress. The connection closes
when the job reaches `done` or `error`.

```
event: progress
data: {"status":"encoding","framesDone":42,"framesTotal":150}
```

`status` ∈ `queued | rendering | encoding | done | error`.

### `GET /api/jobs/:id/download`

Returns the rendered file as `video/mp4` once `status: done`.

---

## How it works

### Real-time capture loop

```ts
// Open the page
await renderer.open({ width, height, html });

// Stream the screencast and emit frames at exactly fps cadence
await renderer.stream(durationSec, fps, async (frame) => {
  await encoder.writeFrame(frame);
});

await encoder.finish();
```

Internally, the renderer:

1. Boots headless Chromium with the requested viewport.
2. Calls `page.setContent(html)` and waits for `networkidle0`, fonts, and the
   first composited frame.
3. Subscribes to `Page.screencastFrame` and starts the screencast (PNG, every
   frame).
4. Keeps the most recently delivered frame in memory.
5. In a real-time loop, sleeps until each `(i + 1) / fps` second target and
   pushes the latest frame into the FFmpeg sink.

The split between the **producer** (Chromium delivering frames at its render
cadence) and the **consumer** (the sampler emitting at exact intervals) is what
gives the output its temporal accuracy: the producer can be slow, the consumer
can be slow, but the relationship `total_frames = duration × fps` always holds.

### Encoder

```bash
ffmpeg -y \
  -f image2pipe -vcodec png -framerate {fps} -i - \
  -vf "scale={W}:{H}:flags=lanczos,format=yuv420p" \
  -c:v libx264 -preset slow -crf 18 \
  -movflags +faststart -r {fps} \
  out.mp4
```

PNG frames go in via `stdin`, H.264 comes out. `+faststart` moves the moov
atom to the front of the file so the video begins playing instantly when
served over HTTP.

---

## Project layout

```
src/
├── server.ts       Hono routes — submit, stream, download
├── pipeline.ts     Job lifecycle, in-memory store, progress fan-out
├── renderer.ts     Puppeteer + CDP screencast, real-time sampler
├── encoder.ts      FFmpeg child process, image2pipe stdin
├── config.ts       Limits and defaults (override via env)
└── types.ts        Shared types

public/             Single-page UI · index.html · styles.css · app.js
examples/           Self-contained HTML samples to try in the UI
.github/            CI workflow, issue / PR templates, funding config
```

---

## Configuration

Edit [`src/config.ts`](src/config.ts) or set environment variables:

| | |
|---|---|
| `PORT` (env) | HTTP port — defaults to `3000` |
| `limits.maxHtmlBytes` | Max payload size — defaults to 5 MB |
| `limits.minDuration` / `maxDuration` | Defaults to 1–60 seconds |
| `limits.minFps` / `maxFps` | Defaults to 12–60 fps |

The encoder's CRF, preset, scaling filter, and pixel format are all in
[`src/encoder.ts`](src/encoder.ts) — tune to taste.

---

## Docker

The repository includes a production-ready container build:

```bash
# Build & run with docker-compose
docker compose up -d

# Or directly
docker build -t codynlab/html-to-mp4 .
docker run --rm -p 3000:3000 -v $(pwd)/output:/app/output codynlab/html-to-mp4
```

The image is based on
[`ghcr.io/puppeteer/puppeteer`](https://hub.docker.com/r/puppeteer/puppeteer),
runs as a non-root `pptruser`, and uses `tini` as PID 1.

---

## Limitations

- **Single-machine, in-memory job store.** Restart the process and history is
  gone. If you need persistence or horizontal scaling, swap the `Map` in
  `pipeline.ts` for Redis or a durable queue.
- **No audio track.** This is a video-only pipeline; mix audio in afterwards
  with a second FFmpeg pass.
- **Chromium's render cadence is the upper bound on smoothness.** If the
  browser delivers fewer frames per second than your target fps, the most
  recent frame is repeated — the video timeline stays correct, but it may
  look choppy on heavy pages.

---

## Roadmap

- [ ] Audio track input (mix on a second FFmpeg pass)
- [ ] WebM / VP9 and HEVC outputs
- [ ] Per-job concurrency limits and queue depth
- [ ] Persistent job store (Redis / SQLite adapter)
- [ ] Optional transparent background (yuv420p → yuva420p with `-vcodec qtrle`)

Have an idea that fits the project's "small, focused, embeddable" spirit?
[Open an issue](https://github.com/codynlab/html-to-mp4/issues/new/choose).

---

## Contributing

This is an open-source project — pull requests, bug reports, and ideas are
all welcome. Before sending a PR, please:

1. Read **[CONTRIBUTING.md](CONTRIBUTING.md)**.
2. Open an issue first for anything beyond a trivial fix.
3. Check that `npm run typecheck` and `npm run build` pass.

If you discover a security issue, please follow the
[responsible disclosure process](SECURITY.md) instead of opening a public
issue.

By participating you agree to abide by the
[Code of Conduct](CODE_OF_CONDUCT.md).

---

## Community

- 🐛 [Report a bug](https://github.com/codynlab/html-to-mp4/issues/new?template=bug_report.yml)
- 💡 [Request a feature](https://github.com/codynlab/html-to-mp4/issues/new?template=feature_request.yml)
- 💬 [Discussions](https://github.com/codynlab/html-to-mp4/discussions)
- 🔒 [Security advisories](https://github.com/codynlab/html-to-mp4/security/advisories/new)

If this project saves you a weekend of FFmpeg yak-shaving, consider giving
the repo a ⭐ — it really helps it find new contributors.

---

## License

[MIT](LICENSE) © **CodynLab Dev** and contributors.

This project is **free and open source — for everyone, forever**. Anyone —
individuals, students, freelancers, agencies, startups, or large companies —
can use, copy, modify, merge, publish, distribute, sublicense, and sell copies
of the software, **including in commercial products**, under the permissive
[MIT License](LICENSE).

- ✅  No usage fees, ever
- ✅  No "premium tier" or paywalled features
- ✅  No "free for non-commercial only" clause
- ✅  No CLA (Contributor License Agreement) to sign
- ✅  No telemetry or tracking baked in
- ✅  Fork it, rebrand it, ship it — all fine

Forks and derivative works are encouraged. If you build something cool with
it, we'd love to hear about it.

---

## Acknowledgements

Built on the shoulders of giants:

- [Puppeteer](https://pptr.dev) — the headless Chromium driver
- [FFmpeg](https://ffmpeg.org) — the universe's video encoder
- [Hono](https://hono.dev) — the small, fast HTTP framework
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) —
  the API behind real-time screencast capture

Maintained with care by **[CodynLab Dev](https://codynlab.dev)**.
