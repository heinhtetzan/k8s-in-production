# ==========================================
# Stage 1: Build the Rust binary
# ==========================================
FROM rust:alpine AS builder

RUN apk add --no-cache musl-dev

WORKDIR /app

# Cache dependencies
COPY Cargo.toml Cargo.lock* ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Copy real source code
COPY src ./src
RUN touch src/main.rs && cargo build --release

# ==========================================
# Stage 2: Minimal Alpine runtime
# ==========================================
FROM alpine:3.19

RUN adduser -D -u 1000 appuser

WORKDIR /app

COPY --from=builder /app/target/release/rust-sample-api /app/server

USER appuser

EXPOSE 8082

CMD ["/app/server"]
