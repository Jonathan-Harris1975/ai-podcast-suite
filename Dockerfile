# ============================================================
# 🧠 AI Podcast Suite — Shiper Runtime Diagnostic Dockerfile (Final Version)
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
RUN chmod +x ./scripts/startupCheck.js ./scripts/fix-logger-and-env-imports.js || true

# Expose the application port for Shiper runtime detection
EXPOSE 3000

# ============================================================
# 🧩 Diagnostic Entrypoint (Final Version)
# ============================================================
# This version prints environment diagnostics and then keeps
# the container alive for live log visibility.
# ============================================================

CMD [ "sh", "-c", "  echo '✅ Dockerfile build finished successfully';  
echo '🚀 Container runtime started at:' $(date);   echo '---------------------------------------------';  
echo '📂 Working Directory:' $(pwd);   echo '📦 Node Version:' $(node -v);   echo '📁 Listing /app contents:'; 
ls -R /app;   echo '---------------------------------------------';  
echo '🧩 Launching startupCheck.mjs...';  
node ./scripts/startupCheck.js || { echo '❌ Node execution failed'; exit 1; };  
echo '💤 Keeping container alive for Shiper logs...';   tail -f /dev/null " ]
