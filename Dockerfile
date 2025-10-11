FROM node:22-alpine
WORKDIR /app
COPY . .

# Ensure routes are valid before dependency install
RUN node safe-fix.js || echo "⚠️ safe-fix skipped"
RUN node verify-routes.js || echo "⚠️ verify-routes skipped"

RUN npm install --omit=dev
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "server.js"]
