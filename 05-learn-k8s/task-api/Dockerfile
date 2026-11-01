# Official lightweight Bun Alpine runtime
FROM oven/bun:1-alpine

WORKDIR /app

# Cache dependencies
COPY package.json bun.lock* ./
RUN bun install --production --frozen-lockfile || bun install --production

# Copy application source code
COPY . .

# Run as non-root user for security
USER bun

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["bun", "run", "src/index.ts"]

