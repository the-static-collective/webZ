# INVITATION PUBLICATION BRIDGE 003 — Make it obvious when something is actually posted

## Observed problem

A visitor can successfully create a portable, shareable invitation on `/invites/`, but creating the link does **not** publish it to the network. The optional publication route was presented as another generic form, with no prominent confirmation after the server saved a post. The discovery interface also defaulted to topic-specific filtering, and its "offer help" / "find offer" labels were reversed relative to the backend's counterpart semantics. Someone could reasonably believe they posted a persistent, discoverable contribution when they had only created the portable link.

## Behavioral contract

- `/invites/`: clearly states **Link-only so far** immediately after an invitation is created. The next visible action is **Publish it so people can find and reply**, before the action deck. Keep the previous local/share/fork tools, never silently post. Public-browse link is visible on the initial screen.
- `/invites/network/#i=...`: shows the exact words, a concise classification and explicit public consent **before** sending a publish request. Publishing is the actual persistent storage action; the consent checkbox is never auto-selected.
- On HTTP success, the visitor sees a **POSTED SUCCESSFULLY** proof block at the top of their public thread: public conversation URL, an actionable link to the public board filtered to the post's topic, and an explicit private owner receipt download. No duplicate key transmission in the share URL.
- Reopening the original portable link later and following the public route will `lookup` the invitation ID, read the existing public conversation if available, and **never create a duplicate**. The lookup returns no private keys or unpublished text.
- `/invites/network/` now also accepts a new sentence and availability **directly on the public desk**. The visitor can review and explicitly consent to publication right there—no circular trip through the original invitation page required.
- `/invites/network/?browse=1` defaults to **all topics** and **all intentions**, and loads saved public posts automatically. Filter language now corresponds correctly to the backend counterpart rule: **Needs I might help with** queries for needs, and **Offers I could use** queries for offers. The public board uses deliberately unverified self-declared content. A post highlight lets the author see their own new publication among listed results when it is included in the result window.

## Backend

Backwards-compatible extension to `invitation-network-002` (no new tables): `lookup {invitationId}` reads only currently public, unexpired thread ID/topic/intent; `discover {lane:'any',intent:'open'}` lists across all public topics. Existing SQL RLS, allowlisted CORS, quota enforcement, public text constraints, receipts, withdrawal and notification rules remain intact. The portable first page remains offline/local-first with `connect-src 'none'`; only the deliberate publication desk sends the network request.

## Verification

- Live Edge Function was probed for `discover(any,open)` and `lookup(unpublished-id)`; both returned HTTP 200 and expected schemas.
- `tests/invitation_publication_bridge.test.mjs` covers the link-only → public boundary, labels, lookup and visible receipt proof.
- `tests/invitation_network_browser.py` now proves direct desk composition without auto-posting, that a post is discovered from a second browser page, marked on the public board, and that reopening the **original** invitation resolves to the same public thread without posting twice.
- Production publication remains gated on Node + mobile-browser CI.

The public board may legitimately be empty; a displayed candidate is not a verified participant, available resource, or confirmed match.

**UI invariant:** An invitation is either **link-only**, **published with a visible proof**, or **unavailable**. We must never leave the visitor guessing which state they reached.
