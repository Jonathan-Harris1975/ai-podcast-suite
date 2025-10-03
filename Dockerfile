# Single image for entire monorepo
FROM node:22-slim

ENV NODE_ENV=production
WORKDIR /app

# Install OS deps if needed in future (ffmpeg etc for TTS repos already vendor? adjust later)
# RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Copy monorepo
COPY . .

# Install root deps only; service packages use their local node_modules already committed, or rely on root deps
RUN npm install --omit=dev

EXPOSE 3000
CMD ["npm","start"]
