# FIRST-ENCOUNTER-002 — an invited knock between sovereign worlds

Status: network chapter opened; invitation/return preflight and security contract. No public delivery edge or two-person field encounter is earned by this document or its synthetic fixtures.

The offline chapter closed in order: webZ PR #2 merged at 1e8974d, then PR #3 rebased/tested at 6591661 and merged at b6b9897. The next branch is additive. User sequencing clarification: **FIRST-ENCOUNTER-002 does not depend on MAXHINAL's missing image or bootstrap.** MAXHINAL still owns those gates and its Rack remains locked.

## Owners and one encounter

Person A owns receiving world A; person B owns proposing world B. A creates a signed, short-lived, source-bound public invitation. B inspects the invitation and independently accepts A's public-key fingerprint through a separate trusted channel. B explicitly offers at most 2048 UTF-8 bytes of public text, granting inspection only. B's protected world-local signer seals the canonical reLATTE v0 CrossingEnvelope. A's authenticated edge verifies authorization, exact text bytes, source signature and scope before invoking A's native LocalReceiver.

RECEIVE is inert and pending human choice. A explicitly chooses HOLD / REFUSE / ADMIT through an independently authenticated local owner control. The native reLATTE SovereignResponseBundle returns to B, who checks A's independently pinned key, the exact original crossing, payload address, receiver particular, receipt chain and disposition. Both worlds keep their own durable journals and bytes. No shared sovereign database; no automatic admission, execution, publication, license or STORYSHIP canon.

webZ owns the public invitation declaration and its read-only preflight; **reLATTE remains the owner of CrossingEnvelope, Receipt, SovereignResponseBundle and LocalReceiver.** This branch does not modify those contracts or MAXHINAL's verifier.

## Initial executable slice

A pure verify-only browser/Node preflight accepts a signed public invitation, canonical signed proposal, exact public text, and signed native response. Trust is a separate local input: expected A/B world IDs, receiver particular, A/B key fingerprints, approved HTTPS origin and receiver-local revocation knowledge at an explicit verification cut. It is never derived from the uploaded packet.

The invitation schema is `webz/porch-invitation/v0`: invitation ID; issuer world/receiver particular; source world/key fingerprint; issuer public key; purpose `FIRST-ENCOUNTER-002`; exact HTTPS origin; media type `text/plain`; max bytes 2048; issued/expiry timestamps; inspection-only rights; signature. No bearer credential, private key, URL query, fragment, callback URL or payload bytes belongs in this public descriptor. Identity/signature domains are distinct webZ invitation domains, not reLATTE receipt domains. It grants only a bounded opportunity to approach; no disposition authority.

The verifier produces deterministic observations from the same frozen packet and explicit trust/time cut. Its result always reports delivery disabled, authenticated transport UNOBSERVED, two-person/two-device proof UNOBSERVED, and no sovereign history write. Two isolated browsers on separate origins must match fresh Node replay, consume only public material, store no signing/authentication secret, and issue no remote delivery. This tests the acceptance contract, not a live encounter.

## Authenticated edge contract for the next implementation gate

This specification must receive separate edge security review before any public listener is implemented or exposed. Do not tunnel or publicly bind reLATTE's existing unauthenticated loopback fixture.

- Two distinct HTTPS origins and independent operator-controlled journals. Each host alone holds its signer, local policy, invitation state and bytes. TLS certificate validation stays enabled; no custom trust downgrade. No new Supabase project is needed.
- A public locator/descriptor is discoverable without authentication. Its signed pin is authenticated separately by B; an embedded key is not its own trust anchor.
- A issues a short-lived single-proposal authorization through a separate private channel, bound to B's key/world, invitation ID, one purpose, 2048-byte text bound and expiry. Private redemption material travels only in a protected request header; never a URL, browser storage, GitHub, public manifest or log. Operator/session credentials are distinct from visitor permission.
- A authoritatively checks expiry/revocation at receive time. Atomically reserve one crossing ID and persist replay/idempotency state; same-byte retry returns the same durable receipt, a different crossing cannot reuse the invitation. Restart/crash tests must cover the reservation-to-journal boundary.
- Origin/Host allowlists, no wildcard CORS, owner-route CSRF protection, request body/time/concurrency limits, bounded per-invite/network quotas and strict content type apply before the native relay/receiver. Browser/source signatures alone do not satisfy invite authorization or human identity.
- Restrict outbound requests to explicitly reviewed peer origins; no arbitrary callback URLs, redirects, DNS/private-network pivot or ambient credentials. Authorize receipt retrieval to the invited source; receiver owner controls are not visitor endpoints.
- Verify signed RECEIVE before presenting pending custody. Rendering text uses textContent; no filenames, scripts, executable attachments or implicit publication. Acknowledgement is delivery only. Disposition requires a fresh authenticated A action; concurrent decisions serialize and retries never change a terminal native receipt. A later change of native R3 HOLD lifecycle requires a reLATTE-owned change, not a webZ overwrite.
- B verifies return against the exact locally retained proposal and independently pinned A key. Source records and receiver records are separately acquired/replayed. Missing, lost, malformed, forged or cross-wired return remains unresolved; it never becomes ADMIT by timeout or transport ACK.
- Protected journals/capability state have owner-only filesystem permissions; public/redacted witness exports omit credentials and personal text unless each person separately authorizes publication. No telemetry, provider spend, shared receiver database or implicit story consequence.

## Hostile/field acceptance

Reject unknown/extra fields, private-key/capability fields, substituted invitation or key, off-origin/plain HTTP/query/fragment/userinfo, expiry, revocation, wrong source/world/receiver, incorrect text hash/length, consent coercion, duplicate conflicting proposal, wrong return crossing, forged R3 decision, lost return, and malformed receipt chain. Show intentional REFUSE with preserved evidence. Cold replay uses frozen bytes, local pins and explicit time, not browser/process memory.

After security review and protected A/B endpoint configuration, the actual field gate is **two independent people on different devices/networks**: A issues invitation, B explicitly dispatches one signed text proposal, A receives inertly then decides explicitly, B independently verifies the signed response, each separately restarts/replays its own history, and both authorize any redacted witness publication. A second invited proposal exercises deliberate REFUSE. Record actual roles, origins, native receipt IDs, hashes, local journals, transport observations, retries, missing returns and unresolved states. Screenshots/automation do not prove participant identity or human action.

Neither successful visitor proof nor failed visitor proof changes MAXHINAL LIVE, its exact image gate, or the Constellation Rack. Conversely, MAXHINAL's missing image does not postpone this encounter's independent security/configuration gates.
