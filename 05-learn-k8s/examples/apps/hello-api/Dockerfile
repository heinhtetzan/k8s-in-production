FROM oven/bun:1-alpine
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN bun install --production

# Copy app code
COPY . .

# Run as non-root user
USER bun

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]

