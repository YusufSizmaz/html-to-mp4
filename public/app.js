const $ = (id) => document.getElementById(id);

const els = {
  html: $("html"),
  drop: $("drop"),
  file: $("file"),
  pick: $("pick"),
  sample: $("sample"),
  formats: document.querySelectorAll(".fmt"),
  quality: $("quality"),
  resolutionHint: $("resolution-hint"),
  duration: $("duration"),
  fps: $("fps"),
  render: $("render"),
  status: $("status"),
  statusText: $("status-text"),
  statusFrames: $("status-frames"),
  barFill: $("bar-fill"),
  download: $("download"),
};

let aspect = "landscape"; // landscape | portrait | square

const SAMPLE_HTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      :root { color-scheme: dark; }
      body {
        margin: 0; height: 100vh; display: grid; place-items: center;
        background: radial-gradient(circle at 30% 20%, #1a1a2e, #050505);
        font-family: -apple-system, system-ui, sans-serif; color: #fff;
        overflow: hidden;
      }
      .ring {
        width: 360px; height: 360px; border-radius: 50%;
        border: 2px solid rgba(163, 230, 53, 0.18);
        border-top-color: #a3e635;
        animation: spin 2s linear infinite;
        display: grid; place-items: center;
        position: relative;
      }
      .ring::before {
        content: ""; position: absolute; inset: -16px;
        border-radius: 50%; border: 1px dashed rgba(163, 230, 53, 0.25);
        animation: spin 8s linear infinite reverse;
      }
      .num {
        font-size: 96px; font-weight: 700; letter-spacing: -0.04em;
        background: linear-gradient(180deg, #fff, #a3e635);
        -webkit-background-clip: text; background-clip: text; color: transparent;
        animation: pulse 1.6s ease-in-out infinite;
      }
      h1 {
        position: absolute; top: 12%; font-size: 18px; font-weight: 400;
        letter-spacing: 0.4em; text-transform: uppercase; opacity: 0.55;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes pulse { 50% { opacity: 0.55; } }
    </style>
  </head>
  <body>
    <h1>codynlab · render</h1>
    <div class="ring"><div class="num">HD</div></div>
  </body>
</html>`;

/* ---------- aspect / resolution ---------- */

function resolutionFor(aspect, quality) {
  const q = Number(quality);
  if (aspect === "landscape") return [Math.round((q * 16) / 9), q];
  if (aspect === "portrait")  return [q, Math.round((q * 16) / 9)];
  return [q, q]; // square
}

function syncResolutionHint() {
  const [w, h] = resolutionFor(aspect, els.quality.value);
  els.resolutionHint.textContent = `${w} × ${h}`;
}

els.formats.forEach((btn) => {
  btn.addEventListener("click", () => {
    aspect = btn.dataset.aspect;
    els.formats.forEach((b) =>
      b.setAttribute("aria-checked", b === btn ? "true" : "false"),
    );
    syncResolutionHint();
  });
});
els.quality.addEventListener("change", syncResolutionHint);
syncResolutionHint();

/* ---------- source: paste / file / drag-drop ---------- */

els.sample.addEventListener("click", () => {
  els.html.value = SAMPLE_HTML;
});

els.pick.addEventListener("click", () => els.file.click());
els.file.addEventListener("change", async (e) => {
  const f = e.target.files?.[0];
  if (f) els.html.value = await f.text();
  e.target.value = ""; // allow re-selecting the same file
});

let dragDepth = 0;
const isFileDrag = (e) =>
  Array.from(e.dataTransfer?.types ?? []).includes("Files");

window.addEventListener("dragenter", (e) => {
  if (!isFileDrag(e)) return;
  e.preventDefault();
  dragDepth++;
  els.drop.dataset.over = "true";
});
window.addEventListener("dragover", (e) => {
  if (isFileDrag(e)) e.preventDefault();
});
window.addEventListener("dragleave", (e) => {
  if (!isFileDrag(e)) return;
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) delete els.drop.dataset.over;
});
window.addEventListener("drop", async (e) => {
  if (!isFileDrag(e)) return;
  e.preventDefault();
  dragDepth = 0;
  delete els.drop.dataset.over;
  const f = e.dataTransfer.files?.[0];
  if (f) els.html.value = await f.text();
});

/* ---------- render ---------- */

els.render.addEventListener("click", async () => {
  const html = els.html.value.trim();
  if (!html) {
    els.html.focus();
    return;
  }

  const [width, height] = resolutionFor(aspect, els.quality.value);
  const payload = {
    html,
    durationSec: Number(els.duration.value),
    fps: Number(els.fps.value),
    width,
    height,
  };

  setLoading(true);
  showStatus("queued", "Submitting…", 0, 0);
  els.download.hidden = true;

  let jobId;
  try {
    const res = await fetch("/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "submit failed");
    jobId = data.jobId;
  } catch (err) {
    showStatus("error", err.message, 0, 0);
    setLoading(false);
    return;
  }

  const es = new EventSource(`/api/jobs/${jobId}/stream`);
  es.addEventListener("progress", (e) => {
    const p = JSON.parse(e.data);
    showStatus(p.status, p.message ?? labelFor(p.status), p.framesDone, p.framesTotal);

    if (p.status === "done") {
      es.close();
      setLoading(false);
      els.download.hidden = false;
      els.download.href = `/api/jobs/${jobId}/download`;
      els.download.download = `${jobId}.mp4`;
    } else if (p.status === "error") {
      es.close();
      setLoading(false);
      showStatus("error", p.error || "Render failed", 0, 0);
    }
  });
  es.onerror = () => {
    es.close();
    setLoading(false);
  };
});

function setLoading(loading) {
  els.render.dataset.loading = loading ? "true" : "false";
  els.render.disabled = loading;
  els.render.querySelector(".label").textContent = loading
    ? "Rendering…"
    : "Render to MP4";
}

function showStatus(state, text, done, total) {
  els.status.hidden = false;
  els.status.dataset.state = state;
  els.statusText.textContent = text;
  els.statusFrames.textContent = total ? `${done} / ${total} frames` : "";
  const pct = total ? Math.min(100, (done / total) * 100) : state === "done" ? 100 : 0;
  els.barFill.style.width = `${pct}%`;
}

function labelFor(state) {
  return {
    queued: "Queued",
    rendering: "Loading page in headless Chromium…",
    encoding: "Recording at real time…",
    done: "Ready.",
    error: "Error",
  }[state] ?? state;
}
