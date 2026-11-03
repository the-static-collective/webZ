# CIRCUIT 004 · LANTERN COMMONS — GAME-WORLD FIELD CARD

**Scope: Minecraft Java 26.1.1 / dedicated empty test world / RCON on the same machine (or an explicitly established SSH loopback tunnel) / native GHoT.** Nothing in this kit creates a real festival, a resource transfer, a Deed, an identity record, or a monetary claim. Two harbor lamps can be lit by the same player; distinct-person independence is not established by Minecraft block state.

## First proof without touching a local Minecraft server

See the verified GitHub Actions run for `Abundent Circuit 004 — native Minecraft Java + GHoT`. It downloads the **official Mojang 26.1.1 server jar**, verifies the SHA-1 from Mojang's published manifest, creates a disposable localhost-only flat creative world, runs actual RCON commands and reads the native server's redstone lamp states. It uses GHoT's independent native `reference_node.py hash`, verifies the output digest, records an explicit HOLD and reports game-only evidence. No official server JAR is redistributed in this kit.

## Private physical field trial (never on a populated world)

1. Prepare a **brand-new, dedicated, empty** Minecraft Java creative server on a compatible machine. You control it and you have permission to change the staging region. Back it up anyway. Configure RCON to be reachable on localhost **only**, e.g. via trusted local service or an explicit SSH localhost tunnel. Never enable public RCON or router port-forwarding. Protect the RCON password and avoid putting it in shell history.
2. Obtain a separate `the-static-collective/GHoT` checkout with `ghot/reference_node.py`, Python 3.10+ and OpenSSL available. The native GHoT checkout is *not* embedded in this zip.
3. On the operator computer, double-click `start-minecraft-foundry-mac.command`. If macOS blocks execution, open it in a text editor and inspect it; do not override operating-system security controls blindly. It asks you to enter `EMPTY_TEST_WORLD`, the localhost RCON port and the password **hidden in Terminal**; no secret is entered into a website.
4. In the local browser at `http://127.0.0.1:8878/`, create a fictional harbor or load the two-harbor demo. Open `08 · Minecraft World` and check that the bridge reports **ARMED**.
5. Click **Authorize and stage the 10-block Harbor kit**. This checks that the eleven target positions at the designated origin are `air` before writing ten fixed anchor blocks. If anything is occupied, it **refuses**. There is no bulk `/fill`, no unbounded server console, and no auto-reset of occupied locations.
6. Enter **the same Java server** as a creative-mode player. Fly near `(0,70,0)` and find a **blue harbor** at `(-8,70,0)` and **lime harbor** at `(8,70,0)`, with lamps/lever pairs nearer the center. The four prompt blocks at z=5 represent **OFFER, NEED, BUILD, QUESTION**.
7. Flip the lever **on top of each redstone lamp**, as an in-game action. One lever does not complete the joint game rehearsal. After both lamps are visibly lit, click **Observe the real world → native GHoT hash** in Abundent. The operator checks the actual block states and passes a compact game observation into a genuinely executed GHoT `system.hash` task.
8. If both actual in-game lamps are powered, click **Ignite the game festival**. This explicitly places **one sea lantern** at `(0,70,0)`, reads it back from the server, computes another GHoT receipt and records `GAME_ONLY_HOLD` in the currently selected harbor's browser notebook.
9. Reload the browser: the game evidence reference should persist. In `03 · Build & Grow`, **no new Full Measure Deed or Harvest** is awarded. Use **Backup** to preserve local records privately, if needed.
10. Stop the bridge with Ctrl+C. Stop the Minecraft dedicated server normally. RCON password and player identities are never included in public game evidence.

### Exact bounds and safe semantics

- Origin default `(0,70,0)`; footprint X = [-8,+8], Y = [70,71], Z = [0,5]. Set a different origin **only via operator CLI**, with no user-entered arbitrary command in the browser.
- Fixed Minecraft commands: `forceload add/remove`, `execute if block ... run seed` (read-only), and `setblock` for ten fixed whitelisted anchors plus an optional single final sea lantern.
- All Minecraft operations require live, local RCON credentials; no network server is exposed from the local Abundent browser bridge.
- RCON is an administrator-level game interface even though this adapter limits commands. NEVER expose it to an untrusted network or use it on a public server.
- GHoT's signed or unsigned receipts show computational occurrence, not the identity of a player, human permission, or authenticity of any wider world. All resulting reLATTE-like game results remain `HOLD` for separate interpretation.
- A real world / festival organizer can choose to inspect game evidence, but no game-world achievement can automatically create a real-world authorization or Full Measure accomplishment.

### Compatibility note

A **Mid-2012 MacBook Pro on macOS Mojave 10.14.6** is unlikely to be capable of running the contemporary **Minecraft Java 26.1.1 dedicated server** and its required current Java runtime. That old Mac can potentially run this Python/browser operator if Python 3.10+ is installed, while the *Minecraft server* runs on a compatible newer Linux or Mac computer. In that arrangement, establish a localhost-only **SSH tunnel** for RCON rather than exposing its administrative port to the LAN. On an old Mac that cannot meet those requirements, use the CI proof first; the ZIP contains no server binary or Java installer.

## What this actually proves

A browser can request a bounded **in-game** plan, an explicitly authorized operator can stage a small server-observed Minecraft world, game players can toggle real redstone lamps, the server can be queried independently on each request, and native GHoT can process the observation. The result is a technical, game-only reproduction rehearsal, **not** a live intercommunity social network, land/ecology proof, or economically valid token system.
