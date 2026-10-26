# AUTO-CROSSINGS-033 — No tickets to carry

**Date:** 2026-10-26  
**Ancestry:** `feature/abundent-crossings-032` (webZ PR #138)  
**State:** Draft, additive public-only preview candidate. Not a production domain change.

## Problem solved

CROSSINGS-032 proved that a small public-safe card can move across independent
Abundent site experiments. But visitors had to download JSON and manually
reupload it. Most people should never have to see JSON or understand storage.

## One-tap public path

1. At `/first-yes/`, prepare a harmless community-level question and review
   its printable First Yes card.
2. Tap **Continue to the next room**. The page calls `makeCrossing(kit)` and
   places its **strict, public-only metadata** inside browser
   `sessionStorage` before navigating to `/crossings/`.
3. The Crossings page automatically reads that short-lived ticket, validates
   it again, selects the relevant topic, and presents fixed public doors.
4. Workboard, Campfire, Seventh Table and Weave can display a visible
   non-identifying arrival banner. **Workboard also opens the matching
   public editorial starter topic**, without filling or submitting a form.
5. A visitor can **Forget this starting point** at Crossings or any receiving
   room. A browser session record automatically expires after 30 minutes.
6. Portable JSON import/export is an advanced fallback; it is not the primary
   journey. Local return export remains opt-in and does not count as
   verification or submission.

### Why this leg deliberately does not hit a database

A navigation from two paths on the **same** Abundent origin does not require a
network identity, write API, server-side storage, shared token or JSON
download. Putting every unverified question through the database would
create avoidable retention, privacy and moderation obligations.

This is **not** the private BananaSpork Campfire/Firebox backend running at a
public URL: that engine is local-only and has scoped private member records.
We must not expose its operator credential or message store merely to hand
off public website navigation.

There is already a separate **review-gated Workboard Supabase backend**:
people may intentionally submit a public-safe contribution through the
Workboard's existing consent checkbox and approval queue. This 033 handoff
never triggers its POST path or grants identity/approval. Its only backend
reads are existing public reviewed Workboard feeds when independently
requested in those pages.

An actual multi-device or human-verified handoff will require a
destination-owned protocol, an explicit submission action, expiry,
anti-abuse limits, human moderation, withdrawal/revocation and a separate
public-safe service. Not built or claimed by 033.

### Privacy invariants

- Only topic, action type, public-review reference and all-false authority
  flags cross. **The original question is never stored in sessionStorage.**
- No cookies, localStorage, file download, private Firebox API or POST call
  in the default handoff.
- The receiving pages may show a status badge, not silently perform work.
- The sensitive `care` topic routes only to Still Here and Campfire; no
  open public Board, Table, Weave or general contact relay.
- Explicit URL topic selections at the Workboard override a carried topic.
- Temporary storage can still be inspected on a shared/compromised device.
  It is public-only metadata, not private case data.
- No source material is sent to an LLM or external site during handoff.

### Verify

- `cd ask-jarvis && npm test`, including
  `auto-crossings.test.mjs`.
- `node --check` on all six changed browser JS modules.
- Local Playwright (390px Android-style screen) against a static HTTP
  server: First Yes → **Continue** → Crossings auto-selected → Workboard
  public topic / human review gate → Forget → care route → private-case
  HOLD. Reject all remote API calls; assert zero POST requests.
- Preview-build test (Vercel project `abundent-first-yes-030`) on exact
  commit; never alias it to `abundent.org` without separate release review.
- Verify device storage restrictions and file fallback; verify mixed-origin
  Garden links do not falsely imply state transfer across origins.

**Integrity > Continuity. No ticket required. No automated consent.**
