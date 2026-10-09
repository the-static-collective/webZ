# WEBZ GLEAN-001 — The Remainder Porch

**Gleaning is a different permission system from scavenging.**

The original [Static OS GLEAN-001](https://github.com/the-static-collective/static-os/pull/85)
ledger records owner-offered surplus, independently bounded collection review,
recipient purpose, operator reports and conserved *reported* remainder.
The [GrO GLEAN-001 quest](https://github.com/the-static-collective/GrO/pull/24)
lets a human discover the steward-declared offer without taking it.

WEBZ now adds a **separate `/glean/` porch**, rather than silently changing
FORAGE's `/forage/` source model.

## What is runnable

1. Load a local `static-os.glean-offer/v0` and the matching
   `gro.glean-held-quest/v0` from GrO. Browser code does **not**
   authenticate owner identity or legal permission; the original source
   offer is a bounded, human-entered statement.
2. `glean/contracts/glean-quest.mjs` is an exact source-pinned copy of
   the GrO verifier. `glean/contracts/stable.mjs` is the exact GrO
   stable canonicalizer. Tests verify both source Git blob hashes.
3. `glean/bridge.mjs` cold-replays the quest against the original offer
   before any postcard is prepared.
4. A specific informed human consent checkbox permits preparation of a
   bounded, unsigned public text: material type, purpose, unverified
   source fingerprint and a research-only invitation. Nothing is published.
5. The postcard omits site, steward, owner, specific material, recipient,
   harvest dates, freeform description, and full actor/quest identity.
   **Fingerprint correlation remains possible**, so the user must consent
   to including it.
6. The user can inspect/copy the exact text and *manually* paste it into
   WEBZ's existing first-party invitation porch. Every world retains its own
   HOLD/REFUSE/ADMIT rehearsal, with default carry NONE.
7. Source imports and postcards remain page-local. The service worker
   pre-caches **only public code and static assets**, not private JSON
   source imports. No backend, social publication, webhook, upload,
   inventory ledger or automatic transport is connected.

## Legal boundaries

The New Mexico Food Donors Liability Act defines a gleaner in relation
to **owner-donated agricultural crops for free distribution**:
https://law.justia.com/codes/new-mexico/chapter-41/article-10/section-41-10-2/
The statute does not authorize entry or automatically certify food safety.
Non-food surplus workshop gifts are a separate private-property transfer
category and cannot be represented as statutory agricultural gleaning.

## Development

```sh
npm test
npm run serve
# http://127.0.0.1:8080/glean/
python -m pip install -r tests/requirements.txt
python -m playwright install chromium
npm run test:browser
```

The browser suite includes mobile Chromium tests of missing consent,
source offer forgery, limited postcard output, private-field omission,
nested path operation and offline asset availability. The existing
Sanctuary and Orchard world manifests are untouched.

**No actual WEBZ transport or signed reLATTE receipt is created.**

## Future physical seam

A real collection requires independent owner/steward proof, entry/removal
rights, time and quantity scope, appropriate food handling or workshop
safety checks, and receiving human discretion. A real signed reLATTE
handoff and receiving organ can be built separately. Observed quantity,
reported quantity and actual received stock remain different facts.

NO SURPLUS CLAIM IMPLIES FREE ENTRY. NO QUEST IMPLIES COLLECTION.
NO HASH IMPLIES SIGNATURE. NO POSTCARD IMPLIES DONATION.
NO WEBZ DOOR IMPLIES ACCEPTANCE OR ROBOT MOTION.
