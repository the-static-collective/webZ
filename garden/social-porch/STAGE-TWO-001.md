# STAGE TWO 001 · seven-day launch baton (independent proposal)

**Live:** https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/social-porch#handoff

**Evidence as of October 25, 2026:** A Waseca County Pioneer October 22 article describes the Waseca Area Food Cooperative as already registered under Minnesota law in May 2026; it describes a feasibility study intended to conclude at the end of October, names Dana Srp as helping coordinate the Oct 25 event, and discusses Jim Boerboom in earlier planning discussions. Source: https://wasecacountypioneer.com/news/community-invited-learn-about-grocery-co-op . These facts do **not** establish who has official publication authority, current committee assignments, or adoption of this particular volunteer proposal. The participant reports that inquiries are bouncing Dana → Jim → unresolved. That is a **coordination observation**, not proof the individuals are failing, that an institution has no leadership, or that an outsider can appoint itself.

## Stage separation

**Stage 1: hold a public information session.** It successfully brings conversation and public feedback into view.

**Stage 2: turn attention into bounded accepted action.** Requires three things that publicity alone doesn't supply: `authority` (who can say yes to publication?), `operations` (who volunteers to carry the next week?), and `return` (what gets checked and reported next?). The apparent failure mode is not lack of ideas or community energy but an unowned next-decision.

The useful service for Abundent is an **option presented with a tiny acceptance surface**, not a declaration that Abundent has become the co-op's communications department.

## One ask, not a power grab

> I've prepared a six-week listening plan, two draft posts, a simple public-response guide, and a way to turn willing offers into small proposed work. I'm not asking to speak for the co-op or take control of its accounts. Would you be open to a **seven-day, review-first pilot**? All I need is to know who can check the exact two posts for accuracy, who actually holds the account publishing rights, and who should receive questions. If the team isn't ready to authorize it, I'll keep the materials as independently labeled drafts.

**For a referred question:** When person A says to ask B and B says still being decided, the missing piece is *which body can name a decision owner and by when*. Stop bouncing the same question indefinitely. Do not mass-message or assume the named people agree to be contacted. Through normal permitted contacts, suggest one combined question to the known coordinators: "Who can make this single, bounded publishing decision, or may we put it on the next steering committee agenda?" No response means HOLD.

## Optional seven-day operating loop

- **Day 1 — ACCEPT/HOLD:** authorized person(s) confirm whether to review the exact two posts. No owner = independent materials only.
- **Day 2 — REVIEW:** editor checks public claims, mission, naming, dates, membership details, accessibility, photos and quotation permissions.
- **Day 3 — RELEASE / HOLD:** an actual authorized account publisher chooses whether to release each edited post; tool performs **no publication**.
- **Days 4–6 — LISTEN:** designated willing responder handles comments, distinguishes questions from commitments, uses private approved channels for sensitive contact, and can ask a single bounded question through First Yes.
- **Day 7 — RETURN:** publish only sourced and permissioned summary: what was asked / answered / accepted / declined / still unknown. If nobody agreed, that's a legitimate result.

## Five functional roles; zero appointments

| Function | Can legitimately do | Cannot infer |
| --- | --- | --- |
| **Sponsor / decision steward** | Decide whether the pilot is in official scope and who has authority | That Dana or Jim holds that authority |
| **Facts reviewer** | Approve exact wording and corrections | Publishing credentials |
| **Publisher** | Post on the organization's actual platform after authorization | Control of other people's assets or consent |
| **Listener** | Respond to general questions consistent with owner policy | Right to extract private data or assign volunteers |
| **Return keeper** | Document decisions, decisions still unmade and next meeting | Confirmation that reported work happened |

One person can cover multiple roles **if they affirmatively accepts**. A checked box, entered name, forwarded message, or source article does not itself establish authority. Prefer one-off, timeboxed voluntary roles over requiring a new standing committee.

## If authority remains unresolved

Continue **independent** research, fact-checking, accessible questions, and printable drafts. Label the work with its own Static Collective / Abundent identity, not official co-op brand. Never claim to represent the organization or use its social accounts, donor lists, membership records, trademarks or private meeting materials without permission. Public responses/comments remain outside this tool. The kit sends **no** messages.

## Decision record (copy from the live #handoff desk)

- Scope: two posts in one week? exact draft text? approved channel?
- Authorization: independent / review invited / explicitly authorized / HOLD.
- Requested review date: a *proposal*, not a calendar event.
- Owner: unknown until volunteered and confirmed.
- Publisher: unknown until separately authorized.
- Consent/privacy: what may be quoted or published?
- Outcome: accepted / declined / still evaluating.
- Return: next check-in and what evidence would count.

### Verification

The v3 Social Porch Supabase Edge page is public and displayed "A rocket needs a next-stage crew," "Break the referral loop," and the HOLD fallback. The original six-week JSON calendar remains a publicly readable editorial draft with zero scheduled or published posts. Inline JS syntax and unique element IDs were checked before deployment. The new decision card uses browser-local inputs and clipboard/print only, **not** the central Garden ledger or institutional account system; the user decides whether and to whom to deliver it. Real-device click, copy, print and coordinator acceptance remain to be tested.

**Implementation:** `garden/social-porch/index.html`, embedded `edge/site.ts`, `tests/social-porch.test.mjs`. Garden's separate Vercel-hosted main site has a different release cadence and is not automatically updated by this Edge deployment.
