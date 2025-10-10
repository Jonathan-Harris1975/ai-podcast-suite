# Shiper-ready Dockerfile (no YAML, Node 22, npm install)
FROM node:22-alpine

WORKDIR /app

# Install only prod deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy source
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
