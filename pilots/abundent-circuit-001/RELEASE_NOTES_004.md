# Circuit 004 — The Lantern Commons / Minecraft native carrier

**Milestone:** Browser → fixed operator-authorized Minecraft Java RCON native server → in-world redstone changes → fresh game-state readback → actual GHoT `system.hash` receipt → local Circuit `GAME_ONLY_HOLD` reference.

**Real mechanics:** ten native Minecraft blocks; separate harbor blue/lime markers; real redstone lamp/lever pairs; OFFER/NEED/BUILD/QUESTION stations; after both lights are verified and explicit confirmation, a single center sea lantern lights the proposed Festival Foundry.

**Safety gates:** only localhost RCON (never arbitrary remote hostname), explicit `ABUNDENT_MC_WORLD_AUTHORIZATION=EMPTY_TEST_WORLD`, hidden password environment, bounded origin, all target positions preflight as air, no overwrite-on-replay, strict Host and Origin gates, never import arbitrary game commands or setblock types, no automatic human/economic effects, no Full Measure Deed, no partner claims or player identity verification. The local bridge permits only readback, stage and celebrate.

**Proof classes:** unit tests use FakeMinecraft and *are not* proof of game execution; GitHub CI explicitly downloads and verifies official Mojang server JAR, uses Java and independent native GHoT checkout with two actual in-game powered levers, and captures game-only bounded receipt. A human local Minecraft field trial remains separate.

**Existing ancestry:** reLATTE `experiment/riff-raft-minecraft-007-two-custodians` contains actual official Minecraft 26.1.1 redstone causal evidence and P-256 archival signature custody, with game-world `HOLD` and no real-world admission. Circuit 004 is a *new in-game composition for festival cooperator lamps*, not a verification or replay of that original signed 007 packet; source ancestry is credited without appropriating its signatures/claims.

**What remains:** two independently administered Minecraft servers (not two levers), real multiplayer permissioned host workflows, native reLATTE P-256 crossing signed by distinct destination receivers, real human witness authorization, physically independent hardware, optional worldbuilder equipment/fabrication, and community adoption.
