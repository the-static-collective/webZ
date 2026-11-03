#!/bin/bash
# Abundent Blueprint Foundry 005 — local-only; no background daemon or account required.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"
if command -v python3 >/dev/null 2>&1; then PYTHON="$(command -v python3)"; else
 echo 'Python 3.10+ is required. Open README.md for setup.'
 read -r -p 'Press Enter to close.' _
 exit 1
fi
"$PYTHON" -c 'import sys; assert sys.version_info >= (3,10), "Python 3.10+ required"' || { read -r -p 'Press Enter to close.' _; exit 1; }
echo 'Starting the BLUEPRINT FOUNDRY on this computer only.'
echo 'Browser address: http://127.0.0.1:8890/'
echo 'No cloud uploads and no automatic Minecraft world writes.'
echo 'Stop it using Ctrl+C in this Terminal window.'
(sleep 1; open 'http://127.0.0.1:8890/' >/dev/null 2>&1) &
exec "$PYTHON" server.py --port 8890
