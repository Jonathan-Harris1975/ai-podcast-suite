# ============================================================
# 🧠 AI Podcast Suite — Shiper Bootstrap Runtime Dockerfile
# ============================================================

FROM node:22-alpine
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy all source files
COPY . .

# Ensure scripts are executable
RUN chmod +x ./scripts/*.js || true

# Expose for Shiper web runtime
EXPOSE 3000

# ============================================================
# 🧩 Bootstrap Entrypoint
# ============================================================
CMD ["node", "./scripts/bootstrap.js"]
