import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { config } from "./config.js";
import { FrameEncoder } from "./encoder.js";
import { FrameRenderer } from "./renderer.js";
import type { Job, JobProgress, RenderRequest } from "./types.js";

const jobs = new Map<string, Job>();

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function createJob(req: RenderRequest): Job {
  const job: Job = {
    id: randomUUID(),
    request: req,
    progress: {
      status: "queued",
      framesTotal: Math.round(req.durationSec * req.fps),
      framesDone: 0,
    },
    createdAt: Date.now(),
    listeners: new Set(),
  };
  jobs.set(job.id, job);
  queueMicrotask(() => void runJob(job));
  return job;
}

function emit(job: Job, patch: Partial<JobProgress>): void {
  job.progress = { ...job.progress, ...patch };
  for (const fn of job.listeners) fn(job.progress);
}

async function runJob(job: Job): Promise<void> {
  const { html, durationSec, fps, width, height } = job.request;

  await mkdir(config.outputDir, { recursive: true });
  const outputPath = path.join(config.outputDir, `${job.id}.mp4`);

  const renderer = new FrameRenderer();
  let encoder: FrameEncoder | undefined;

  try {
    emit(job, { status: "rendering", message: "Loading page in headless Chromium…" });
    await renderer.open({ width, height, html });

    emit(job, { status: "encoding", message: "Recording at real time…" });
    encoder = new FrameEncoder({ outputPath, width, height, fps });

    await renderer.stream(
      durationSec,
      fps,
      async (frame) => {
        await encoder!.writeFrame(frame);
      },
      (done) => {
        emit(job, { framesDone: done });
      },
    );

    emit(job, { message: "Finalizing MP4…" });
    await encoder.finish();

    job.outputPath = outputPath;
    emit(job, { status: "done", message: "Ready." });
  } catch (err) {
    encoder?.kill();
    const message = err instanceof Error ? err.message : String(err);
    emit(job, { status: "error", error: message });
  } finally {
    await renderer.close();
  }
}
