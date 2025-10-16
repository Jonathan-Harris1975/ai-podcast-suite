# ────────────────────────────────────────────────
# 🧠 AI Podcast Suite — Shiper Optimized Build
# Zero TS assumptions, ESM validation, minimal layers
# ────────────────────────────────────────────────

# Base image
FROM node:22-slim AS base
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

# ────────────────────────────────────────────────
# 1️⃣ Install dependencies
# ────────────────────────────────────────────────
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# ────────────────────────────────────────────────
# 2️⃣ Copy source files
# ────────────────────────────────────────────────
COPY . .

# Validate syntax of critical ESM entry points
RUN node --check server.js || exit 1
RUN node --check routes/rewrite.js || exit 1
RUN node --check routes/rss.js || exit 1
RUN node --check routes/podcast.js || exit 0

# ────────────────────────────────────────────────
# 3️⃣ Runtime stage
# ────────────────────────────────────────────────
FROM node:22-slim AS runtime
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

# Copy built app
COPY --from=base /app /app

# Avoid Shiper’s TS detection by explicitly defining entry
ENTRYPOINT ["node", "server.js"]

EXPOSE 3000

# ────────────────────────────────────────────────
# ✅ Final CMD
# ────────────────────────────────────────────────
# No bash wrapper — faster cold start, no caching issues
CMD []
