FROM node:22-alpine
WORKDIR /app
COPY . .

# Run one unified cleaner before installing dependencies
RUN node safe-fix.js || echo "⚠️ safe-fix skipped"

RUN npm install --omit=dev

EXPOSE 3000
ENV NODE_ENV=production
ENV HEARTBEAT_ENABLE=no
CMD ["node", "server.js"]
