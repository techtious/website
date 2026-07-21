#!/bin/bash
set -e

IMAGE="techtious-chat"
CONTAINER="techtious-chat"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
LEADS_FILE="$SCRIPT_DIR/leads.jsonl"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: .env file not found at $ENV_FILE"
  exit 1
fi

# Ensure leads file exists on host so Docker can mount it
touch "$LEADS_FILE"

echo "==> Pulling latest code..."
git -C "$SCRIPT_DIR/.." pull

echo "==> Building Docker image..."
docker build -t "$IMAGE" "$SCRIPT_DIR"

echo "==> Stopping existing container (if any)..."
docker stop "$CONTAINER" 2>/dev/null || true
docker rm   "$CONTAINER" 2>/dev/null || true

echo "==> Starting container..."
docker run -d \
  --name "$CONTAINER" \
  --restart unless-stopped \
  --env-file "$ENV_FILE" \
  -p 127.0.0.1:1001:1001 \
  -v "$LEADS_FILE:/app/leads.jsonl" \
  "$IMAGE"

echo "==> Waiting for server to start..."
sleep 2

echo "==> Health check..."
curl -sf http://localhost:1001/health && echo "" || echo "WARNING: health check failed"

echo ""
echo "Done. Container '$CONTAINER' is running."
echo "Logs:  docker logs -f $CONTAINER"
echo "Leads: cat $LEADS_FILE"
