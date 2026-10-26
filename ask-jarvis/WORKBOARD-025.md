# WORKBOARD-025 · Shared, persistent community conversation history

## What is live, and what is not

A new isolated Supabase Edge Function `workboard-history` and private database queue are deployed to `pantry-gate` (`kbhqacsdvjsstzyplqij`). They **do not** alter Garden Signal, Seven Day Table, the official co-op site, or Abundent's live production alias.

- Public account-free **GET**: `/functions/v1/workboard-history?thread=all` or a six-thread ID. Returns at most 25 **reviewed** entries per page, with `nextBefore` for paging. A previously published entry withdrawn by its author appears as a text-free tombstone. No names, phone numbers, original private submissions, draft withdrawal keys, or unapproved posts are returned.
- Explicit **POST**: `action:submit`, `thread`, `kind`, `text` (12–400 characters), optional `parentId` referring to a *currently reviewed* entry from the same thread, and `consentToReview:true`. Always creates `PENDING` private content. A one-time bearer withdrawal key is returned with the receipt.
- Explicit **POST**: `action:withdraw`, `id`, `withdrawKey`. After matching the SHA256 hash, the system irreversibly replaces stored original/public text with a placeholder, invalidates the key and keeps a tombstone only if it had already been published. No administrative consent is inferred.
- Public rendering is deliberately limited to reviewed summaries. The UI can read across all topics, reply, paginate, submit privately, copy its receipt and withdraw with its receipt. Local draft and share tools continue to work independently.
- Six editorial starter topics are **not** presented as community posts or partner commitments. New custom questions remain local drafts until a separately moderated topic proposal workflow is built.

## Data and security

Migration: `database/supabase/migrations/20261026004043_workboard_moderated_history_025.sql`. Edge: `database/supabase/functions/workboard-history/index.ts`.

RLS is enabled. `anon` and `authenticated` have no direct table access. Only the backend service role touches either data table; the service role key never goes to the browser. A separate security-definer atomic admission RPC is executable **only** by `service_role`. Global submission ceilings are 45/hour and 160/day, independently of spoofable per-client network information; per-client *best-effort* ceilings are 4/hour and 12/day. No model/AI service is called and no community name is required.

The function filters basic contact details and private-looking text. That filter cannot guarantee absence of all sensitive information: **human review and redaction remain mandatory**, and review is not independent verification.

Allowed writing origins are the bounded Abundent origins and this review project's preview hosts. CORS is not a complete anti-bot measure; global counters and moderation are the important fences.

## Current human review procedure (authorized database operator only)

The moderation interface is **not yet a self-service public-facing moderator console**. Until a separately authenticated editor UI exists, an authorized database operator can review through the Supabase project SQL Editor or approved Supabase tools.

See queued entries without publishing them:

```sql
select id,thread_key,parent_id,kind,body,created_at
from public.workboard_entries
where status='PENDING'
order by created_at,id limit 40;
```

Publish a precisely reviewed, redacted version of one entry:

```sql
update public.workboard_entries
set status='PUBLIC_REVIEWED',
    public_body='THE EXACT HUMAN-REVIEWED NON-IDENTIFYING WORDING',
    reviewed_at=now(),
    published_at=now(),
    reviewed_by='authorized-editor'
where id='PASTE-ENTRY-UUID' and status='PENDING' and consent_to_review is true
returning id,thread_key,status,published_at;
```

**Before approving**, confirm the submission has no names/private identifying details, misleading implied partnerships, malicious material or unsafe promises. Review does *not* endorse or verify the statement. Approval should be reserved for editorially suitable content. Verify reply-to is appropriate to its original thread. Rejection can set status `REJECTED` and replace `body` with a non-identifying placeholder.

The user is not required to authenticate to read or prepare a submission, but there is no unattended auto-approval. Automatic GitHub/GRAFT/LemonPRESS publication is **not** enabled.

## Quality gates & release

- Tests in `ask-jarvis/test/workboard.test.mjs` include the new review-gated UI surface.
- Read-only production probe: the deployed Edge API returned `reviewedOnly:true` and an empty `entries` array on initial launch (accurate, not a manufactured community history).
- Database privilege probe confirmed `anon` cannot SELECT from either table, `authenticated` cannot INSERT, and only the service role can execute the admission RPC.
- Independently review the preview project before changing any public Abundent routing.
- Next priority: a genuinely authenticated moderator interface, clear retention/correction policy, community-governed topic creation, replay/audit of published corrections, and optional user notifications. These are **not yet shipped**.

**Prime law:** a conversation may become a doorway; a proposal does not become admission, a private submission does not become a public statement, and a moderator’s publication decision does not turn it into verified truth.
