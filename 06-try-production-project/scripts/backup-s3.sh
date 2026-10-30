#!/usr/bin/env bash
set -euo pipefail

BUCKET_NAME="shop-media-542601847638"
REGION="ap-southeast-2"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEST_DIR="backups/s3_media_${TIMESTAMP}"

mkdir -p "$DEST_DIR"

echo "☁️ Syncing S3 bucket (s3://$BUCKET_NAME) to $DEST_DIR..."
aws s3 sync "s3://$BUCKET_NAME" "$DEST_DIR" --region "$REGION"

TOTAL_FILES=$(find "$DEST_DIR" -type f | wc -l | tr -d ' ')
FOLDER_SIZE=$(du -sh "$DEST_DIR" | awk '{print $1}')

echo "✅ S3 media backup complete!"
echo "📁 Saved to: $DEST_DIR ($TOTAL_FILES files, $FOLDER_SIZE)"
