FROM node:22-alpine
WORKDIR /app

RUN npm i -g pnpm@9

# Copy full context so /services exists
COPY . .

# Install production deps
RUN pnpm install --prod --no-optional

# ---- Back-compat: provide a 'services' bare specifier alias ----
# Some older bundles import 'services/...'; make sure it works by copying
# the local ./services tree into /app/node_modules/services.
RUN mkdir -p node_modules && rm -rf node_modules/services && cp -r services node_modules/services || true

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3   CMD node -e "fetch('http://localhost:3000/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
