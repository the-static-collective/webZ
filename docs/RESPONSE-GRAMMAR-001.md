# RESPONSE GRAMMAR 001 · HEY.

**Status:** executable local-only experiment. Not deployed. Not adopted as a shared protocol. Not proof of any conversation, relationship, resource, receipt, or human action.

## The premise

Social-media reactions compress human meaning into a handful of counts. That compression is useful because one click is easy, but often loses the *kind* of response. Keep the habit, change what the click can express: one human-chosen response may optionally refine into a more specific one, then produce a portable draft that remains under that person's control.

The introductory gesture can be a plain **Hey**. Neither a reaction nor silence automatically creates a relationship or debt.

```
ACKNOWLEDGE
   ├─ (stop: a valid outcome)
   └─ HUMAN REFINEMENT -> MORE SPECIFIC EXPRESSION
          ├─ (stop)
          └─ OPTIONAL HUMAN SHARE -> RECEIVER MAY CHOOSE TO ENGAGE
                       └─ FRESH, SEPARATE CONSENT IF ACTUAL WORK IS PROPOSED
```

## What is actually executable

A stand-alone static webpage in `response-grammar/`, no signup or server. Six response roots: acknowledgment, self-reported feeling, inquiry, tentative offer, invitation, and boundary/decline. Each root has an explicit human-authored refinement tree. The author can stop at the root, refine, add their own text, inspect their complete card, copy words or download a JSON card. The JavaScript core refuses invalid paths, oversized text, and unanchored offers/invitations.

The vocabulary is an initial authored specimen, **not** a claim that Plutchik's model (or any other emotion wheel) is a universally valid ontology of mental states. The site does not infer or label emotion from behavior. The user selects their own expression.

### Card contract

`abundent/response-grammar-card/v0` has a direct context, precise human-selected path, an optional unstructured note, and explicit boundary flags:

- `LOCAL_DRAFT`, `NOT_SENT`, `NOT_VERIFIED` identity
- `NOT_ESTABLISHED` acceptance, `NONE` obligation or permission
- `NOT_PERFORMED` action

The card is **not** a reLATTE signature, GRAFT admission, BananaSpork Deed, Full Measure verified act, message-delivery receipt, or third-party endorsement. Copying text is only copying text. A receiver must independently make its own choices.

### Privacy and exposure

- No sign-in, cookies, backend, analytics, localStorage or third-party APIs.
- Form content remains in page memory; `Start over` clears the interface. Reload drops in-memory selections.
- The person alone triggers copying or downloading. Once sent/copied outside this page, this program cannot revoke that other copy.
- A downloaded file may contain private information a person typed. The page warns against entering sensitive details.
- A future networked version needs sender/receiver consent, anti-spam, abuse reporting, rate limits, non-coercive withdrawal, and honest delivery states before public intake.

## Why this belongs near, but not inside, other organs yet

- **cUps** explores `LOOK -> TOUCH -> MOVE -> RELATION -> TRACE -> NEW AFFORDANCE`; RESPONSE GRAMMAR asks whether a social gesture can open (not require) a next affordance.
- **REALITY.2 / National Treasure LITTLE YES** keeps one acknowledgment distinct from agreement.
- **reLATTE** could later carry a separately authorized payload, but neither identity nor authority travels by implication.
- **webZ / Living Receiver** might become a separately consented destination. This experiment imports none of its permissions and sends nothing there.
- **Abundent Porch** may link a verified source-owned prototype following testing; do not create another competing public front door.

## Reproduction

From repository root: `node --test tests/response-grammar.test.mjs`. Start the existing `npm run serve` loopback server and open `/response-grammar/`, or use another static server. A `file://` opening can restrict ES-module imports depending on the browser; use HTTP for reliable behavior.

## Failure tests / non-goals

- A bare acknowledgment must remain a valid completed response.
- Selecting concern must not secretly turn into an offer; feelings are self-reported, not diagnosed.
- Offers/invitations must be anchored to user-authored context and remain unsigned proposals.
- A decline must never trigger a contact invitation.
- No engagement scores, ranks, auto-DM, matching, inference from silence, response-to-obligation promotion or synthetic field-success claims.

## The next distinct experiment

With explicit further implementation/review: show one consenting person a context card, have another independently choose and share a response, let the original author accept/refuse a **separate** invitation, and test whether they understood each other better than a generic Like. Capture only voluntarily approved observations. No Facebook/X data ingestion without provider permissions and consent.

**Research question:** Does this improve meaningful action without adding friction, false commitments, or unwanted contact? If not, the grammar needs pruning rather than more menus.
