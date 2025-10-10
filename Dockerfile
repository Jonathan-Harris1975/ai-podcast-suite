# syntax=docker/dockerfile:1.7-labs
# ========================================================
# Stage 1 — Builder
# ========================================================
FROM node:22-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@9

# Copy entire context to guarantee /services files are present
COPY . .

# Cache + install
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store pnpm fetch
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store pnpm install --frozen-lockfile

# Ensure no stale modules
RUN rm -rf node_modules && pnpm install --frozen-lockfile

# ========================================================
# Stage 2 — Runtime
# ========================================================
FROM node:22-alpine
WORKDIR /app

COPY --from=builder /app .

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3   CMD node -e "fetch('http://localhost:3000/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
