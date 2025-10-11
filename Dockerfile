# ────────────────────────────────────────────────
# 🧠 AI Podcast Suite — Render Build (2025.10.11)
# Includes shorthand fixer before start
# ────────────────────────────────────────────────
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first for caching
COPY package*.json ./

# Install dependencies (clean, minimal)
RUN npm ci --omit=dev || npm install --omit=dev

# Copy all source files
COPY . .

# 🔧 Fix shorthand object literals before build
RUN node fix-shorthand.js || echo "⚠️  fix-shorthand.js skipped (not present)"

# Expose port for Render
EXPOSE 3000

# Define environment variables
ENV NODE_ENV=production
ENV HEARTBEAT_ENABLE=no

# Healthcheck to keep container alive
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --quiet --spider http://localhost:3000/health || exit 1

# Start server
CMD ["node", "server.js"]
