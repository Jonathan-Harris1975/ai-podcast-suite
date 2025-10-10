# Dockerfile — Node 22 + pnpm
FROM node:22-alpine

WORKDIR /app
COPY . .

# Enable pnpm via corepack
RUN corepack enable pnpm

# Install production dependencies
# No lockfile included; pnpm will resolve and write pnpm-lock.yaml
RUN pnpm install --prod

ENV NODE_ENV=production
EXPOSE 8080

# Prefer entrypoint.js if present; fallback to server.js
CMD ["sh", "-lc", "test -f entrypoint.js && node entrypoint.js || node server.js"]
