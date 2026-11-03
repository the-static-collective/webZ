#!/bin/bash
# Double-clickable, local-only launcher for an existing GHoT checkout.
# This executes GHoT's actual reference node with its own private record store.
set -e
cd "$(dirname "$0")"

find_ghot() {
  for candidate in "../GHoT" "$HOME/GHoT" "$HOME/static/GHoT" "$HOME/Static/GHoT" "$HOME/Documents/GHoT"; do
    if [ -f "$candidate/ghot/reference_node.py" ]; then
      GHOT_REPO="$candidate"; return 0
    fi
  done
  return 1
}

if [ -z "${GHOT_REPO:-}" ]; then find_ghot || true; fi
if [ -z "${GHOT_REPO:-}" ] && command -v osascript >/dev/null 2>&1; then
  echo "Select the existing GHoT GitHub checkout folder in the Finder dialog."
  GHOT_REPO="$(osascript -e 'POSIX path of (choose folder with prompt "Select your GHoT repository checkout (the folder containing ghot/reference_node.py)")' 2>/dev/null || true)"
fi
if [ ! -f "${GHOT_REPO:-}/ghot/reference_node.py" ]; then
  echo "GHoT checkout not found. Download/clone https://github.com/the-static-collective/GHoT then open this launcher again."
  read -r -p 'Press Return to close... ' _
  exit 1
fi
if ! command -v python3 >/dev/null 2>&1; then
  echo 'Python 3.10 or newer is required; no installation is performed by this launcher.'
  read -r -p 'Press Return to close... ' _
  exit 1
fi
if ! python3 -c 'import sys; assert sys.version_info >= (3,10)' >/dev/null 2>&1; then
  echo 'GHoT requires Python 3.10 or newer. No installation performed.'
  read -r -p 'Press Return to close... ' _
  exit 1
fi
python3 build.py
printf '\nLocal-only browser: http://127.0.0.1:8878/\n'
(sleep 2; open 'http://127.0.0.1:8878/' >/dev/null 2>&1 || true) &
exec python3 ghot_local_server.py --ghot "$GHOT_REPO" --port 8878
