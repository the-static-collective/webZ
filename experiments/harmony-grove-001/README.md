# HARMONY-GROVE-001 · the digital festival grounds

**Status: unshipped, browser-local experimental prototype.** This is deliberately outside the verified `STATIC_PATHS` release/export and the fixed offline cache. It does not alter the shipped founding 11×11 navigator, its catalog hash, or source contracts. This repo branch contains a demonstrator, not a new live public route.

## Inspiration and boundaries

Harmony Park / Shangri-La's welcoming festival commons suggested a grammar, not a branding license: **arrive → wander → encounter → contribute (optional) → carry → return**. The Giving Tree, The Point, oak-grove wanderability, volunteer care, and open-ended participation are translated into a separate Abundent prototype. No affiliation or endorsement is asserted.

**UX rules:** arrival ≠ registration; browsing ≠ contribution; source ≠ permission; gift ≠ publication; local file ≠ delivered crossing; composition ≠ AI-generated illustration; provenance claim ≠ verified source. Never fake a public gift board without a genuine receiving service. The reader can leave without generating anything.

## One honest crossing

The user arrives without an account. They can use the fictional demo specimen or type a label, observation and optional source address (not fetched). They choose provenance from demo / self-declared / unknown and tune three explicitly **local** manga-treatment knobs (distinct from the *founding* 11×11 catalog navigator). `engine.mjs` deterministically composes a three-panel storyboard *seed* that incorporates the actual particular. No artwork or AI is generated. Where browser WebCrypto is available, the seed's canonical JSON bytes are SHA-256 hashed, with a locally generated receipt containing non-claims. The packet may be downloaded; it is never uploaded or saved to server/browser storage. No telemetry or network calls.

To preview: in the `webZ` repo, run `npm run serve` and open `http://127.0.0.1:8080/experiments/harmony-grove-001/`. Or copy the experiment folder to a local web server.

## Verification

`node --test tests/harmony-grove.test.mjs` tests deterministic composition, bounds, source authority handling, and hash change with source change. Visual/keyboard/mobile browser review is still required before moving these files into `STATIC_PATHS`, generating worker/cache changes, and rerunning the immutable public export and existing browser test gates. The draft must not auto-publish: no automated Vercel deployment and no production promotion. A real *public* Giving Tree requires a separate receiving service, consent, moderation, revocation policy, rights review and crossing evidence.

## Next gate

Try the journey with a person who hasn't seen webZ. Inspect what they misunderstand before changing any founding catalog semantics, making the tree public, or connecting a generator. The first real creative producer needs a separately authorized metadata-to-artifact boundary and a return contract with explicit origin/rights.

## GIVING-TREE-002 — hand-to-hand commons

A separate, review-only experiment under the same `/experiments/harmony-grove-001/` route. A creator composes an original local seed, explicitly checks disclosure of its full text, elects VIEW_ONLY or REMIX_ALLOWED, and downloads a bounded JSON gift. Nobody else sees it until the creator sends the file outside the site. A recipient may manually import it, independently recompute both the embedded seed and the gift's SHA-256 checksum, inspect the sender's **unverified** permission declaration, and—if remix was invited—add their own observation. The new seed carries the immediate parent gift hash, parent seed hash, and a short claimed ancestral chain. The descendant can be wrapped again.

**Do not conflate:** checksum != identity/authenticity, license statement != permission verified, local file != received by a neighbor, claimed ancestors != independently witnessed history, derivative text != ownership of inherited material. Unknown-origin seeds can be wrapped as VIEW_ONLY only, and view-only gifts block remix. No gift ever auto-uploads, publicizes, or persists in browser storage. Input is plaintext only; imported JSON is limited to 32 KB and rendered with `textContent` only. Deliberate user transmission of exported JSON can expose personal details: the UI shows the source text in export preview and requires a separate consent checkbox. A sender can revoke only by not handing out an unsent file; revocation after external transfer is not supported.

**Tests:** `node --test tests/giving-tree-gift.test.mjs tests/harmony-grove.test.mjs` covers two-person continuity, tampering, authority mismatch, view-only, unknown origin, bounds, and ancestry limit. `npm run serve` then navigate to `/experiments/harmony-grove-001/` for a browser walk, including keyboard, mobile, file download and reimport. This folder is intentionally excluded from WebZ's production STATIC_PATHS and cannot be claimed live at abundent.org. Public gifting requires opt-in receiver, moderation, blocking/revocation rules, rights controls, abuse resistance, and authenticated admission across reLATTE, not merely these local JSON hashes.
