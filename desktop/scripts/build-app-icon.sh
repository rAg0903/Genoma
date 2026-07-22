#!/bin/bash
# Gera Genoma.icns para Genoma.app (macOS) a partir do logo oficial.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="${GENOMA_ICON_SRC:-$ROOT/desktop/assets/genoma-app-icon.png}"
ICONSET="$ROOT/desktop/assets/Genoma.iconset"
RES="$ROOT/Genoma.app/Contents/Resources"

if [ ! -f "$SRC" ]; then
  echo "Logo não encontrado: $SRC" >&2
  exit 1
fi

mkdir -p "$RES" "$ICONSET"
rm -f "$ICONSET"/*.png

sips -z 16 16 "$SRC" --out "$ICONSET/icon_16x16.png" >/dev/null
sips -z 32 32 "$SRC" --out "$ICONSET/icon_16x16@2x.png" >/dev/null
sips -z 32 32 "$SRC" --out "$ICONSET/icon_32x32.png" >/dev/null
sips -z 64 64 "$SRC" --out "$ICONSET/icon_32x32@2x.png" >/dev/null
sips -z 128 128 "$SRC" --out "$ICONSET/icon_128x128.png" >/dev/null
sips -z 256 256 "$SRC" --out "$ICONSET/icon_128x128@2x.png" >/dev/null
sips -z 256 256 "$SRC" --out "$ICONSET/icon_256x256.png" >/dev/null
sips -z 512 512 "$SRC" --out "$ICONSET/icon_256x256@2x.png" >/dev/null
sips -z 512 512 "$SRC" --out "$ICONSET/icon_512x512.png" >/dev/null
sips -z 1024 1024 "$SRC" --out "$ICONSET/icon_512x512@2x.png" >/dev/null

iconutil -c icns "$ICONSET" -o "$RES/Genoma.icns"
cp "$SRC" "$RES/genoma-logo.png"
touch "$ROOT/Genoma.app"

echo "Ícone actualizado: $RES/Genoma.icns"
