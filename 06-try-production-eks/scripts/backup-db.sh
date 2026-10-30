#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Prioritize local project .kubeconfig if it exists, otherwise find shop-eks-cluster context
if [ -f "$PROJECT_ROOT/.kubeconfig" ]; then
  export KUBECONFIG="$PROJECT_ROOT/.kubeconfig"
fi

TARGET_CONTEXT="${KUBE_CONTEXT:-$(kubectl config get-contexts -o name 2>/dev/null | grep 'shop-eks-cluster' | head -n 1 || echo "")}"
KUBECTL="kubectl"
if [ -n "$TARGET_CONTEXT" ]; then
  KUBECTL="kubectl --context $TARGET_CONTEXT"
fi

mkdir -p "$PROJECT_ROOT/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="$PROJECT_ROOT/backups/shop_backup_${TIMESTAMP}.sql"
POD_NAME="pg-backup-runner-$(date +%s)"

echo "🚀 Fetching RDS connection secret from EKS cluster..."
DB_URL=$($KUBECTL get secret postgres-secret -n default -o jsonpath='{.data.DATABASE_URL}' | base64 --decode)

echo "📦 Launching lightweight backup container..."
$KUBECTL run "$POD_NAME" \
  --image=postgres:16-alpine \
  --restart=Never \
  -n default \
  -- sleep 3600 > /dev/null

# Ensure pod is deleted on script exit
trap "$KUBECTL delete pod '$POD_NAME' -n default --wait=false --ignore-not-found=true > /dev/null 2>&1" EXIT

echo "⏳ Waiting for container to be ready..."
$KUBECTL wait --for=condition=ready "pod/$POD_NAME" -n default --timeout=60s > /dev/null

echo "💾 Streaming PostgreSQL dump to $OUTPUT_FILE..."
$KUBECTL exec "$POD_NAME" -n default -- \
  pg_dump "$DB_URL" --clean --if-exists --no-owner --no-privileges > "$OUTPUT_FILE"

FILE_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
echo "✅ Database backup complete!"
echo "📁 Saved file: $OUTPUT_FILE ($FILE_SIZE)"
