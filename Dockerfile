# -----------------------------
# 🧠 AI Podcast Suite - Unified Dockerfile
# -----------------------------
FROM node:20-slim AS base

WORKDIR /app
COPY package*.json ./
COPY services ./services
COPY routes ./routes
COPY utils ./utils
COPY server.js ./
COPY state.js ./
COPY run.js ./
COPY get-docker.sh ./
COPY README.md ./
COPY .env.example ./
COPY LICENSE ./

RUN npm install -g npm@10 && npm install --omit=dev

FROM node:20-slim AS runner
WORKDIR /app
COPY --from=base /app /app
ENV NODE_ENV=production
ENV PORT=3000

# Select service at runtime (main or rss-feed-creator)
ARG SERVICE_NAME=main
ENV SERVICE_NAME=${SERVICE_NAME}

CMD node -e "\
if (process.env.SERVICE_NAME === 'rss-feed-creator') { \
  console.log('🚀 Starting RSS Feed Creator...'); \
  import('./services/rss-feed-creator/index.js'); \
} else { \
  console.log('🚀 Starting AI Podcast Suite main service...'); \
  import('./server.js'); \
}"
