FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY . .
RUN node fix-shorthand.js || echo "⚠️ fix-shorthand.js skipped"
RUN node sanitize-shorthand.js || echo "⚠️ sanitize-shorthand.js skipped"
EXPOSE 3000
ENV NODE_ENV=production
ENV HEARTBEAT_ENABLE=no
CMD ["node", "server.js"]
