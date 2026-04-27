import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: Number(process.env.PORT ?? 3000),
  outputDir: path.resolve(here, "..", "output"),
  publicDir: path.resolve(here, "..", "public"),
  limits: {
    minDuration: 1,
    maxDuration: 60,
    minFps: 12,
    maxFps: 60,
    maxHtmlBytes: 5 * 1024 * 1024,
  },
  defaults: {
    width: 1920,
    height: 1080,
    fps: 30,
    durationSec: 5,
  },
} as const;
