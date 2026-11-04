# COMMONS SELF-PLAY 002 — Evolution league

**Location:** `/commons-evolve/` · **No other people required.**

This is a deterministic, strictly fictional strategy search inspired by Lantern Minecraft's versioned worlds, director events, accountable physical resources and independent timelines. It does **not** run Minecraft, an LLM, connected AI agents, reLATTE signed crossings, Supabase, or actual human exchanges.

A single operator can seed eight policy candidates, run four training worlds plus two separate holdout worlds, inspect the winning bounded strategy, then evolve up to 12 generations. Each generation keeps two elite strategies unchanged, mutates exactly one gene in each inherited challenger, and admits one random challenger. A separate world-director trial replays the current champion against isolation on the same seeded 12-agent village with normal, drought, storm or combined weather. Mobile UI shows 8×8 maps, simulated meals met and missed, resource spoilage, refusals, transfers, bridge builds, and exports a labeled fictional JSON cartridge.

Five genes are bounded: reserve (0–3 food), reach (1–6 Manhattan tiles), max assistance per donor per day (1–3), bridge permission, and ordering (nearest / scarce-first). Donors carry immutable scripted `willing` flags; no protocol can override their refusal. Resource conservation checks execute on every tick.

**Fitness is a chosen testing objective**, not an empirically validated moral or economic theory: food consumed +8, hunger -10, spoilage -4, effort -0.6, bridge builds -2, lowest-fed resident +3. Holdout scores are visible so failure to generalize is not hidden. No actual money or Jubilee credits are issued.

Run `node --test tests/commons_evolve.test.mjs`, full `npm test`, and `npm run test:browser`. The application does not auto-publish any policy to a real partner. It is stacked on Commons Self-Play 001 PR #255.
