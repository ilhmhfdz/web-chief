# ---- Base ----
FROM node:20-slim AS base
WORKDIR /app

# Install Chromium deps required by Puppeteer (whatsapp-web.js)
RUN apt-get update && apt-get install -y \
    chromium \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libgtk-3-0 \
    libasound2 \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use system Chromium, not download its own
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# ---- Dependencies ----
COPY package.json ./
RUN npm install --production

# ---- Build ----
COPY tsconfig.json ./
COPY src ./src
RUN npm install --save-dev typescript ts-node-dev && \
    npx tsc

# ---- Runtime ----
FROM node:20-slim AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y \
    chromium \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libgtk-3-0 \
    libasound2 \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist

EXPOSE 3003
CMD ["node", "dist/index.js"]
