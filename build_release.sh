#!/bin/bash
# ================================================================
# AI Podcast Suite — Release Builder (v2025.10.10-Final)
# Dockerfile-only / Node 22 / pnpm / Shiper-ready
# ================================================================
set -e

OUT="ai-podcast-suite-perfect.zip"
ROOT="."

echo "🔧 Building release zip..."
zip -r "$OUT" "$ROOT" -x "*.git*" "node_modules/*" "*.env" "*.DS_Store" > /dev/null

echo "🔐 Computing SHA-256..."
HASH=$(shasum -a 256 "$OUT" | awk '{print $1}')
echo "SHA-256: $HASH"

# Append to _build-log.txt
{
  echo
  echo "──────────────────────────────"
  echo "Integrity Summary"
  echo "──────────────────────────────"
  echo "Archive Name: $OUT"
  echo "Archive SHA-256:  $HASH"
  echo "Verification: run 'shasum -a 256 $OUT'"
  echo "──────────────────────────────"
  echo "✅ Build Status: PASSED (v2025.10.10-Final)"
} >> "_build-log.txt"

# Update README integrity section
if command -v sed >/dev/null 2>&1; then
  sed -i'' -e "s/(to be filled after build)/$HASH/" "README.md" || true
fi

echo "📦 Release ready: $OUT"
