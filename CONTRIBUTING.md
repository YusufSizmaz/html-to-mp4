# Contributing to `html → mp4`

Thanks for taking an interest. This is a **free and open-source** project,
released under the MIT license, and **anyone is welcome to contribute** —
whether it's your first open-source PR or your thousandth. We welcome
contributions of every shape: bug reports, fixes, performance work, examples,
docs, translations, and ideas.

The goal is a small, focused, dependable HTML-to-video pipeline that stays
free for everyone forever; please keep that spirit in mind when proposing
changes.

## Ways to contribute

- 🐛 **Report a bug** — open an issue with reproduction steps. The more
  specific the HTML payload, the better.
- 💡 **Propose a feature** — open an issue first so we can align on scope
  before code review.
- 📖 **Improve the docs** — typos, clarifications, better examples are all
  appreciated.
- 🎬 **Add an example** — drop a self-contained `.html` file into
  [`examples/`](examples/) that showcases something interesting (CSS animation,
  Canvas, SVG, WebGL, data viz).
- 🛠 **Send a pull request** — see the workflow below.

## Local development

```bash
# 1. Fork & clone
git clone https://github.com/<your-username>/html-to-mp4
cd html-to-mp4

# 2. Install (downloads Chromium for Puppeteer)
npm install

# 3. Run the dev server
npm run dev          # http://localhost:3000

# 4. Type-check before pushing
npm run typecheck
npm run build
```

You'll need **Node ≥ 20** and **FFmpeg** on your `PATH`.

## Pull request workflow

1. **Open an issue first** for anything beyond a trivial fix. It saves
   everyone a review cycle.
2. Branch off `main` with a descriptive name: `fix/screencast-ack-race`,
   `feat/audio-mux`, `docs/api-examples`.
3. Keep PRs **small and focused**. One logical change per PR.
4. Add or update tests / examples where it makes sense.
5. Make sure `npm run typecheck` and `npm run build` both pass.
6. Open the PR against `main` with a clear title and a short description of
   *what* and *why* (link the issue with `Closes #N`).
7. Be responsive to review feedback — most PRs go through 1–2 rounds.

## Coding standards

- **TypeScript strict mode** — no `any` unless there's a documented reason.
- **No new dependencies** without discussion. The dependency tree is small on
  purpose.
- **Match the existing style** — 2-space indentation, double quotes, no
  semicolons skipped, `const` by default. Prettier-friendly.
- **Comments explain *why*, not *what*.** The code already says what it does.
- **No introducing build steps** to the frontend. `public/` is plain HTML, CSS,
  and ES modules — keep it that way.

## What we'll likely *decline*

- Large refactors without a paired issue.
- New runtime dependencies that overlap with what's already shipped.
- Changes that move the project away from "small, focused, embeddable
  service".
- "Drive-by" formatting commits across unrelated files.

## Reporting security issues

Please don't open a public issue for security vulnerabilities. See
[SECURITY.md](SECURITY.md) for the responsible disclosure process.

## Code of conduct

By participating, you agree to abide by our
[Code of Conduct](CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your work will be licensed under the project's
[MIT License](LICENSE) — keeping the project free and open source for
everyone, forever. There is **no Contributor License Agreement** to sign;
your normal git commit metadata is enough.
