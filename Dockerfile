# syntax=docker/dockerfile:1.7

# ---------- builder ----------
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install only what we need at build time
COPY package*.json tsconfig.json ./
RUN --mount=type=cache,target=/root/.npm \
    PUPPETEER_SKIP_DOWNLOAD=true npm ci --ignore-scripts

COPY src ./src
RUN npm run build

# ---------- runtime ----------
# Puppeteer's official image already ships Chromium and all its
# system dependencies pre-configured for headless use.
FROM ghcr.io/puppeteer/puppeteer:23.11.1

USER root
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg tini \
 && rm -rf /var/lib/apt/lists/*
USER pptruser

WORKDIR /app

COPY --chown=pptruser:pptruser package*.json ./
RUN --mount=type=cache,target=/home/pptruser/.npm,uid=1000,gid=1000 \
    PUPPETEER_SKIP_DOWNLOAD=true npm ci --omit=dev --ignore-scripts

COPY --chown=pptruser:pptruser --from=builder /app/dist ./dist
COPY --chown=pptruser:pptruser public ./public

ENV NODE_ENV=production \
    PORT=3000 \
    PUPPETEER_SKIP_DOWNLOAD=true

EXPOSE 3000

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/server.js"]
