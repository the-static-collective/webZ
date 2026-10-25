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
