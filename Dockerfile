FROM node:20-alpine
WORKDIR /app

# Install prod deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy project
COPY . .

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
