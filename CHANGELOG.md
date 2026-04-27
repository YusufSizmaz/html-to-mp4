# Changelog

All notable changes to this project will be documented here. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] — 2026-04-28

Initial public release.

### Added

- Real-time HTML capture via Chrome DevTools Protocol screencast — animations
  play at their natural speed instead of being fast-forwarded by virtual time.
- Three input modes: paste markup, drag-and-drop a `.html` file, or pick from
  disk.
- Three format presets — Landscape (16:9), Portrait (9:16), Square (1:1) — at
  HD / Full HD / QHD quality tiers.
- Job-based pipeline with Server-Sent Events stream for live progress.
- H.264 / yuv420p / CRF 18 / `+faststart` output via FFmpeg `image2pipe`.
- Hono HTTP server with three endpoints: submit, stream, download.
- Single-page dark UI built with plain HTML, CSS, and ES modules — no
  frontend build step.
- Type-safe TypeScript codebase under strict mode.
- Dockerfile and docker-compose configuration for one-command deployment.
- Project paperwork: MIT license, contributing guide, code of conduct,
  security policy, GitHub Actions CI, issue and PR templates.

[Unreleased]: https://github.com/codynlab/html-to-mp4/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/codynlab/html-to-mp4/releases/tag/v0.1.0
