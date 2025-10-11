# ────────────────────────────────────────────────
# 🧠 AI Podcast Suite — Render Optimized Build
# Clean rebuild + syntax validation + no lockfile requirement
# ────────────────────────────────────────────────

FROM node:22-slim AS base

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Copy manifest files
COPY package*.json ./

# Clean install dependencies (safe for no-lock repos)
RUN rm -rf node_modules && npm install --omit=dev

# Copy rest of the source
COPY . .

# Validate syntax of key entrypoints (ESM check)
RUN node --check server.js && \
    node --check routes/rewrite.js && \
    node --check routes/podcast.js && \
    node --check routes/rss.js

# Cleanup unnecessary files
RUN npm prune --omit=dev && npm cache clean --force

# ────────────────────────────────────────────────
# Runtime stage
# ────────────────────────────────────────────────
FROM node:22-slim AS runtime
WORKDIR /app

COPY --from=base /app /app
EXPOSE 3000

# Forcefully clear any cached routes before start
CMD ["bash", "-c", "rm -rf /app/routes/*.js~ /tmp/* && node server.js"]
