# REALITY 2.0 / WASECA · persistent field 001

**Launch date:** 2026-10-26. **Ownership:** Abundent / The Static Collective, independent local public experiment. No co-op, town, church, food shelf, or Coalition endorsement or authority is inferred.

## Architecture, actually deployed

- Standalone Vercel static page: `https://reality2-waseca-001.vercel.app/`
- Source of the static assets: `webZ/waseca/{index.html,style.css,app.mjs,live.mjs}`.
- Supabase project: `pantry-gate` (shared Abundent backend), project ref `kbhqacsdvjsstzyplqij`.
- Edge endpoint: `https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/reality2-waseca` (verify_jwt=false; request validation, Origin control on POST, body size caps, quotas; never trust client-provided identity).
- DB migration: `reality2_waseca_persistent_field_001`.
- Tables `public.reality2_entries` and `public.reality2_quotas` have RLS enabled. Anon and authenticated have no table rights. Supabase service role is confined to server-side Edge Function; **never send service key to browsers**.
- No server-side secrets in any GitHub file or public webpage.
- The public UI fetches counts and *human-reviewed* entries only. A visitor's own pending status/withdrawal is available via UUID + secret key; this is a bearer capability and must remain private.

## Live public contract for JAR;VIS, GRAFT, lemonPRESS

`GET /functions/v1/reality2-waseca?action=jarvis` returns **reviewed-only** actionable, open/blocked/steward-needed records with `id,kind,lane,stage,progress,title,nextStep,update,publishedAt,relatedTo,verification`. The model may *propose* a next useful thing but must never represent a retrieved suggestion as a real assignment, endorsement, consent, or verified outcome. A reviewer controls promotion of facts into public feed.

Other read endpoints: `?action=feed` (reviewed public cards), `?action=counts` (aggregates), `?action=health`. The field page has a small floating "A loose wire?" feedback entry that POSTs only after consent.

POST actions: `submit` (private PENDING, receipt/withdrawal key), `status` (requires private receipt and key), `withdraw` (requires same; revokes key and redacts private/public fields). No automatic publication.

## One-person moderation procedure

The service deliberately has no anonymous approve operation. Use the Supabase project's authenticated SQL editor / vetted moderator workflow to:

1. Inspect PENDING rows *privately* and reject inappropriate, identifying, unverifiable, spam or unsafe text without public exposure.
2. For publication, write **distinct, human-redacted** public fields; set `reviewed_at`, `published_at`, `reviewed_by`, and `status='PUBLIC_REVIEWED'`. The check constraint forbids reviewed publication without an explicit timestamp and nonempty public title.
3. Adjust `progress` as work advances, with `public_update` describing what is merely self-reported versus independently witnessed; publication does not prove events occurred.
4. Preserve the first-hand account privately only as long as necessary for this consented review; visitor withdrawal redacts it. Avoid collecting sensitive cases in the first place.
5. Never run an auto-publish or automatic assigner.

Example operator query (review privately, manually choose an exact ID):
```sql
select id,created_at,kind,lane,title,next_step,stage,parent_id
from public.reality2_entries
where status='PENDING'
order by created_at asc limit 25;
```

Example review **template only** (fill after actual human review, not automatic):
```sql
update public.reality2_entries
set public_title='[REDACTED HUMAN-APPROVED SHORT TITLE]',
    public_step='[REDACTED HUMAN-APPROVED NEXT STEP]',
    status='PUBLIC_REVIEWED',
    progress='NEEDS_STEWARD',
    reviewed_at=now(), published_at=now(), updated_at=now(),
    reviewed_by='human:operator',
    review_note='Approved public-safe wording; no assertion of verification'
where id='[EXACT REVIEWED UUID]'::uuid and status='PENDING';
```

Do not publish any real names, children's details, custody, trauma, private evidence, location addresses, confidential contacts, or unapproved institutional affiliation. All user-supplied text is untrusted. A visitor's feedback about a site bug may be published *only after* reviewing the content.

## Known boundaries / next tests

- Persistent store and read-only public/JAR;VIS feed are live; no autonomous JAR;VIS process consumes the feed yet. The public page reads the same feed and displays a deterministic suggested next voluntary task.
- UI includes manual refresh, not a live push socket. No authenticated moderator UI yet; Supabase operator tools are available. "Real time" means refresh sees committed changes, not sub-second push.
- Incoming anonymous text cannot be wholly sanitized by regex. Even after basic rejection and rate caps, humans must review publication.
- No independently confirmed human-to-human completion has been recorded as proof. Do not seed fictional entries to make the board look busy.
- Automatic browser click-through QA requires an independent tool; do not claim it based solely on static code inspection or HTTP GET.
