# HEARTBEAT-002 — First Human Crossing

**State:** proposed Abundent public UI; no real participants or matched pair are seeded. Relies on the already deployed `seventh-table` Edge Function v2, with NO database migration or new backend permissions. A verified real-world outcome cannot be claimed by this site.

## Live operational shape

One host opens a Seventh Table and shares its **guest**, not host, URL with two participants who choose to help. The two participants themselves publish one relevant NEED and one OFFER (host moderation makes guest cards visible). The heartbeat page uses the same invitation fragment to read those visible cards from the existing, account-free ledger.

1. **Discover:** two independently submitted notes. A note being visible does not make it truthful, verified or a binding promise.
2. **Compose:** an explicit scoped proposal notes exactly which need ID and offer ID are intended and what small step to discuss.
3. **ACT/HOLD:** each original participant, separately, may post an `rsvp` note for that proposal, as need or offer contributor. Two visible notes mean only **two self-declared yes statements**. They are not authenticated, prove no independence and give the site no execution authority. The host must independently confirm the humans directly before connecting them.
4. **Witness:** anyone with room access may report `unknown`, `blocked`, `partial` or `completed`. Completed/partial are refused in the UI unless both self-reported yes kinds appear. It remains mere testimony, including after publication.
5. **Return:** displayed within this room only; a HOST may hide reports and any author can withdraw with the key issued by the backend. The site does not pay, publish outside the room, message participants, or claim physical confirmation.

No automatic matching, contact distribution, global social graph, referral tokens, identity verification or actual program enrollment. The two sides may choose not to proceed. Unanswered yes stays HOLD. The initiative may be a grocery/pantry pickup, park cleanup, potluck, or accessible creative help; the protocol does not assert local authorities or partner participation.

## Existing source-owned backend reused unchanged

`ask-jarvis/public/heartbeat/` imports a pure `model.mjs` and uses only the existing Seventh Table `read` and `post` Edge actions:
- `kind=question` with `HB1:P:<need UUID>:<offer UUID>:<plan>`.
- `kind=rsvp` with `HB1:Y:<proposal note UUID>:need|offer`.
- `kind=witness` with `HB1:W:<proposal note UUID>:completed|partial|blocked|unknown:<report>`.

The existing service enforces per-room bearer links (fragment-only), its documented rate limits, host moderation, append-only note IDs, revocable cards with author withdrawal keys, and a 420-character limit. No PII in note text, no identity inference, no APIs run directly with service-role privileges in the browser. All rendered user text uses `textContent`.

No protocol record is trusted when a source card or proposal is not `VISIBLE`. Removing, hiding, or withdrawing an upstream card removes its pairing from the heartbeat projection. Previously received offline copies cannot be revoked.

**Privacy note:** Bearer URLs can be forwarded or leaked; anyone with a host key has management authority. A nickname is not verified identity. Host moderation is editorial permission to show a note, not legal consent for a real-world activity. The API currently allows only `https://abundent.org` and `https://www.abundent.org` browser origins; Vercel preview pages can be inspected but **cannot** post/read live rooms without an independently reviewed CORS change. Do not widen CORS or turn on a permissive wildcard to force preview use.

## Tests and first real field trial

Run from `ask-jarvis/`:

```sh
npm test
```

Tests verify that:
- The proposal does not form automatically.
- Missing, pending, hidden or withdrawn upstream cards produce HOLD.
- Two self-declared notes never become identity verification or site-performed action.
- A report never proves physical completion.
- No privileged server key or local account system is introduced.

First real trial:
1. Create a new real table (purpose: one specific community project) with a public-safe description, a date and a place decided by the host.
2. Invite two actual willing contributors privately; each posts their own minimal offer/need note.
3. Host approves their cards; proposer chooses two visible cards and suggests one bounded step.
4. Each contributor reviews proposal, then records their own non-binding interest; the host confirms directly whether the two genuinely wish to contact each other.
5. Do only the safe, jointly agreed work offline. If it happens, one witness note may describe the outcome (including uncertainties). If not, report HOLD/blocked or leave it unknown.
6. Offer each poster their withdrawal key, and close or delete the room when finished.

**Never seed a fictional or speculative offer as a real one to manufacture a success.**

## Release gate

Do not represent this branch as live at `abundent.org` until a reviewed production build and route are confirmed. Verify both `/heartbeat/` and `/tables/live/` on the actual apex domain after deployment, test with **consenting** humans (no synthetic public user records), observe moderation, withdrawal and failure/closed-room behavior, and keep the prior release available for rollback.

**Integrity > Continuity.** The hardest part is still the human conversation.
