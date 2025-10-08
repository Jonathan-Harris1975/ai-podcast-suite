# ---------- Stage 1: build layer ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

# ---------- Stage 2: runtime layer ----------
FROM node:20-alpine
WORKDIR /app

# Copy production dependencies only
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Shiper automatically sets NODE_ENV=production
ENV NODE_ENV=production
ENV PORT=3000

# Expose the app port
EXPOSE 3000

CMD ["npm", "start"]
