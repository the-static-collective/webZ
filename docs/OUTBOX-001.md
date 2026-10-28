# OUTBOX-001 — one encrypted place for our unsent drafts

**Scope:** working, client-only, manually operated correspondence desk, **not** an SMTP client, sent-mail folder, or cloud inbox.

## What was actually unified
- 23 prospective institutional draft letters are derived directly from [BRIDGE-NETWORK-003](../bridge/network/model.mjs), not copied into a conflicting independent roster.
- 2 Waseca SHELF-001 local need inquiries come from the [public food source/receiver model](../bridge/locus/model.mjs).
- 1 CADA independent safeguarding review letter is copied from the **already public** exact approved envelope in [POST OFFICE 006](../api/post-office/outreach.js). Its status here is **unknown**; the outbox cannot read Resend provider logs, and source presence is not proof the letter was never sent. It is not a new sending authorization.
- 1 Bryan/MSU technical follow-up is copied from [MSyoU's unsent contact note](https://github.com/the-static-collective/MSyoU/blob/main/docs/CONTACT-NOTE.md).
- 3 Porchlight shelter-provider introductory **reconstructions**, plus Kinship, Coalition of Care, and Benya editorial **newly reconstructed templates**. These are explicitly `RECONSTRUCTED_TEMPLATE`, not claims to have recovered the exact old message wording.
- The user can add and edit additional private drafts, recipients, notes, readiness, a self-reported sent/replied date and account evidence. Do not promise that 100% of drafts in old chats, email accounts and unindexed repositories were found.

## Private custody & release gates
- `/bridge/outbox/` works without backend, API, account, Vercel, mail credentials, cross-origin fetches, or email sending.
- Only encrypted AES-256-GCM ciphertext resides in **outbox-specific IndexedDB**. 600,000 PBKDF2-SHA256 iterations; unique 16-byte salt and 12-byte random IV; fixed context AAD; strictly validated encrypted backup JSON; no password in storage.
- No plaintext data is written to public GitHub source when an operator edits. The seed templates in `catalog.mjs` are *public project text* and do not offer secrecy for the public originals.
- A new encrypted vault imports source seeds once. `Import missing public seeds` adds new IDs without overwriting existing content or statuses. A receiver address is blank unless already public and verified independently; source snippets never claim recipient permission.
- Manual editor has `DRAFT`, `READY_FOR_REVIEW`, `HOLD`, `SENT_REPORTED`, `REPLIED_REPORTED`, `CANCELED`. The latter two require an owner-supplied timestamp and evidence note; they are self-attestation, not a provider receipt or independent delivery proof.
- `Copy` uses browser clipboard; `Open mail app` constructs an explicit `mailto:` only when a recipient is present. Neither makes a send; device email client may default to a non-work account. No automatic queue draining, retries, campaigns, address harvesting or background sending.
- AES-GCM encrypted JSON backup is required for migrating browsers/devices. An empty browser may restore; restoring cannot overwrite a vault with unsaved or differently keyed content. Losing passphrase or browser contents without backup loses data.
- Auto-lock after ten minutes of inactivity, or five minutes in the background. Cross-tab write uses a ciphertext revision compare-and-set; private content stays only in runtime memory while unlocked.
- No actual provider send logs were inspected. **Existing Post Office 007** remains the separate source-allowlisted Resend operator send interface for exactly approved envelopes and is not altered.

## Portable deployment / Vercel diagnosis
The outbox lives inside `bridge/`, already copied into `apps/dist/bridge/`. Production is served only after a successful *provider-independent* GitHub Pages publish. This artifact remains browseable even if Vercel's Hobby deployment API reaches its 100-deployments/day limit.

The GitHub Pages publishing workflow previously watched only `apps/**`. Changes under `bridge/**`, `commons/**`, and `jubilee/**` would not publish without an unrelated apps file modification. OUTBOX-001 fixes this path filter and validates that the outbox files appear in the Pages bundle. If GitHub Pages has registered its custom domain, DNS can move **only apps.abundent.org** to GitHub Pages after verifying the outgoing artifact and HTTPS. This commit does **not** change the authoritative Cloudflare DNS or email records.

**DO NOT** associate outbox URLs with email send authorization. GitHub Pages is static and cannot host server-side Resend APIs. Keep the Post Office sender on a deliberate independent backend until a separately reviewed migration.

## Workflows
`node --test tests/outbox.test.mjs`, `npm test`, then `npm run test:browser`, then portable-static publisher / Pages. Check browser behavior on mobile: create, unlock, import, edit, copy, prepare mail app, encrypt backup, restore only empty, no network calls. Run no actual sends.
