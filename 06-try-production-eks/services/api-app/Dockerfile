FROM oven/bun:1 AS base

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Dev stage for local development with hot reloading
FROM base AS dev
COPY . .
ENV PORT=9000
EXPOSE 9000
CMD ["bun", "run", "dev"]

# Production runner
FROM base AS prod
COPY . .
ENV NODE_ENV=production
ENV PORT=9000
EXPOSE 9000
CMD ["bun", "run", "src/index.ts"]