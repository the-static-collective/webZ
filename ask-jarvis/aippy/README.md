# AIPPY-023 · Sparkfork release kit
Status: **PROMPT_READY / NOT BUILT IN AIPPY / NO CREDITS SPENT BY THIS REPO**.

## Why this is different
Aippy is not being asked to reproduce JAR;VIS, store private contact data, or operate the grocery. It is a public playground / distribution channel: a tiny interactive spark can be played, shared and **remixed** into entirely new themes. Abundent remains an optional destination for people who *explicitly* decide to pursue real-world work.

The Aippy spark must be useful even if the owner loses access to Aippy or a stranger modifies the theme. This is a deliberately open invitation, not a disguised data funnel.

**Toy → invitation → optional human action → independent real-world return.**

## Three clear layers

**Layer A — Aippy (external community):** Fast independent microgame, native sharing, Aippy's native permissioned remix/credit lineage. Owns its platform's creator/social features. A user can play anonymously in the microgame. Creator account is a separate Aippy matter.

**Layer B — Abundent / JAR;VIS (independent first-party):** `/campfire/` for self-chosen interest circles, `/roles/` for emerging responsibilities, `/tomorrow.html` for bounded field missions, `/tables/` for seven-day question handoffs, `/contact/` for explicit private contact consent. These routes are **in the current draft PR stack, not verified production URLs**. First external link from the Aippy build should point only to `https://abundent.org/` (known independent origin), until route release is verified. *Do not promise working deep links yet.*

**Layer C — optional future public API:** After validating the player experience, a separate limited Cloudflare Worker endpoint could accept a **public-safe, non-identifying, versioned idea seed**. It would not accept or read Aippy credentials, personal contact lists, app creator identifiers, or a user's Aippy account. It must respect rate limits and moderation, record proposals separately from permissions, require explicit player action, and keep administrative credentials server-side. Supabase remains under first-party RLS and explicit consent; Modal compute is optional, not in first build. No API hookup exists in this PR.

## Release protocol
1. Paste `SPARKFORK-AIPPY-BUILD-PROMPT.md` body into Aippy's new create action. The first prompt should produce a completely standalone, non-networked game.
2. Test on the user's Android phone: cold launch, touch/drag fallback, accessibility contrast, two offerings → one useful mission, ring selection, retry, share and copy fallback; test first launch without permission grants.
3. Ensure it never fabricates a "verified food steward", authorized cleanup, partner signup, completed outcome or recipient. When unsure, replace operations with a **question**, a paper-only simulation or a draft to review.
4. Check that creator **allows Remix** before making it public. Aippy says remix is allowed only when the creator enables it. Publishing publicly may expose creator profile information under the platform's privacy policy.
5. Publish one strong original, not dozens of low-quality clones. Try three radically different remix paths below only *after* the first loop works.
6. Share the finished **actual Aippy project URL** back into this repository, then make a tested reciprocal link from Abundent's Campfire. Do not invent its ID or URL.
7. If an official, documented Aippy API becomes available and is explicitly authorized, consider a source-first importer that stores **only public approved remix roots and creator-approved provenance**. No scraping user data or violating platform rules.

### First three Aippy remix challenges
**Challenge 1 — Neighborhood Noir**
> Remix SPARKFORK into a rainy 1999 detective arcade. Every offering is a clue on a sticky note. The final artifact is a one-paragraph voluntary invitation. Preserve four commitment circles, human permission gates, no network requests, replay, and attribution to the original where the platform supports it.

**Challenge 2 — Galactic Campfire**
> Remix SPARKFORK into an absurd cosmic space station: resources become cargo pods and the campfire is a miniature sun. Two offerings fuse into a mission planet. Keep the same 45–75-second loop, no presumed partners, no automatic actions, and the option to remix again.

**Challenge 3 — Porch Gospel**
> Remix SPARKFORK into a warm Midwestern porch jam game, where offerings are instruments, blank sheet music, chairs, acoustic space and spare time. A combination produces a 15-minute invitation to co-create one original song. Preserve music rights/host permission and all consent boundaries. Do not claim a church is involved or sponsoring the event.

### Later mutations (reserve credits)
- The Haunted Toaster: toss two tools into a toaster; pop out a civic mission.
- The Banana Court: bananas convene an absurd council where every creature may refuse.
- Park Quest: a cozy pixel RPG where clearing a path begins with asking the owner.
- The Little Lemon Press: print invitations that become shareable newspaper clippings.
- Radio Spark: tune eleven dials and uncover one actionable question per frequency.

## Evaluation scoreboard (not a people-score)
Assess the **experience**, not the audience's leadership:
- Can a new visitor complete one loop in under a minute?
- Did the player smile and want to recombine?
- Does the player see the next available action without being forced to enroll?
- Can a second creator remix the **published Aippy original** without special instructions?
- Do any share/copy steps reveal personal details or imply unsupported partner commitment?
- Can a tester with no technical knowledge get through on a budget Android device?
- Does the optional Abundent link lead to a verified working page?

Aippy generations/remixes consume credits. The user reported about 2,000 available and guesses ~50 credits/build; do not assume the exact current rate. Confirm pricing in their account before spending; reserve credits for quality passes and derivative experiments.

## Constitutional inheritance
*The right to try. The right to decline. The right to return. Integrity > Continuity.*

Every descendant can change its gameplay, art, name and emphasis. Abundent cannot compel a remix to retain attribution, claims, or any original wording. Therefore the parent maintains accurate records for its own releases, while Aippy handles its platform's creator/remix lineage. The first game must be intelligible as a standalone work; visitors are never required to visit Abundent.
