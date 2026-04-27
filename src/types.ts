export type RenderRequest = {
  html: string;
  durationSec: number;
  fps: number;
  width: number;
  height: number;
};

export type JobStatus = "queued" | "rendering" | "encoding" | "done" | "error";

export type JobProgress = {
  status: JobStatus;
  framesTotal: number;
  framesDone: number;
  message?: string;
  error?: string;
};

export type Job = {
  id: string;
  request: RenderRequest;
  progress: JobProgress;
  outputPath?: string;
  createdAt: number;
  listeners: Set<(p: JobProgress) => void>;
};
