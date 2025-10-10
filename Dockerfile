# syntax=docker/dockerfile:1.7-labs
# ========================================================
# Stage 1 — Builder
# ========================================================
FROM node:22-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@9

# Copy dependency manifests first for better caching
COPY package.json pnpm-lock.yaml ./

# Cache pnpm store between builds
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store     pnpm fetch

# Install deps using cached store
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store     pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build release artifacts if needed (kept as hook)
RUN chmod +x ./build_release.sh || true

# ========================================================
# Stage 2 — Runtime
# ========================================================
FROM node:22-alpine
WORKDIR /app

# Copy built app from builder stage
COPY --from=builder /app .

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3   CMD node -e "fetch('http://localhost:3000/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
