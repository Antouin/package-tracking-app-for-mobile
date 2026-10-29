#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js est introuvable. Installez Node.js depuis https://nodejs.org/ puis relancez ce script." >&2
  exit 1
fi
if ! command -v npx >/dev/null 2>&1; then
  echo "npx est introuvable. Reinstallez Node.js (npm/npx inclus) depuis https://nodejs.org/ puis relancez ce script." >&2
  exit 1
fi
echo "L'application sera disponible sur http://localhost:3000"
npx serve public &
server_pid=$!
sleep 2
if command -v open >/dev/null 2>&1; then
  open http://localhost:3000
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open http://localhost:3000 >/dev/null 2>&1 || true
fi
wait "$server_pid"
