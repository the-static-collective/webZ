# IGNITION-012 — The first 24-hour field kit

**Status:** independent, static, account-free experimental UI on the protected \`feature/jarvis-ignition-012\` branch; **not a public production release or proof that a field action happened**.

## Core question

> Given a concrete public-safe question, the capacity somebody voluntarily says they can contribute now, and what our source-verified graph actually contains: **what useful, reversible artifact can we make in 15 minutes, and what human-reviewed crossing could occur within 24 hours?**

The response is **a physical or downloadable card**, not another generic recommendation and not an automatic task execution. Bring that card to an already-interested person. Invite correction rather than demanding a commitment. Record the return only after it really happens.

## Why this first version is deliberately small

- \`/ignite/\` reads \`/town/graph.json\` (the existing emitted \`free-graph.packet/v0\` from source-owned \`town/catalog.json\`). It refuses absent, malformed or unsupported packets. Eight hypothetical editorial options remain hypothetical.
- The human selects one kind of present capacity: listen, print, organize, research, build, create, or witness. No real person's identity, phone, email or address is entered.
- The generated sheet includes a ready-to-read invitation, a first-15-minute physical/digital artifact, a next-90-minute action, a proposed next-24-hour crossing, the non-negotiable human/safety gate, a definition of possible evidence, and a blank return witness.
- \`auto\` only selects a graph seed when actual question-word overlap exists. Unknown independent questions HOLD instead of forcibly redirecting every topic to Static Collective.
- The browser has an explicit Make button, Print, Save Text, and Save JSON. Nothing is auto-posted, auto-enrolled, booked, sent to AI or put into the proposal inbox. The result's \`DRAFT_READY_NOT_EXECUTED\` is not proof of an actual completed act.
- A real-time event, person, ability, promise, permission, and completed task remain **not established by the graph**. The paper form is intended for a human to fill in *later*, not a synthetic witness.

## First intended field experiment: food-access question

From \`/ignite/\`, choose grocery / food access and \`I can write, draw or print\`. Ask the machine to print one food-access question card for a willing organizer to review. At the meeting, bring that question to a person, not a model. The first real win is a consented correction, a known practical blocker, or a voluntary commitment to a *specific* next step. If nobody responds, document that instead.

This site is not official Coalition, university, food cooperative, environmental group, church or government infrastructure.

## Explicit not-yet

- Live source discovery and updated situation-aware matching come from DISCOVERY-011 behind operator-only review; IGNITION uses only the published static graph.
- Verified human offers and availability require independently permissioned participation records. People previously encountered by the operator are **not** published into graph or preassigned to tasks.
- Native ALEX, 3rdi, LOADOUT, GHoT, GRAFT, Penny and reLATTE are **not executed by this browser page**.
- This kit cannot assert that the Static Collective performed fieldwork. A signed, attributable field witness and human disposition would be later separate crossings.

## Review and release

Run \`node --test test/ignition.test.mjs\` within \`ask-jarvis\` with Node 22+. Independently inspect \`/ignite/\` in a protected preview and confirm browser printing and TXT/JSON saving on a real phone. No production aliases should be moved merely because a build passes. Public rollout should retain a fallback when the graph CDN is unavailable and verify license/hosting constraints for a real community launch.

**Ignition is not the number of proposals. It is the number of small acts honestly completed and carried forward by people who chose them.**
