#!/bin/bash
set -e

IMAGE="techtious-chat"
CONTAINER="techtious-chat"
ENV_FILE="$(dirname "$0")/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: .env file not found at $ENV_FILE"
  exit 1
fi

echo "==> Pulling latest code..."
git -C "$(dirname "$0")/.." pull

echo "==> Building Docker image..."
docker build -t "$IMAGE" "$(dirname "$0")"

echo "==> Stopping existing container (if any)..."
docker stop "$CONTAINER" 2>/dev/null || true
docker rm   "$CONTAINER" 2>/dev/null || true

echo "==> Starting container..."
docker run -d \
  --name "$CONTAINER" \
  --restart unless-stopped \
  --env-file "$ENV_FILE" \
  -p 127.0.0.1:1001:1001 \
  "$IMAGE"

echo "==> Waiting for server to start..."
sleep 2

echo "==> Health check..."
curl -sf http://localhost:1001/health && echo "" || echo "WARNING: health check failed"

echo ""
echo "Done. Container '$CONTAINER' is running."
echo "Logs: docker logs -f $CONTAINER"
