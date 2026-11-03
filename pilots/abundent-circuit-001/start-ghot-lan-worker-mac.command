#!/bin/bash
# Run on Computer B, the deliberately designated worker. Only system.hash.
set -e
cd "$(dirname "$0")"
find_ghot() {
  for candidate in "../GHoT" "$HOME/GHoT" "$HOME/static/GHoT" "$HOME/Static/GHoT" "$HOME/Documents/GHoT"; do
    if [ -f "$candidate/ghot/reference_node.py" ]; then GHOT_REPO="$candidate"; return 0; fi
  done
  return 1
}
if [ -z "${GHOT_REPO:-}" ]; then find_ghot || true; fi
if [ -z "${GHOT_REPO:-}" ] && command -v osascript >/dev/null 2>&1; then
  echo "Select your independent GHoT checkout (folder containing ghot/reference_node.py)."
  GHOT_REPO="$(osascript -e 'POSIX path of (choose folder with prompt "Choose your GHoT repository checkout")' 2>/dev/null || true)"
fi
if [ ! -f "${GHOT_REPO:-}/ghot/reference_node.py" ]; then
  echo "No GHoT checkout. Download https://github.com/the-static-collective/GHoT and extract it first."
  read -r -p 'Press Return to close... ' _
  exit 1
fi
if ! command -v python3 >/dev/null 2>&1 || ! python3 -c 'import sys; assert sys.version_info >= (3,10)' 2>/dev/null; then
  echo "Python 3.10+ required. This launcher does not install Python."
  read -r -p 'Press Return to close... ' _
  exit 1
fi
printf '\n========== CIRCUIT 003 / COMPUTER B =========\n'
echo 'This will open an AUTHENTICATED but plain-HTTP hash-only worker on your local network.'
echo 'Use only a Wi-Fi/LAN you trust; the remote task text is stored in GHoT records.'
echo 'NEVER paste private notes, passwords, contact details or beneficiary information.'
if command -v ipconfig >/dev/null 2>&1; then
  echo 'Possible LAN IPs:'
  for nic in en0 en1 en2; do
    address="$(ipconfig getifaddr "$nic" 2>/dev/null || true)"
    if [ -n "$address" ]; then echo "  $nic: $address (enter http://$address:7789 on Computer A)"; fi
  done
fi
printf '\n'
read -r -p 'Type YES to open the worker on the trusted LAN: ' approval
if [ "$approval" != 'YES' ]; then echo 'No network worker started.'; exit 0; fi
printf '\nComputer B worker will print a PRIVATE pairing key below.\n'
exec python3 -u ghot_lan_worker.py --ghot "$GHOT_REPO" --allow-lan --port 7789
