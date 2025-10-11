FROM node:22-alpine
WORKDIR /app
COPY . .

# Run cleanup scripts only on your source (not node_modules)
RUN node fix-shorthand.js || echo "⚠️  fix-shorthand skipped"
RUN node sanitize-shorthand.js || echo "⚠️  sanitize-shorthand skipped"

# Then install dependencies cleanly
RUN npm ci --omit=dev || npm install --omit=dev

EXPOSE 3000
ENV NODE_ENV=production
ENV HEARTBEAT_ENABLE=no
CMD ["node", "server.js"]
