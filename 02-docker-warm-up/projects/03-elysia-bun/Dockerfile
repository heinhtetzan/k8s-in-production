# Official Bun Alpine image
FROM oven/bun:1-alpine

WORKDIR /app

# Cache package dependencies
COPY package.json ./
RUN bun install --production

# Copy application source code
COPY . .

# Run as non-root user for container security
USER bun

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
