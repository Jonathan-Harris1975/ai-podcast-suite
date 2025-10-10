FROM node:22-alpine
WORKDIR /app
COPY . .
RUN corepack enable pnpm
RUN pnpm install --prod
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
