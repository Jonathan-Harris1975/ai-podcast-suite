# ---------------------------------------------
# 🧠 AI Podcast Suite – Shiper Unified Dockerfile
# ---------------------------------------------
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
COPY services ./services
COPY routes ./routes
COPY utils ./utils
COPY server.js ./server.js
COPY state.js ./state.js
COPY entrypoint.js ./entrypoint.js
COPY README.md ./README.md
COPY LICENSE ./LICENSE
COPY .env.example ./.env.example

RUN npm install -g npm@10 && npm install --omit=dev

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "entrypoint.js"]
