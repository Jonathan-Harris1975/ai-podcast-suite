FROM node:20-slim
WORKDIR /app

ARG CACHE_BREAKER=2025-10-07-0458

COPY package*.json ./
RUN npm install --omit=dev

COPY utils ./utils
COPY routes ./routes
COPY services ./services
COPY server.js ./server.js
COPY entrypoint.js ./entrypoint.js

EXPOSE 8080
CMD ["node", "entrypoint.js"]
