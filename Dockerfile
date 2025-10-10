FROM node:22-alpine
WORKDIR /app
COPY package*.json ./

# Add a build arg to bust cache when needed
ARG CACHEBUST=1
RUN npm ci --omit=dev || npm install --omit=dev

COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
