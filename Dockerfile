# ============================================================
# 🧠 AI Podcast Suite — Shiper JS Runtime Dockerfile (Final)
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

# Expose for Shiper web runtime
EXPOSE 3000

# ============================================================
# 🧩 Diagnostic Entrypoint (JS Version)
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
  echo '🧩 Launching startupCheck.js...'; \
  node ./scripts/startupCheck.js || { echo '❌ Node execution failed'; exit 1; }; \
  echo '💤 Keeping container alive for Shiper logs...'; \
  tail -f /dev/null \
" ]
