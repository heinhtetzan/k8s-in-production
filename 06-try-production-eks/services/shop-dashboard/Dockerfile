FROM oven/bun:1 AS base

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Dev stage for local development with hot reloading
FROM base AS dev
COPY . .
ENV PORT=9002
EXPOSE 9002
CMD ["bun", "run", "dev"]

# Production builder stage
FROM base AS builder
COPY . .
ENV NODE_ENV=production
RUN bun run build

# Production runner stage
FROM oven/bun:1 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=9002
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/serve.ts ./serve.ts
EXPOSE 9002
CMD ["bun", "serve.ts"]
