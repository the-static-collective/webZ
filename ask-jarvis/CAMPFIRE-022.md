# THE CAMPFIRE · RIGHT TO TRY / CAMPFIRE-022

## The observation

A real Coalition of Care gathering used a symbolic campfire and invited attendees to **choose where to stand** according to what they were willing to do. The Static Collective / Abundent prototype borrows the organizing idea, **not** the Coalition's names, decisions, members, current activities, status or authority. A person willing to try a useful thing should not have to wait for a nonexistent permanent steward.

## Constitutional rules

1. **The question makes the fire.** A fire is a specific proposed need or opportunity, not a department or permanent organization.
2. **The person chooses their own distance.** Curious / Helper / Starter / Coordinator are voluntary, non-ranked, fire-specific starting preferences. Nobody is scored, promoted, demoted, assigned, tracked or automatically appointed.
3. **The right to try precedes an established role.** Draft a card, ask a question or propose a reversible experiment now. Specific operational permissions still belong to property owners, legal custodians, safety-qualified personnel and relevant independently governed organizations.
4. **A coalition emerges by consent.** A proposed connection between two fires is not a real introduction, verified collaborator, resource reservation, program or signed commitment.
5. **The first return is information.** A draft, correction, refusal, safety concern, permission or actual authorized experiment is valuable. Silence is not consent. No shame when somebody steps back.
6. **A fire is allowed to go out.** A seven-day experiment is an opportunity for a fresh decision, not a commitment to infinite meetings.
7. **Integrity > continuity.** A completed action remains distinguishable from a suggestion, a self-report from independent evidence, and interest from authority.

## What this PR actually provides

- `public/campfire/`: attractive account-free mobile page with five curated independent seed fires, a custom fire (short public-safe topic only), four choice circles, one immediate first move, three voluntary checkboxes, a seven-day timebox, human safety boundary and reversible stepping-away.
- Server-free, explicit **Invite** and **Ambassador** share sheets; supports one or two peers. Sharing never enrolls a recipient or pushes them into a roster.
- `makeFireLink` / `readFireLink` carry only public seed topic data in the URL fragment. No contact info, location/address, person, standing, donation, outcome or permission data is encoded. This is a portable question, not a public activity record.
- Self-reported status includes **declined** and **paused**; downloadable JSON receipts remain in the visitor's device, not synchronized.
- One-page print layout, independent open-role link and a prefilled-but-editable handoff to Tomorrow Machine. The Seventh Table link is question-only and never creates an event automatically.
- **Two-fire weave:** each pair of curated questions yields an editorial connection hypothesis and a tiny artifact to review, explicitly without claiming either fire has members or official support.
- The JAR home and contextual source desk now point to Campfire. Existing Steward Seeds/open roles form the opt-in follow-up path.
- All no-token runtime interactions are deterministic JavaScript; not AI, not auto-coordination, not an operational volunteer database. The code can serve as static assets from Workers or another host.

## Follow-on implementation only after this user test

An interested person may *explicitly* submit their starting place to the private, consent-gated Abundent interest desk. That is voluntary contact interest, not verified activity or a standing role. Building persistent co-owned campfires later would require a separate privacy design, leave/withdraw mechanisms, control of visibility, owner/partner admission, human event moderation, anti-spam, and safety gates for consequential real-world actions. GRAFT/FreeGraph should ingest only owner-approved, minimally scoped aggregate lessons, never infer leadership scores from personal records.

## Review / release

This is a branch stacked on the draft Steward Seeds PR (#123), which itself is stacked on the isolated Cloudflare canary PR (#119). GitHub CI checks Node 22 unit tests, Python syntax and Worker configuration without deployment credentials. **Source passing CI does not mean a new route has been deployed**; `jarvis-compute-lab` on Cloudflare was configured for its original `feature/jarvis-cloudflare-modal-canary-019` branch and must only receive these changes through an explicit reviewed merge or branch transition. Do not claim the official Coalition has endorsed this prototype.
