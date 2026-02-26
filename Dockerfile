FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg curl python3 python3-pip git ca-certificates \
    && pip3 install --break-system-packages yt-dlp \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .

RUN mkdir -p /root/.ultimate

ENV NODE_ENV=production
ENV ULTIMATE_HOME=/root/.ultimate

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "src/entry.js", "web"]
