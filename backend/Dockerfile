# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install build tools for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Install build tools for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

# Expose the application port
EXPOSE 8000

CMD ["npm", "start"]
