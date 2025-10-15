# ============================================================
# 🧠 AI Podcast Suite — Shiper Deployment Dockerfile
# ============================================================

FROM node:22-alpine
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies (Shiper uses cached layers for npm ci)
RUN npm ci --omit=dev

# Copy all source files
COPY . .

# Make startup script executable
RUN chmod +x ./scripts/startupCheck.mjs ./scripts/fix-logger-and-env-imports.mjs || true

# ============================================================
# 🟢 ENTRYPOINT
# ============================================================
# Runs startup checks before starting the main server.
# ============================================================

CMD [ "node", "./scripts/startupCheck.mjs" ]
