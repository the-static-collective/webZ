# One Table · Seven Days

Independent Waseca × Greater Mankato seven-day working table (October 25–November 1, 2026). Built for asynchronous invitations, time-window replies, two **direct** referrals per original invitee, and one replacement ambassador seat per original invitee. Delegation pauses the original seat and only becomes a contribution if the invited ambassador responds.

## Public vs private

The public landing view never displays an invitation roster or contributions. Invitations use cryptographically random bearer tokens in a URL fragment (not HTTP query parameters); only SHA-256 hashes are stored in the database. The host can create up to eight original passes; each original invitee may create at most two referral passes (not recursively) OR send one ambassador in their place. Referral passes do not propagate. Responses are visible to the host and, only by explicit opt-in, anonymously to other invited members of the same room. No official co-op, Coalition, SMIF, MSU or producer status is implied. There is no email/social send, no contact collection, and no automatic enrollment.

## Code/deploy

- `index.ts` Supabase Edge Function, JWT off because every privileged action is authenticated by a random bearer token and rate limited.
- `site.ts` inline mobile-first self-hosted HTML/JS, CSP with no external scripts.
- Tables `public.seven_day_rooms` and `public.seven_day_seats`; RLS on, anon/auth grants revoked, service-role-only operations behind Edge.
- Service endpoint `https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/seven-day-table` with convenient redirect `https://garden.abundent.org/seven`.
- One room was created for the October 25 seven-day experiment. Host token is not part of this repository. No invitations have been sent by deployment.

## Human/authority controls

Invitation labels indicate perspectives, not names or actual attendees. The organizer sends links voluntarily. Guests self-report responses; neither accepting an invite nor delegating authorizes institutional representation or verified actions. A host can export a private status summary for conversation. The table closes to writes at the seven-day boundary; data retention/deletion beyond that requires separate steward action.

An original invitee can reclaim their place by revoking an **unused** ambassador invitation; once the ambassador has contributed or declined, their answer is respected instead.

## 24-hour ignition desk (pilot v4)

Host sees aggregate time preferences of self-reported participants (not calendar availability/commitments) and can compose a private, copyable **First Yes / 24-hour work card** anchored in either an explicitly hypothetical scenario or a real self-reported contribution. Each card distinguishes what can be prepared now, the human permission required before effect, and what truthful evidence would look like tomorrow. Host can prefill editable starter questions about food-shelf milk sourcing (unverified), co-op membership, producers, or accessible volunteer intake. No direct outreach or public posting is automated. Invite copy is tailored to the chosen perspective. No contact details should be entered into source responses.

**Testing limitation:** Static page and browser script syntax checked, HTTP landing page reached. Interactive invitation acceptance, delegation, and record write flow still require an authenticated browser test; don't treat deployed status as end-to-end verification.

## CASE 002 / The Vanishing Carton — optional mystery-first invitation (V2)

This additive expansion reuses the SAME seven-day-table endpoint, the same private host and seat capabilities, and the up-to-two-referrals-or-ambassador rule. No second invitation database, roster, signup service or automatic outbound invitations.

- Public game doorway (available only after deploying this branch): https://garden.abundent.org/seven?case=milk
- Existing table: https://garden.abundent.org/seven
- From an existing invite page, choose Play the Vanishing Carton mystery. The browser preserves the private invitation URL fragment for return; no third party receives it.
- New private passes get Copy mystery-first invitation alongside the original wording; both target the same authorized seat.
- Anyone can play the fictional case without an invitation. It makes no network requests and never creates an RSVP, note, seat or task.
- Bring this question to my table is offered only to existing invite-pass holders. This returns with a fixed focus=milk-bridge marker; the draft stays editable, and guest still presses Save my contribution separately.
- Without an invitation, a visitor can still copy the public-safe question but cannot see a private table.

Keep bearer credentials private: never post an invite URL containing #r, #s, #k, or #h publicly. The bare ?case=milk URL is public and does not confer access.

The real optional seven-day research protocol begins only after permission from the actual food-shelf purchasing steward. No purchasing, food handling, volunteer enrollment, promises, external contact, grant eligibility or institutional endorsement is established by a fictional case or RSVP.

