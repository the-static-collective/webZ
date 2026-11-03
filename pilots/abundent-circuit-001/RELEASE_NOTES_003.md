# ABUNDENT CIRCUIT 003 — TWO-COMPUTER NATIVE GHoT FIELD PREPARATION

**Prepared:** November 3, 2026 · **Status:** pilot, opt-in LAN only.

The original Circuit 002 proof was a native GHoT task on the same physical computer.
003 adds a *second, independently running worker process*, a bounded LAN
transport, manual HMAC pairing, node-id pinning and return of a native `ghot.receipt`.
All activity is triggered by an explicit user action. There is no scheduler,
public service, financial transaction, file upload, general remote execution,
human identity or automatically earned Full Measure Deed.

## Run with two computers (Mac-first)

Extract this ZIP on **Computer A** (your operator Mac) and **Computer B** (the
worker Mac/Linux machine). Download a separate GHoT checkout on each device
from the original project; do not download a substitute copy or check in local
private keys. Python **3.10 or newer** is required. The first GHoT run may
require the system OpenSSL command to generate native identity information.

1. Connect both computers to **the same private, trusted Wi-Fi/LAN**. Do not
   enable on public/cafe or guest Wi-Fi. Do not configure router port forwarding.
2. On **Computer B**, double-click `start-ghot-lan-worker-mac.command`. Select the
   genuine GHoT checkout if requested. Read the warning and type `YES` to
   open a network listener. Note the printed private IP address (e.g.,
   `192.168.1.42`), port `7789`, and one-time private 64-character pairing key.
   Leave that Terminal window running. The worker prints the native GHoT node
   id, so you can compare it to the result shown on A.
3. On **Computer A**, double-click `start-native-ghot-mac.command`. Choose its
   GHoT checkout and open `http://127.0.0.1:8878/` locally if needed.
4. Create/choose a local harbor, select **06 · Compute**, find **Native GHoT —
   second computer**, enter `http://B_PRIVATE_IP:7789`, paste the key from B,
   then press **Pair**. The key is retained **only in A's running bridge memory**;
   it is not saved in the Circuit notebook or sent over the LAN.
5. Enter the non-sensitive phrase `ONE TABLE → ONE OTHER COMPUTER` and click
   **Execute on the second GHoT computer**. A runs a WebCrypto SHA-256, the local
   bridge sends a bounded HMAC-signed request to B, B invokes **its real**
   `GHoT/ghot/reference_node.py hash`, B persists its native task and receipt,
   the bridges verify the return and exact digest, and A displays a typed native
   GHoT LAN receipt. Reload and check that only the digest/receipt refs remain.
6. Click **Unpair** on A. Stop both launchers with `Ctrl+C` and close their
   Terminal windows. Stop the worker on B to close its LAN port.

For Linux, replace the double-click scripts with:

**Worker B**:
`python3 ghot_lan_worker.py --ghot /absolute/path/to/GHoT --allow-lan --port 7789`

**Operator A**:
`python3 build.py && python3 ghot_local_server.py --ghot /absolute/path/to/GHoT --port 8878`

The worker cannot be paired from the public Vercel preview. This requires the
localhost operator bridge and an independent worker process. No account is
required and the Circuit public browser app cannot reach a worker directly.

## Security and honest measurement

- Only the native `system.hash` executor is exposed, via a *separate worker*.
  The native GHoT LAN `/task` service is not opened by this field kit.
- Pairing key is 256 random bits. Both request and response have HMAC-SHA256
  integrity tags; requests have a bounded clock window and nonce replay block.
  The key itself never crosses the LAN. The IP is entered manually; discovery
  is not implicit trust. The node id is bound to pairing for that session.
- Plain HTTP is **not encrypted**. Network observers could see the test text.
  GHoT also persists the text on B in `GHOT_HOME/records`.
- The launcher opens B's listener only after the operator types `YES`.
  A's browser bridge remains bound to `127.0.0.1`; no CORS permissions or
  arbitrary redirects. Remote addresses must be numeric RFC1918 IPv4 literals
  (or `127.0.0.1` for isolated CI testing).
- Runtime pairing is forgotten when A's bridge stops. No automatic retries,
  resource bargaining, file conversion, actual distributed job scheduler or
  direct GHoT worker identity signature conformance is claimed.
- The WebCrypto digest, local bridge HMAC check, native GHoT receipt, and
  browser persistence are distinct. A confirmed digest is **not** proof of an
  independent physical computer until someone actually operates two devices.
- A GHoT receipt is **not** a Full Measure Deed. There is no reLATTE-native
  signed parcel emitted by this bridge and no community permission transfer.

## Verification gates

- Local Python, Node and browser syntax tests available in the bundle.
- GitHub CI runs two independent worker/bridge server processes against the
  **pinned actual GHoT source**, plus an actual Chromium browser.
- A CI loopback test establishes *process separation* and authentic donor
  execution, **not two separate physical machines**.
- Actual two-computer field receipt remains the next human-run milestone.

If permission, OpenSSL, Mac Python or firewall setup fails: stop. Do not ask
users to disable OS firewall broadly; use a named, scoped local network rule
or an alternative trusted network, with explicit operator approval.
