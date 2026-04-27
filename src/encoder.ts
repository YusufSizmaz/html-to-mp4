import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

export type EncoderOptions = {
  outputPath: string;
  width: number;
  height: number;
  fps: number;
  /** H.264 quality. Lower = better. 18 is visually lossless. */
  crf?: number;
};

/**
 * Spawns FFmpeg in image2pipe mode. Each JPEG frame written to stdin
 * becomes one frame of the output MP4. Caller must end stdin when done.
 */
export class FrameEncoder {
  private proc: ChildProcessWithoutNullStreams;
  private stderrBuf = "";
  private exitPromise: Promise<void>;

  constructor(opts: EncoderOptions) {
    const { outputPath, width, height, fps, crf = 18 } = opts;

    this.proc = spawn(
      "ffmpeg",
      [
        "-y",
        "-hide_banner",
        "-loglevel", "error",
        "-f", "image2pipe",
        "-vcodec", "mjpeg",
        "-framerate", String(fps),
        "-i", "-",
        "-vf", `scale=${width}:${height}:flags=bicubic,format=yuv420p`,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-tune", "zerolatency",
        "-crf", String(crf),
        "-movflags", "+faststart",
        "-r", String(fps),
        outputPath,
      ],
      { stdio: ["pipe", "pipe", "pipe"] },
    );

    this.proc.stderr.on("data", (chunk) => {
      this.stderrBuf += chunk.toString();
    });

    this.exitPromise = new Promise((resolve, reject) => {
      this.proc.on("error", reject);
      this.proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited ${code}: ${this.stderrBuf.trim()}`));
      });
    });
  }

  writeFrame(buf: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      const ok = this.proc.stdin.write(buf, (err) => {
        if (err) reject(err);
        else if (ok) resolve();
      });
      if (!ok) this.proc.stdin.once("drain", resolve);
    });
  }

  async finish(): Promise<void> {
    this.proc.stdin.end();
    await this.exitPromise;
  }

  kill(): void {
    if (!this.proc.killed) this.proc.kill("SIGKILL");
  }
}
