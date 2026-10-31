# The Question Arcade — experiment 001

An inspectable, **real** local learning game: teach a 3-nearest-neighbors classifier with fictional seed specimens, compare accuracy on 45 separate held-out examples, unlock a time-based prediction scout, and review fictional Waseca-style need/offer matches.

## Play locally

With Node 22+ installed:

```sh
npm run serve
# Visit http://127.0.0.1:8765/arcade/
```

Or any static HTTP server rooted in this directory (`python -m http.server 8080`). `npm test` runs deterministic engine tests. No build or installation is needed. Online, the visual layer uses **p5.js**; offline, a local Canvas fallback keeps the entire game playable. The core learning engine works without p5 or an LLM. The p5.js library itself is loaded from jsDelivr; it is not vendored into this archive.

## Actual mechanics

1. **Observe** a specimen (numeric hue / pointedness / size).
2. **Guess** with a 3-NN classifier. The closest examples and weighted vote share are visible in the explanation.
3. **Teach** the true label. Wrong clicks don't enter training. The fictional training oracle is deliberately known to the game; this is a pedagogical simulation, not real-world ground truth.
4. Unlock **idle scouting** after six accepted examples covering three categories and >=60% accuracy. The scout makes a prediction every 12 seconds and catches up with capped predictions when reopened. Guesses are *not* automatically accepted as correct examples.
5. Unlock **community routing** after nine examples (at least two per category) and >=70% accuracy. The router starts with a transparent tag-overlap score. Player reviews of synthetic pairs train a second 3-nearest-neighbors routing signal that changes suggestion priority; a no-overlap pair still cannot be held. A player can export a `HOLD` envelope for independent human review. It is **not sent** anywhere. Open `/arcade/bridge/` to import the exported packet into an independently coded, local-only validator that either returns `REFUSE` or `HOLD_DEMO`.

**Important technical distinction:** Classification of imaginary seeds and matching needs to offers are **different learning tasks**. Seed labels train the visual classifier. Feedback on fictional needs/offers trains an independent local routing classifier; seed labels alone do not teach a community router. Both models use inspectable nearest-neighbor methods, and routing retains hard safety gates.

## Privacy, consent, and evidence

- No accounts, analytics, tracking, network gameplay requests or real-person profiles.
- All community records are synthetic. No partner organization, offer, or fulfillment is claimed.
- Lessons/queue stay in browser `localStorage` where available. Reset clears them.
- Exported `question-arcade/held-crossing/v1` envelopes explicitly carry `HOLD`, `SYNTHETIC_FIXTURES_ONLY`, `transmission:false`, and `recipientConsent:false`.
- This prototype has **no** JAR;VIS, Supabase, Free Graph, Garden, reLATTE or real-world delivery integration; the JSON contract is inspectable by the standalone synthetic-only `/arcade/bridge/` receiver; an actual production receiver remains a separate gate, not authorization to ingest or publish.
- A youth co-design process is proposed, **not** completed or represented by a fictional student.

## The project beyond this prototype

**Phase B — youth-designed lessons:** invite youth to design data categories, test confusion cases, build accessibility features, and explore how corrections affect results. Keep classroom learning local, with opt-in aggregates only.

**Phase C — small community model:** separately build a fit-for-purpose needs/offers classifier on permitted, non-sensitive examples; evaluate on withheld examples; compare against rules-based matching and no-AI baseline. No gameplay points determine truth or priority.

**Phase D — JAR;VIS receiver:** implement an authenticated and reviewed adapter which validates the envelope schema, resolves provenance, refuses synthetic demo packets from live matching, protects personal data, and returns HOLD/REFUSE/ADMIT separately. Any human contact, service commitment, or publication requires its own consent and steward approval.

**Phase E — federated deployments:** communities can run or adapt the game, local models, and rules independently. Distribute signed model versions, documented training sources, opt-out and deletion controls, audits, bias testing, accessibility, and reproducible evaluation; never assume cross-community consent.

## Processing Foundation alignment

`arcade/main.mjs` contains the actual p5.js interactive sketch. The model itself is framework-independent JavaScript and testable offline. The prototype is a starting point; a fellowship proposal should be co-designed with the relevant youth community, not predetermined on their behalf.

**Project status:** executable local prototype + passing engine tests; not deployed to production, no pilot users, no field evidence.
