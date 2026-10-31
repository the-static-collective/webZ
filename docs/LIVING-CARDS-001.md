# Living Cards 001 — reality ⇄ card ⇄ chosen act ⇄ returned witness

**Status:** a usable static, browser-only field pilot. It can generate and open real user-authored cards, share them through URL fragments, carry a reply, create a human-reported outcome, and record a second self-attested confirmation/dispute. **It has no accounts, server, volunteer roster, public posts, payment service, claim locks, or privileged physical authority.**

## Why this exists

The first person doesn't need an audience. They can start with **one actual object, need, or ability** and issue a card:
- `HAVE` — "I have a folding chair available to lend."
- `NEED` — "I need one folding chair Saturday."
- `CAN_DO` — "I can help carry two chairs."

The card describes an opportunity. It **does not** prove existence, ownership, custody, consent, transferability, location or trustworthiness. The creator can send the link to one real person rather than pretending a market is already populated.

The recipient can create and return a portable `REPLY` (INTERESTED, CAN_HELP, QUESTION, PASS). After **an actual physical action**, a person may create a `REPORT` with DONE, PARTIAL or NOT_DONE. A second person can return a `RETURN` with CONFIRMED or DISPUTED. All source records remain nested in portable records, so the person opening a return can inspect lineage. A return is self-attested; the software cannot verify that two different people issued the records.

### Minimal field loop

```
one real thing
  → CARD (user's description, unsigned)
  → person deliberately shares fragment link
  → another person's REPLY (unsigned; not a reserve)
  → offline physical action, if both consent
  → REPORT (self-attested, not verified)
  → RETURN (confirm/dispute; signer identity unverified)
  → inspect / save JSON / print
```

In the absence of volunteers, the operator can make a CARD and self-REPORT an outcome, **without inventing anyone else's confirmation**. This is a real instrument for organizing a first encounter, not evidence that one occurred.

## How to use it

Open `/cards/` on the webZ static site or a standalone deployment of the four first-party files. The creator fills out the form and checks the explicit consent statement. Copy/share the link directly or download a JSON file; no automatic publication. The receiver opens it, clicks a response, then **sends the newly created reply link back manually** via the original communication channel. An actor may report what actually happened and send it to an independent receiver, who can confirm or dispute. Links carry the entire record in the fragment (after `#`) and are long; use JSON as a fallback where messaging apps truncate them.

- Send only non-sensitive descriptions and a general region; no home address or private case records.
- The URL fragment is not sent in a normal HTTP request to the web server, but it may be recorded by browsers, shared messages, clipboard services, screenshots, backups and any person holding the link. Treat it as public-to-the-recipient content.
- No remote database. Save to the browser **only by pressing Keep on this device**, or save JSON. The current record is carried in its URL even when no local save exists.
- SHA-256 fingerprints detect accidentally modified payloads in nested records. Any person can recompute them; they do **not** certify original authorship, presence, ownership, action, or an independent witness.
- There is **no** payment, booking, reservation, custody ledger, ownership transfer, financial credit or UNFUTURES trust in this version.
- The source code renders user content as text, not HTML. CSP forbids network connections, remote scripts, forms and external media.
- A report is visible as NOT CONFIRMED until a human creates a return; a returned confirmation is still two **unverified assertions**, not identity or factual proof.

## Tests

`node --test tests/living-cards.test.mjs` from the webZ repository root, and `npm test` includes the test through its glob. Test vectors cover field card creation, explicit author consent, round-trip Unicode, one card→reply→report→return sequence, solo report, mismatch/tampering detection, invalid inputs, and no accidental attribution/payment.

Browser field trial needs a real external person to establish usability and truth outside the synthetic loop; until then, do not declare `FIELD_VERIFIED`.

## Proof gates before expansions

1. Human test: one actual participant successfully sends back a reply to one authentic card; preserve their voluntary feedback without exposing their identity in a public repository.
2. Physical test: at least one real exchange or useful action followed by a report, and an independently attributable response. Keep consent and sensitive details private.
3. For shared public boards: moderation, opt-in publication, accessibility, revocation, ownership/availability checks, rate limits, user roles, claim expiration, and explicit data retention.
4. For payment or stored-value cards: provider-backed funds confirmation, an actual settlement/refund route and legal review. Do not smuggle virtual demo credits into redeemable assets or call unsigned reports financial receipts.
5. For reLATTE compatibility: explicit typed crossing envelopes, independent receiver policy, source verification, and refusal; preserve local authority rather than treating a shared URL as admission.
6. For UNFUTURES: contributions, stewardship, productive capital and contributor lineage must remain separate from these physical item/need cards until their legal and accounting semantics are independently established.

### Observe, don't manufacture adoption

The measure of success is not the number of fictional cards produced. It is whether **one real card** led to **one informed human response** and, optionally, a **real confirmed consequence**. Record unanswered cards and refusals too.

No dependency on the draft WANTED-001/002 branch. They remain adjacent hypotheses: buyer-first paid demand versus a general-purpose card for ordinary reality.
