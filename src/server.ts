import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { config } from "./config.js";
import { createJob, getJob } from "./pipeline.js";
import type { RenderRequest } from "./types.js";

const app = new Hono();

app.use("/*", serveStatic({ root: path.relative(process.cwd(), config.publicDir) }));

app.post("/api/render", async (c) => {
  let body: Partial<RenderRequest>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid JSON" }, 400);
  }

  const html = String(body.html ?? "").trim();
  if (!html) return c.json({ error: "html is required" }, 400);
  if (html.length > config.limits.maxHtmlBytes) {
    return c.json({ error: "html too large" }, 413);
  }

  const durationSec = clamp(
    Number(body.durationSec ?? config.defaults.durationSec),
    config.limits.minDuration,
    config.limits.maxDuration,
  );
  const fps = clamp(
    Number(body.fps ?? config.defaults.fps),
    config.limits.minFps,
    config.limits.maxFps,
  );
  const width = Number(body.width ?? config.defaults.width);
  const height = Number(body.height ?? config.defaults.height);

  const job = createJob({ html, durationSec, fps, width, height });
  return c.json({ jobId: job.id, framesTotal: job.progress.framesTotal });
});

app.get("/api/jobs/:id/stream", (c) => {
  const job = getJob(c.req.param("id"));
  if (!job) return c.json({ error: "not found" }, 404);

  return streamSSE(c, async (stream) => {
    const send = (event: string, data: unknown) =>
      stream.writeSSE({ event, data: JSON.stringify(data) });

    await send("progress", job.progress);

    if (job.progress.status === "done" || job.progress.status === "error") {
      return;
    }

    await new Promise<void>((resolve) => {
      let chain: Promise<unknown> = Promise.resolve();
      const onUpdate = (p: typeof job.progress) => {
        chain = chain.then(() => send("progress", p));
        if (p.status === "done" || p.status === "error") {
          job.listeners.delete(onUpdate);
          chain.finally(() => resolve());
        }
      };
      job.listeners.add(onUpdate);
      stream.onAbort(() => {
        job.listeners.delete(onUpdate);
        resolve();
      });
    });
  });
});

app.get("/api/jobs/:id/download", async (c) => {
  const job = getJob(c.req.param("id"));
  if (!job?.outputPath) return c.json({ error: "not ready" }, 404);

  const [info, data] = await Promise.all([stat(job.outputPath), readFile(job.outputPath)]);
  c.header("Content-Type", "video/mp4");
  c.header("Content-Length", String(info.size));
  c.header("Content-Disposition", `attachment; filename="${job.id}.mp4"`);
  return c.body(data);
});

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));
}

serve({ fetch: app.fetch, port: config.port }, ({ port }) => {
  console.log(`▸ html-to-mp4 listening on http://localhost:${port}`);
});
