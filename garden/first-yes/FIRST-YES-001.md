# FIRST YES 001 — The Garden's permission-aware opportunity compiler

**Live independent prototype:** https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/first-yes

**Source:** `garden/first-yes/index.html` is the canonical human-facing page. The `edge/site.ts` literal must be **byte-for-byte equal** to the page. The Edge function in `edge/index.ts` serves this literal and forwards only bounded, explicit human return submissions to the existing `garden-ledger` Edge Function.

**Status as of October 25, 2026:** First Yes Edge version 2 ACTIVE and publicly GET-verified; public context endpoint GET-verified. The main Garden Vercel site has its **own production deployment** and has not yet received the navigation change because Vercel refused a later release under `api-deployments-free-per-day`. The `webZ` PR branch carries the future links, but those are not live at `garden.abundent.org` yet.

## Why it exists

Ordinary matching connects offers and needs already known. First Yes proposes a *new cooperative intermediate action* that could make two currently separate capabilities useful together. The principal output is **not** an assignment, list of enrolled volunteers, financial claim, or self-appointed governance: it is a bounded question for an actual authorized human plus an immediately useful, reversible artifact.

## Actual first slice

1. **Choose a field:** producer listening, traveling table, responsible place stewardship, or artist-centered gathering. All are independent proposals; none assume endorsement by the Waseca co-op, any producer, university, venue, Coalition or property owner.
2. **Choose capabilities:** listening, organizing, design, research, logistics, technical making (maximum three). First Yes composes complementary hypothetical roles, not a false member directory.
3. **Compile locally:** generate one smallest-question / authority-gate / do-now artifact / four steps / complementary roles / YES–NO–NO ANSWER pathways / stop conditions / pinned source door. This runs in browser JavaScript with no remote model requests or automatic submission.
4. **Print or share:** printable 24-hour kit and permanent mission link, no tracking parameters. A second independent card has an actual QR code to the stable `https://garden.abundent.org/workbench/` public URL, making the *paper* survive future editorial updates to the workbench.
5. **Return:** select a truthful outcome and constraint (including `declined`). The page proposes a *different, permission-aware question* locally. Only with a separate explicit checked consent and click does a small `kind=return` self-report go through the authenticated server-owned relay into the same private Garden queue. It stays `PENDING`; no completion, consent or organizational endorsement is inferred. A random withdrawal capability can delete the submitted row.
6. **Learn from reviewed facts:** the read-only `?format=context` endpoint relays the actual Garden `reviewed_only` public entries and GRAFT `PUBLIC_SUMMARY_APPROVED` summaries. A not-yet-reviewed GRAFT feature branch is **not** silently admitted. Current observed state is 0 approved Garden entries and GRAFT `awaiting_approved_main`.

## Safety and trust boundaries

- **No automatic human contact:** a volunteer, steward, producer, church, organizer, or venue has no implied agreement.
- **The declined path closes the original invitation.** A stated constraint can inform a newly bounded proposal, but no retries against the unwilling person.
- **Data minimization:** question input is browser-only, no accounts, analytics or geolocation, no remote AI APIs, no private GRAFT feeds. No personally identifying text should be placed in the public field kit or voluntary return.
- **Submission controls:** Edge-only POST accepts a fixed `FIRST YES` return envelope or a withdrawal key, validates allowed categories, 1,600-byte request limit, exact application origin, and forwards exclusively to `garden-ledger`. Existing ledger validates consent again, does PII/contact pattern checks, enforces 8 best-effort per-visitor daily and global 80/hour / 300/day rate caps, and stores only withdrawal key hashes under RLS service-role-only permissions.
- **No automatic public promotion:** the queue is private, the public reader returns only `status=PUBLIC` and reviewed entries. An ordinary new return does not appear on the public page until human editorial approval.
- **Review gate:** operator still uses the Supabase SQL-editor-based workflow documented in `garden/workbench/GRAFT-LEDGER-001.md`. No public operator authentication UI has been deployed.
- **Source claims:** prewritten research doors are context, not current evidence of a participating partner; GRAFT approved summaries are evidence of documented source content, not proof of field operations.
- **Durability:** live Edge function is a separate route from Vercel's Garden project. If the public Garden URL is retained, paper QR doesn't change as the site improves. A live DNS check does not guarantee future hosting permanence.
- **No identity verification:** a withdrawal key proves possession only; people can self-report without proving they attended or did a task.
- **No third-party ecosystem writes:** this function does not activate GHoT, CANNON, Treasury, event invites, or external services.

## Live verification

- Supabase first-yes Edge v2 reported `ACTIVE`.
- Independent public HTTPS read returned page title `FIRST YES 001 · The Garden` and actual flyer with stable Garden target; `?format=context` returned `garden/public-overview-v1` with empty approved entries and a staged GRAFT editorial status, no private queue.
- JavaScript source syntax-parsed with `new Function`, validated all four mission bounded plans, source parity, unique IDs, no external scripts, consent condition, GRAFT editor gate.
- **NOT YET VERIFIED**: real mobile device interactive DOM clicking/scanning, browser POST→Garden PENDING→withdraw, hand review→public record, two-person willing cooperation. This is a production-hosted prototype, **not** a field-validated outcome or official organization adoption.
- `npm test` in this repo covers first-yes source parity and legal/consent boundaries; GitHub Actions / mobile browser checks should be read separately from source-level smoke tests.

## One test worth doing with real people

Ask the grocery organizers for one permission-bounded question that would help current feasibility work. Use First Yes to prepare the one-page interview guide *before* contacting anyone. Have one willing human review the exact question. If they agree, invite one producer appropriately. Record what actually happened through the private return path, then request editor approval for a public-safe version only if independently supported.

**Success metric:** one particular new cooperation with consent, a usable output and a distinct human-confirmed return. **Failure is data:** no participation, no response, refusal, or permission restrictions should stay intact as such—not converted to artificial progress.
