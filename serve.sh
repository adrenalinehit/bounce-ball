#!/usr/bin/env sh
set -eu

PORT="${PORT:-8080}"

echo "Serving on http://localhost:${PORT}"
echo "Press Ctrl+C to stop"

python3 -m http.server "${PORT}"


