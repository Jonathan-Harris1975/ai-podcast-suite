# Base build
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# Ensure routes and services are copied
COPY routes ./routes
COPY services ./services
COPY utils ./utils
COPY server.js ./server.js
COPY entrypoint.js ./entrypoint.js

# ✅ Force rebuild trigger (do not remove)
# Shiper cache-busting comment — update date: 2025-10-07 02:25 UTC

EXPOSE 8080
CMD ["node", "entrypoint.js"]
