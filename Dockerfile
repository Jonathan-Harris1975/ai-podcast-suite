# ============================================================
# 🧠 AI Podcast Suite — Shiper Runtime Diagnostic Dockerfile
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
RUN chmod +x ./scripts/startupCheck.mjs ./scripts/fix-logger-and-env-imports.mjs || true
EXPOSE 3000
# ============================================================
# 🧩 Diagnostic entrypoint
# ============================================================
# This version will print everything before and during runtime.
# ============================================================

CMD [ "sh", "-c", "\
  echo '✅ Dockerfile build finished successfully'; \
  echo '🚀 Container runtime started at:' $(date); \
  echo '---------------------------------------------'; \
  echo '📂 Working Directory:' $(pwd); \
  echo '📦 Node Version:' $(node -v); \
  echo '📁 Listing /app contents:'; \
  ls -R /app; \
  echo '---------------------------------------------'; \
  echo '🧩 Launching startupCheck.mjs...'; \
  node ./scripts/startupCheck.mjs || { echo '❌ Node execution failed'; exit 1; } \
" ]
