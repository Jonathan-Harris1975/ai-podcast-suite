# Dockerfile — Node 22 + pnpm (shared R2 client)
FROM node:22-alpine

WORKDIR /app
COPY . .

RUN corepack enable pnpm
RUN pnpm install --prod

ENV NODE_ENV=production
EXPOSE 8080

CMD ["sh", "-lc", "test -f entrypoint.js && node entrypoint.js || node server.js"]