Lineage / working Case 002 document: https://docs.google.com/document/d/1J5RS1enjVmbukMJDdpWhEdgSXvohgxzVsOwI38N_nNY/edit

Static regression: node --test tests/milk-bridge-invite.test.mjs (also included in root npm test). Before rollout, verify redirect query/fragment preservation, permission to access existing seats, RSVP, referral/ambassador delegation and revocation, and mobile behavior on at least two devices. Static checks are not a live browser test.

## CASE 002 / Closing Circle → Seventh Table successor 003

Implemented host-only, client-side successor composer at https://garden.abundent.org/seven (available after deployment).

1. Host with a private invitation-key may record a PRIVATE case outcome: unresolved, declined, participant-reported, or recipient-confirmed-as-reported. The UI checks user confirmation for the last status; no software authenticates a recipient.
2. Host downloads an optional local private text receipt. It never becomes a note, membership record, supplier contract, dataset or public report.
3. Host reviews editable next-title, public-safe question and suggested date seven calendar days after the room closes, in America/Chicago, and checks an explicit separate public-question approval.
4. The browser constructs a version-1 Seventh Table compatible portable invitation token using the published model.mjs schema (`v,id,title,purpose,date,time,venue,host,parent,chain`), no private outcomes or invitation credentials, and links to https://abundent.org/tables/#invite=...
5. Another willing host may open that card in the pre-existing Seventh Table, adapt it, optionally use its own invitation/network publication controls, and *then* pass another table through its native lineage.

These are TWO independent pilot systems. A Seven-Day Table ID or bearer token MUST NOT be passed as a Seventh Table parent. The first portable card has an empty parent/chain; later cards can form native Seventh Table lineage. No cross-system verified completion, participant enrollment, supplier agreement or food order is asserted.

Static integrity checks include DOM/script parse, exact portable schema, no private token in payload, explicit share consent, and Central Time day arithmetic. End-to-end host browser/download/new-host handoff still needs manual smoke test. No third-party messages are sent.

## BananaGram Pocket ↔ private Seat (draft handoff 001)

The public Seven-Day Table now links to the **public, local-only** [BananaGram Pocket](https://garden.abundent.org/gram). A person with an actual authorized **private seat** may press **Shape a BananaGram privately** to open Pocket as a new tab. The original seat page retains the only invitation bearer token; it is **never copied into Pocket or the return payload**.

1. Seat generates a 128-bit fresh in-memory handoff nonce, opens `/functions/v1/banana-pocket#returnToTable=<nonce>` on the **same Supabase origin**. A cross-origin or independent Pocket window has no return-to-seat button.
2. In Pocket, the person creates a local Gram, deliberately prepares a distinct redacted proposal, and checks author, consent, and review boxes.
3. Clicking **Return reviewed question to my Table** posts only `{type,nonce,standing:'PROPOSE_ONLY',summary}` to the popup opener with an exact `location.origin` target. No private traces, household data, full Gram, invite keys, or author records leave Pocket.
4. The Seat page requires the **exact popup window**, **same origin**, matching **one-time session nonce**, active authorized seat, valid standing, and a short contact-free summary. It will ask before replacing existing text, then populate the **unsent/editable** contribution box and turn off sharing. The person must still press **Save my contribution** to save anything.
5. Any message from another window, wrong origin, wrong nonce, invalid state, private URL/contact, or absent active seat fails closed; no new backend POST action, database table, or role permission is created.

The public `/gram` remains a standalone non-network drafting door for people without a private seat. The table is not an open submission inbox. This uses a live ephemeral in-browser postMessage boundary instead of exporting/importing manual JSON, while keeping direct network authority with the existing table API.

**Testing:** module + inline script syntax checks, source-level checks and simulated parent/child message flows. New Node regression `tests/banana-pocket-seat-return.test.mjs` exercises origin/source/nonce refusal and unsent-draft behavior. Still needs a real browser/mobile popup / keyboard / response test with a test seat. No real contacts or institutional endorsement implied.
