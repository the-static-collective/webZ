# FIRST CIRCLE 002 — NO EMPTY HANDOFFS

**Failure witnessed in a real phone screenshot (2026-11-03):** "Advice on fixing something" → "Make a simple invitation." The workflow produced a card telling the visitor to do more administrative work, not help with the original problem.

The v001 interface proved that cards could be created, saved, returned, and reviewed as proposals. It did **not** prove useful work. This revision introduces a bounded practical-work lane.

## Corrected flow

```text
Choose Need / Offer / Play
→ state one small real need/offer/idea
→ one task-specific follow-up (tap an option or write)
→ system prepares actual local material
→ portable card contains the work, not a ticket for someone to make it
→ human uses it or explicitly does not
→ self-reported return
→ candidate reusable method ONLY after "worked" and non-unresolved work
```

The route is **deterministic, offline-capable JavaScript**, not live AI and not an external service.

## Bounded work that exists in code

- **Repair**: a declared first-safe-check guide for three common symptom classes (washer not draining, phone not charging, flat bicycle tire) and a computer-startup case. Unknown equipment gets an honest UNRESOLVED fault report, not invented instructions. No diagnosis or completed repair claimed.
- **Food**: a complete two-serving pantry recipe, with preparation instructions and ingredients. Availability and suitability are not assumed.
- **Volunteer coordination**: an already-written, specific invitation for a person to share if they decide. No recipient is contacted.
- **Offer**: already-written offer text including stated limits.
- **Play**: a playable ten-minute three-move exercise with a win condition. No imaginary participants are treated as real.
- **Unknown need**: partial prepared request, prominently UNRESOLVED. The system refuses to claim that the need itself is solved.

## Machine-verifiable guarantees

`tests/first-circle-work.test.mjs` proves the original failure route goes to the repair-detail question and generates a bounded procedure rather than another invitation. Other tests cover ready-to-send drafts, recipe, game rules, v0 backwards compatibility, export/import, false authority claims, and HOLD when a method has no successful self-reported return.

The v1 portable card includes `work: {title,body,status}` where status is exclusively `BOUNDED_GUIDE`, `READY_TO_USE_DRAFT`, or `UNRESOLVED`. v0 cards remain readable, clearly labeled LEGACY DRAFT, without silently adding fictional work.

A user may save an unencrypted card in origin-local browser storage or export it as JSON with an integrity checksum. The checksum is NOT a signature, and imported claims remain unverified.

## Human acceptance criterion

Give a first-time phone visitor the same original task. Ask: **What can you actually do now, or what usable thing was prepared for you?**

A green CI run is implementation proof, not human usefulness proof. Real device interaction, actual follow-through, safety review of domain recipes, and downstream review/response are separate gates.

**Cross-project invariant, locally adopted in webZ only:**

> Do the inch you can do. Witness the inch you cannot. Never hand the person a task to make the thing you could have already made.

See sibling JAR;VIS `docs/NO-EMPTY-HANDOFFS-001.md` for a portable, optional useful-delta audit. This webZ patch does not import JAR;VIS or inherit any external authority.
