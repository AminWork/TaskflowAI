# ---------- Builder stage ----------
FROM golang:1.21-bookworm AS builder

WORKDIR /app

# Install build deps for CGO + SQLite
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libc6-dev libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build the binary (CGO enabled for SQLite/Postgres drivers)
RUN CGO_ENABLED=1 GOOS=linux go build -o main cmd/server/main.go

# ---------- Runtime stage ----------
FROM debian:bookworm-slim AS runtime

# Install runtime libs
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates libsqlite3-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /root/

# Copy binary and example env
COPY --from=builder /app/main .
COPY --from=builder /app/.env.example .env

EXPOSE 8080
CMD ["./main"]