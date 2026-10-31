# POKE-001 · You've been poked. Poke back?

**Status:** Public bounded pilot deployed 2026-10-31. Not a Facebook integration, not an authenticated messaging system, not a reLATTE admission implementation.

**Live door:** https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/poke

## Why

The smallest voluntary interaction is a signal: **POKE → ECHO**. Neither side has to say anything. A reply establishes only that a link was used, not identity, consent to a message, availability, relationship, or permission for future action.

## Human behavior

1. Open the live door and press **START A POKE**.
2. Copy the invitation link; deliver it yourself to one person through any existing channel. The service **does not notify them**.
3. Recipient sees **You've been poked! Poke back?**, and may press **POKE BACK!**, ignore it, or close the exchange.
4. Sender sees an incoming poke by re-opening their private link or refreshing the page (it also polls every 15 seconds while visible).
5. The two can poke back and forth, one turn at a time, for at most 40 total pokes, until either ends it or it expires after 7 days.

## Boundaries

- No names, user accounts, message body, public directory, advertising, or analytics.
- The service stores only SHA-256 fingerprints of random 32-byte per-side bearer secrets, counters, expiry, and timestamps.
- Each party gets a different private link with their token in the URL **fragment**, never in the server URL/query/referrer. No claim of verified identity: whoever holds a link can act on its side.
- The sender gets the recipient invitation **once** on creation, and must copy it; it is not recoverable on the sender dashboard.
- Poke back **is not** permission to message, recruit, publish, contact, or escalate.
- Explicit one-click manual close; no automatic push messages. No contact importing. The service doesn't touch Facebook.
- 7-day logical expiry, and cleanup of expired or closed rows occurs on subsequent creates after an extra day; there is not yet a scheduled data-retention job. Do not promise automatic erasure on day 7.
- A global bound of 100 new threads per UTC day caps experimental usage, but it is not a per-client abuse prevention system. Do not advertise widely before reviewing operational abuse controls and a reliable purge schedule.
- No more than one outstanding poke; 40 signals max prevents repetitive pings per exchange.
- No partner organization or personal identity is enrolled.

## Ownership / architecture

webZ owns the public UI and Edge Function source: `supabase/functions/poke/index.ts`.

The isolated live database is `public.poke_v1_threads` on the existing active pantry-gate Supabase project. DDL and RPC sources: `supabase/sql/poke-001.sql`. All table RLS enabled, no anon/authenticated direct grants. Two SQL functions have execute grants only for service_role; the Edge Function handles bearer verification. The HTTP endpoint intentionally uses `verify_jwt=false` because create is public and state transitions are authorized by high-entropy bearer links. The server-side service role key must never enter a browser response.

`POKE` and `ECHO` are light signals, not reLATTE crossing admission. The earlier Porch rule **WELCOME ≠ ADMIT** continues to hold. This adapter doesn't claim identity, consent to future communication, verified human delivery, or signed receipts.

## Verification

- SQL first-turn/echo/return/close and denial of anon table/function grants: executed inside a rollback transaction on 2026-10-31; passed.
- Public unauthenticated GET of Edge Function: verified externally 2026-10-31.
- Supabase function deployment: ACTIVE v2 with `verify_jwt=false`.
- Browser click-to-create and two-device end-to-end scenario: **not yet independently tested**; do not treat the deployed function as confirmed user-tested.

## Later gates

Offer deliberate opt-in delivery adapters, a true mute/block mechanism for recurring identities (only if identities are introduced), atomic per-client abuse limits, periodic deletion, and optional reLATTE receipt crossings. Never auto-graduate a poke into invitation or chat.
