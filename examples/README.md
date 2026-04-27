# Examples

Self-contained HTML files you can drop straight into the `html → mp4` UI to
verify the pipeline end-to-end.

Like the rest of the project, every file in this folder is **MIT-licensed and
free for anyone to use, modify, remix, or ship** — in personal experiments,
open-source forks, or commercial products. No attribution required.

| File | What it shows |
|---|---|
| [`counter.html`](counter.html) | A `performance.now()` based real-time clock — the easiest way to confirm the renderer captures at wall-clock speed. |
| [`spinner.html`](spinner.html) | CSS keyframe animations, gradient text, layered concentric rings. Good template for a logo intro. |
| [`wave.html`](wave.html) | `<canvas>` + `requestAnimationFrame` rendering — proves the Canvas pipeline works. |

## Using them

1. Start the server: `npm run dev`
2. Open `http://localhost:3000`
3. Click **↑ choose .html** (or drop the file onto the textarea)
4. Pick a format & duration, then **Render to MP4**

Got a cool example? PRs that drop a single self-contained HTML file in here
are very welcome — see [`CONTRIBUTING.md`](../CONTRIBUTING.md).
