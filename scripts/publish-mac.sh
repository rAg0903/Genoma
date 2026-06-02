#!/usr/bin/env bash
# Gera GENOMA.app funcional para Mac.
# NOTA: Release (-c Release) falha ao arrancar (AOT). Usar Debug.
set -euo pipefail
cd "$(dirname "$0")/.."
dotnet publish -f net9.0-maccatalyst -c Debug -r maccatalyst-arm64
APP="$(pwd)/bin/Debug/net9.0-maccatalyst/maccatalyst-arm64/GENOMA.app"
echo ""
echo "✓ GENOMA.app: $APP"
echo "  open \"$APP\""
