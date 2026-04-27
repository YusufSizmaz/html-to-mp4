import puppeteer, { type Browser, type CDPSession, type Page } from "puppeteer";

export type RendererOptions = {
  width: number;
  height: number;
  html: string;
};

export type FrameSink = (frame: Buffer) => Promise<void>;

/**
 * Real-time HTML capture via Chrome DevTools Protocol screencast.
 *
 * The page runs at wall-clock speed; CSS animations and timers tick at
 * their natural rate. We sample the latest delivered frame at exactly
 * `1/fps` second intervals over `durationSec` seconds — so a 5 s @ 30 fps
 * render emits 150 frames spanning exactly 5 seconds of page time.
 *
 * If Chrome delivers frames slower than the target fps (e.g. heavy page,
 * slow host), the most recent frame is repeated. The output's wall-time
 * accuracy is always preserved.
 */
export class FrameRenderer {
  private browser?: Browser;
  private page?: Page;
  private cdp?: CDPSession;

  async open(opts: RendererOptions): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--hide-scrollbars",
        "--font-render-hinting=none",
        "--force-color-profile=srgb",
      ],
      defaultViewport: {
        width: opts.width,
        height: opts.height,
        deviceScaleFactor: 1,
      },
    });

    this.page = await this.browser.newPage();
    this.cdp = await this.page.createCDPSession();

    await this.page.setViewport({ width: opts.width, height: opts.height });
    await this.page.setContent(opts.html, { waitUntil: "networkidle0" });

    await this.page.evaluate(async () => {
      const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
      if (fonts?.ready) await fonts.ready;
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
    });
  }

  async stream(
    durationSec: number,
    fps: number,
    sink: FrameSink,
    onProgress?: (done: number, total: number) => void,
  ): Promise<void> {
    if (!this.page || !this.cdp) throw new Error("renderer not opened");
    const cdp = this.cdp;

    let latest: Buffer | null = null;
    let resolveFirst: (() => void) | null = null;
    const firstFrame = new Promise<void>((r) => {
      resolveFirst = r;
    });

    const onScreencastFrame = (e: { data: string; sessionId: number }) => {
      cdp.send("Page.screencastFrameAck", { sessionId: e.sessionId }).catch(() => {});
      latest = Buffer.from(e.data, "base64");
      if (resolveFirst) {
        resolveFirst();
        resolveFirst = null;
      }
    };

    cdp.on("Page.screencastFrame", onScreencastFrame);

    await cdp.send("Page.startScreencast", {
      format: "jpeg",
      quality: 92,
      everyNthFrame: 1,
    });

    try {
      await Promise.race([
        firstFrame,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("no frame from Chromium within 10s")), 10_000),
        ),
      ]);

      const totalFrames = Math.round(durationSec * fps);
      const start = Date.now();

      // Decouple sink writes from the sampling loop: writes are chained
      // through a queue so encoder back-pressure never delays the next
      // wall-clock sample. This preserves timing accuracy even when
      // ffmpeg momentarily can't keep up.
      let writeChain: Promise<void> = Promise.resolve();
      let writeError: Error | null = null;
      let written = 0;
      const enqueue = (buf: Buffer, idx: number) => {
        writeChain = writeChain.then(async () => {
          if (writeError) return;
          try {
            await sink(buf);
            written = idx + 1;
            onProgress?.(written, totalFrames);
          } catch (err) {
            writeError = err as Error;
          }
        });
      };

      for (let i = 0; i < totalFrames; i++) {
        const targetT = start + ((i + 1) / fps) * 1000;
        const wait = targetT - Date.now();
        if (wait > 0) await sleep(wait);
        if (writeError) throw writeError;
        enqueue(latest!, i);
      }

      await writeChain;
      if (writeError) throw writeError;
    } finally {
      cdp.off("Page.screencastFrame", onScreencastFrame);
      await cdp.send("Page.stopScreencast").catch(() => {});
    }
  }

  async close(): Promise<void> {
    await this.browser?.close().catch(() => {});
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
