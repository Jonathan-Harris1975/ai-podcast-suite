# ────────────────────────────────────────────────
# 🧠 AI Podcast Suite — Render Optimized Build
# Clean rebuild + ESM syntax validation + small image
# ────────────────────────────────────────────────

# Stage 1 — Base
FROM node:22-slim AS base

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# ────────────────────────────────────────────────
# Copy only essential files first (for faster layer caching)
# ────────────────────────────────────────────────
COPY package*.json ./

# Force clean install, ignore any cached deps
RUN rm -rf node_modules && npm ci --omit=dev

# ────────────────────────────────────────────────
# Copy application code
# ────────────────────────────────────────────────
COPY . .

# ────────────────────────────────────────────────
# 🧩 Syntax validation (ESM-safe check)
# This step forces the build to fail early if ANY route has syntax errors
# ────────────────────────────────────────────────
RUN node --check server.js && \
    node --check routes/rewrite.js && \
    node --check routes/podcast.js && \
    node --check routes/rss.js

# ────────────────────────────────────────────────
# Optional: prune dependencies to keep final image light
# ────────────────────────────────────────────────
RUN npm prune --omit=dev && npm cache clean --force

# ────────────────────────────────────────────────
# Stage 2 — Runtime
# ────────────────────────────────────────────────
FROM node:22-slim AS runtime

WORKDIR /app

# Copy from previous stage
COPY --from=base /app /app

# Health and port exposure
EXPOSE 3000

# Disable Render's default cache issues by clearing before start
CMD ["bash", "-c", "rm -rf /app/routes/*.js~ /tmp/* && node server.js"]
