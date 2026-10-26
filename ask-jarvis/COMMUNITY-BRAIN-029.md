# JAR-BRAIN-029 · Still Here and Open Seats in the site-facing Ask JAR;VIS Commons

## Why a second integration

The [actual JAR;VIS attendant](https://github.com/the-static-collective/JAR-VIS/pull/9) now has a deterministic Community Brain with the open-seat workloop, human permission gates, and a source register. The separately hosted **Abundent Ask JAR;VIS** uses webZ's 15-item static public Commons and a reviewed GRAFT feed, not the local JAR-VIS Node server. This branch provides a *small, public-safe retrieval bridge* so the site-facing assistant can retrieve the same **public project intentions** when asked about the project.

This is knowledge integration, not a survivor case database or an automatically approved program.

## New curated source index `S11`

Five additional **editorial project notes** cover:

1. **Still Here** as unstaffed, all-gender, father-attentive survivor-support prototype—not confidential case intake, a live peer group or legal representation.
2. The **Founding Companion**: ask one trusted friend to review a fictional first-gathering idea without identifying anyone.
3. The missing **privacy, safeguarding and human moderation** capacity. Unfilled and uncredentialed until human review, supervision and express authorization.
4. Separate **advocacy consultation / nonprofit legal advice / private family-law assistance**. CADA, LegalCORPS and SMRLS are independent possible organizations, not joined partners or promises of eligibility.
5. The **Open Seats** loop: blocker → missing human capability → voluntary interest → actual permission → bounded trial → reviewed return. Interest does not create a volunteer, a partnership, an accepted task or an outcome.

The five notes are labeled `DOCUMENTED_PROTOTYPE`, `DOCUMENTED_PROPOSAL`, `DOCUMENTED_DESIGN`, `DOCUMENTED_BOUNDARY`, or `DOCUMENTED_PROTOCOL` and carry owner-curated source key `S11`. Its public provenance pointers are webZ PRs #126, #128, #129, #133 and JAR-VIS PR #9. **These are draft implementation sources, not official survivor-service attestations.**

## How it reaches the site brain

- `public/community-brain.mjs` contains the five bounded public-safe notes and a narrow selection predicate, `eligibleCommunityBrainQuestion`.
- `public/commons.mjs` preserves the **original 15 public field notes** (and their existing contracts) and, only for a *short project-level question*, composes the extra five into the temporary relevance ranking. Other topics remain unchanged.
- The public question can then pick up these notes through existing `publicCommonsFor` → `/api/ask` → checked return; no upload or account required. Model usage continues to require its existing separate consent and release gates.
- Private identifying details, URLs or long text prevent the additional sensitive-domain context from being selected. The base Ask system is **not** a confidential story submission channel. Visitors should be told not to enter real personal allegations, child/custody details or evidence.
- No automatic changes to GRAFT approved feeds, published Workboard messages, victim records, legal documents, case outcomes, verified roles, real outreach or legal consultations.
- The site may still be at a distinct deployed code version until review/merge and release. This PR does not claim a production deployment.

## Independent next action

The first recruitment point for Still Here should be a voluntary **Founding Companion**, followed by an independent safeguarding/advocacy consultation and qualified organizational legal questions. Review only fictional example cases until the organization has proper policies, human operators and independent approval to interact with sensitive records.

**Invariant:** The system may remember what the organization needs to become, without remembering anybody's private trauma. Selection is not evidence; proposal is not admission; a need for protection is not a reason to demand disclosure.
