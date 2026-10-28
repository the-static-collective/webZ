# LIVING INBOX 002 — Shared persistent capabilities

**October 28, 2026. Deployed experimental inbox infrastructure. Not an NGO, church, Ghanaian restaurant, or shelter partnership.**

## Working field loop

1. The public client creates a private inbox with three independent random 256-bit bearer-capability links.
2. The owner link can read all submissions and reviews, rotate reviewer and submitter invitations, close or permanently delete the room. It is private and unrecoverable if lost.
3. A submitter with its link can send a validated, bounded, public-safe organizational HOLD or an unverified planZ method candidate. Submitters cannot read anyone else's submissions or review events.
4. A reviewer with a different link can read submissions and append self-attested HOLD, REFUSE or ACCEPT_FOR_LOCAL_REVIEW decisions. A locally accepted review may subsequently receive a REPORTED_PARTIAL, REPORTED_COMPLETE or BLOCKED report; none is independent confirmation.
5. Actual organizations remain responsible for contact, consent, volunteering, safeguarding and independent recipient confirmation. The portal never establishes partner status or a real-world promise.

## Backend and storage

The existing pantry-gate Supabase project hosts isolated new tables; they do not reuse Garden, Reality 2.0 or other intake records:

- commons_inbox_rooms: coarse organization/region label; random capability hashes and closed state.
- commons_inbox_items: bounded source JSON with content digest; deduplication scoped to room.
- commons_inbox_events: append-only owner/reviewer decision and unverified activity-report events.
- commons_inbox_quotas: hashed hourly/daily anti-abuse counters, not raw IPs.

Tables are RLS enabled; anon and authenticated have no direct table grants. The Edge Function uses a server-held service role and checks role-scoped random bearer credentials for every operation. Creating a room is public but rate limited. Client tokens never appear in URL query strings; the invitation fragment is handled in the browser, then sent over HTTPS in a POST body. Copying a link, shared browser histories or device compromise can expose it. This is **capability authorization, not authenticated human or organizational identity**.

Text and JSON are restricted to organizational needs and non-sensitive reusable methods. PII filtering is incomplete by nature, so never enter resident/guest details, case files, precise shelter sites, remittance figures, confidential contacts or medical information. No account login, automatic payment, broadcast, dispatch or source-owner approval is implied.

Data is retained until the inbox owner deletes the room. There is currently NO automatic retention/expiry policy. Closing stops new submissions and reviews; deletion cascades to items and events. Lost owner keys cannot be recovered through this interface. Do not share owner links.

## Critical trust distinctions

STORAGE_ACK != SIGNED_RECEIPT; LINK_HOLDER != AUTHENTICATED_STEWARD; ACCEPT_FOR_REVIEW != REAL_WORLD_CONSENT; REPORT != RECIPIENT_CONFIRMATION; RETURNED_METHOD != FULL_MEASURE_DEED. Signed reLATTE transport and Full Measure remain separate systems, not triggered by the web inbox.

## Verification

GitHub CI covers static packaging, content rules and browser behavior. The private Supabase schema and Edge Function are deployed separately from source. End-to-end tests should exercise create/submit/open/decide/report/rotate/delete, including forbidden-role attempts. Never publish secret invitation links in logs, commits, or chat.
