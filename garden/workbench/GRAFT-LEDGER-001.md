# The Garden × GRAFT — ledger and approved-source synchronization 001

**Status:** LIVE infrastructure; editorial queue uses the existing pantry-gate Supabase project. The independently hosted Garden Vercel project serves `garden.abundent.org`. This is **not** an official co-op or Coalition website.

## What actually works

- **Shared ledger**: browser submits account-free `offer`, `need`, `question`, `experiment` or `return` by an explicit opt-in. The edge function validates the entry and saves it `PENDING` in `garden_entries`. Visitors receive an unguessable withdrawal key, stored server-side only as a SHA-256 hash.
- **Human review gate**: only `PUBLIC` entries bearing actual `reviewed_at` and `reviewed_by` may appear through the public GET endpoint. Nonpublic records are inaccessible to anon/authenticated roles (RLS enabled; grants revoked).
- **Published read**: every visitor sees the same *reviewed* Garden entries from the database on page load or clicking Refresh; no local-only import/export required.
- **GRAFT sync on read**: edge code fetches **exact fixed URL** `https://raw.githubusercontent.com/the-static-collective/GRAFT/main/commons-feed.json` (at most once per isolated runtime per five minutes). Only valid `graft/public-commons-feed-v1`, `publishedBy=the-static-collective/GRAFT`, `publication=PUBLIC_SUMMARY_APPROVED` entries with pinned 40-hex `sourceCommit` and allowlisted Markdown `sourcePath` appear. A candidate feature branch can never appear as approved.
- **Public-facing behavior**: empty and unavailable states are explicit, never conflated with proof of no research or no activity. Client writes to the API only on the separate consented Submit button; ordinary local draft maker still does not upload.
- **Safety**: no public credentials; service-role key only in Edge; strict origin check for posts, body size/length/regex checks, SQL constraints, per-visitor and global hourly/daily quotas, textContent-only rendering, no GRAFT code execution, no person or partner auto-registration.

## Operator review: a real, separate human decision

Use the Supabase project's authenticated Dashboard SQL Editor. Inspect the private queue:

```sql
select id, created_at, kind, lane, body, next_step, status
from public.garden_entries where status='PENDING'
order by created_at asc limit 40;
```

Review for identifying information, outside commitments, confidential details, commercial/legal promises, and provenance. **Only when the source owner gives permission and publication is appropriate**, update **one exact ID** in an editor-only SQL session:

```sql
update public.garden_entries
set status='PUBLIC', reviewed_at=now(),
    reviewed_by='Garden human editor',
    review_note='Reviewed as independent proposed contribution; no partner or completion claims'
where id='<reviewed-uuid>' and status='PENDING';
```

A public status only approves these exact **words for public display**. It does *not* attest an experiment happened, a person consented on another's behalf, or an institution endorsed anything. Reviewer can `REJECTED` or delete via an owner-only session; submission holder can withdraw/delete via receipt.

## GRAFT editorial gate

The currently discoverable GRAFT `feature/commons-approved-feed-001` branch has five entries all marked `PUBLIC_SUMMARY_PROPOSED_FOR_REVIEW`. Its `main` does not yet contain an approved `commons-feed.json` publication. Thus the public Garden displays **awaiting_approved_main**, not the five staged candidates. If an editor inspects and publishes the actual GRAFT source-bound summaries on main, they flow through Garden automatically on the next request (up to five-minute cache). No key distribution, full tree copy, real-world effect, or branch merge occurs through this reader.

## Verification + limits

- Public no-origin GET of `/functions/v1/garden-ledger` returned `garden/public-overview-v1`, empty `reviewed_only` ledger, and correct `awaiting_approved_main`.
- RLS enabled for both new tables; neither `anon` nor `authenticated` can read; `service_role` has access. Security advisor reported info-only 'RLS enabled with no policies' as expected for service-only tables.
- The read endpoint works without a browser account. **Browser POST/withdraw remains to be tested on a second real device**; do not count successful GET as an end-to-end submission test. No user submission or approved partner has been asserted.
- Independent webZ PR #94 remains a branch and may differ from live Abundent main. Garden has its own Vercel project; keep deploy source and review receipts exact before changes.

Source: `garden/workbench/server/garden-ledger/index.ts`, `garden/workbench/index.html`, `garden/workbench/sql/garden-ledger-001.sql`.
