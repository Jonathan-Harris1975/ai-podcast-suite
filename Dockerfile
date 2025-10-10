FROM node:22-alpine
WORKDIR /app

RUN npm i -g pnpm@9

# Copy full context so /services exists
COPY . .

# Install production deps
RUN pnpm install --prod --no-optional

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3   CMD node -e "fetch('http://localhost:3000/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
