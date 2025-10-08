# ---------- Stage 1: Build dependencies ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Install build tools required for ffmpeg/fluent-ffmpeg modules
RUN apk add --no-cache python3 make g++ bash

# Copy package files and install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source code
COPY . .

# ---------- Stage 2: Runtime layer ----------
FROM node:20-alpine
WORKDIR /app

# Install ffmpeg & ffprobe binaries (for TTS, merging, editing)
RUN apk add --no-cache ffmpeg

# Copy compiled app + deps
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose web/API port
EXPOSE 3000

# Healthcheck for Shiper container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s CMD node -e "fetch('http://localhost:' + process.env.PORT + '/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

# Drop to non-root user for security
RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp
USER nodeapp

CMD ["npm", "start"]
