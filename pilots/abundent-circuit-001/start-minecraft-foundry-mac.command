#!/bin/bash
# CIRCUIT 004: local Minecraft JAVA RCON + ACTUAL GHoT; NO WORLD MODIFICATION
# until the operator separately approves STAGE from the browser.
set -e
cd "$(dirname "$0")"

if ! command -v python3 >/dev/null 2>&1 || ! python3 -c 'import sys; assert sys.version_info >= (3,10)' 2>/dev/null; then
  echo 'Python 3.10+ required on this machine. Nothing is installed automatically.'
  read -r -p 'Press Enter to close ... ' _
  exit 1
fi
if [ -z "${GHOT_REPO:-}" ]; then
  for candidate in "../GHoT" "$HOME/GHoT" "$HOME/static/GHoT" "$HOME/Documents/GHoT"; do
    if [ -f "$candidate/ghot/reference_node.py" ]; then GHOT_REPO="$candidate";break;fi
  done
fi
if [ ! -f "${GHOT_REPO:-}/ghot/reference_node.py" ] && command -v osascript >/dev/null 2>&1; then
  GHOT_REPO="$(osascript -e 'POSIX path of (choose folder with prompt "Select your separate GHoT repository folder")' 2>/dev/null || true)"
fi
if [ ! -f "${GHOT_REPO:-}/ghot/reference_node.py" ]; then
  echo 'Need a separate GHoT checkout. Download https://github.com/the-static-collective/GHoT'
  read -r -p 'Press Enter to close ... ' _
  exit 1
fi
printf '\n=== MINECRAFT REHEARSAL / CIRCUIT 004 ===\n'
printf 'For your OWN EMPTY dedicated Minecraft Java creative test server ONLY.\n'
printf 'Do not use on a world with other players or existing builds.\n'
printf 'RCON must bind to 127.0.0.1 locally; NEVER forward RCON publicly.\n'
printf 'Requires a compatible separate Minecraft Java server and RCON already running.\n'
printf 'Enter the exact phrase EMPTY_TEST_WORLD to continue: '
read -r reply
if [ "$reply" != 'EMPTY_TEST_WORLD' ]; then echo 'Not authorized. Nothing started.';exit 1;fi
printf 'Local RCON port [25575]: '
read -r rcon_port
rcon_port="${rcon_port:-25575}"
if ! [[ "$rcon_port" =~ ^[0-9]+$ ]]; then echo 'Invalid port';exit 1;fi
printf 'Local dedicated-server RCON password (hidden): '
read -r -s ABUNDENT_MC_RCON_PASSWORD
printf '\n'
if [ -z "$ABUNDENT_MC_RCON_PASSWORD" ]; then echo 'No RCON password; refusing.';exit 1;fi
export ABUNDENT_MC_RCON_PASSWORD
export ABUNDENT_MC_WORLD_AUTHORIZATION=EMPTY_TEST_WORLD
python3 build.py
printf '\nThe browser can STAGE ten blocks at (0,70,0) only after a second confirmation.\n'
printf 'Exit this Terminal with Ctrl+C to stop the bridge.\n'
(sleep 2; open 'http://127.0.0.1:8878/' >/dev/null 2>&1 || true) &
exec python3 ghot_local_server.py --ghot "$GHOT_REPO" --port 8878 \
  --minecraft-empty-demo-world --minecraft-rcon-port "$rcon_port" \
  --minecraft-origin-x 0 --minecraft-origin-y 70 --minecraft-origin-z 0
