FROM node:22-alpine
WORKDIR /app

# Copy and fix only your source before installing dependencies
COPY package*.json ./
COPY fix-shorthand.js sanitize-shorthand.js ./
COPY ./routes ./routes
COPY ./services ./services
COPY ./utils ./utils
COPY ./server.js ./server.js

# Run fixers only on your app files
RUN node fix-shorthand.js || echo "⚠️ fix-shorthand skipped"
RUN node sanitize-shorthand.js || echo "⚠️ sanitize-shorthand skipped"

# Then install dependencies cleanly
RUN npm ci --omit=dev || npm install --omit=dev

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "server.js"]
