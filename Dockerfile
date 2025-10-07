FROM node:20-slim

WORKDIR /app

ARG CACHE_BREAKER=2025-10-07-0318

COPY package*.json ./
RUN npm install --omit=dev

# Copy all necessary directories
COPY routes ./routes
COPY services ./services
COPY utils ./utils
COPY server.js ./server.js
COPY entrypoint.js ./entrypoint.js

# ✅ Force rebuild trigger (final fix)
# Cache-busting comment - 2025-10-07 02:35 UTC

EXPOSE 8080
CMD ["node", "entrypoint.js"]
