# STILL-HERE-025 · A private first door for someone carrying a difficult story

> You don't have to start over. One particular. One action. One return.

## Purpose

Turn the recent WORKBOARD-024 insight—every conversation can become useful work—toward someone who feels isolated in a conflictual or potentially coercive relationship, especially a parent navigating separation, testimony pressure, or limited money. Help without declaring one party truthful, publishing allegations, or making a cold community sign-up the first step.

## First usable slice

The opt-in `/still-here/` page is linked from the Ask JAR;VIS front porch. Four independent doors:

1. **Tonight:** a one-hour safe next-step plan plus professional help.
2. **Continuity:** a source-aware event timeline and copy/download/print carry-forward note. Separates directly witnessed, reported, inferred, and documentary sources.
3. **One person:** a small, bounded, non-accusatory invitation that is never sent on the visitor's behalf.
4. **Child:** practical call scripts and links for family-law self-help, fee waiver, and advocates. No guarantee of legal result.

Resources are verified official destinations: the National Domestic Violence Hotline, Minnesota Day One, Minnesota Judicial Branch Self-Help and fee waiver.

## Scope and safeguards

- No API call, tracking library, browser persistence, cookie, analytic service, public posting, or server submission from this page. User content lives only in the open page's JavaScript memory.
- No input appears in the URL. Clipboard, downloads, printing, and links are explicit user gestures.
- User-generated strings are rendered with `textContent`, never `innerHTML`.
- The user is warned that local/private **does not imply secure** on a shared or monitored device; browser history, clipboard, printer and downloads may reveal activity.
- A local note is labelled **self-reported, not independently verified**, and original evidence should be preserved.
- The page does not diagnose, investigate, determine custody status, infer a crime, contact another person, or offer legal advice.
- Wording does not presume a perpetrator's gender, demonize an absent party, or make participation conditional on publishing a story.
- Built without inline scripts/styles to respect the existing Vercel Content-Security-Policy.
- `noindex` because a sensitive, early-stage door should be shared deliberately rather than optimized for search discovery.
- This is a support **prototype**, not a secure evidence vault or staffed service.

## Verification

- Static privacy / source / keyboard / strict-CSP tests in `test/still-here.test.mjs`.
- Browser QA locally: 390px mobile Chromium; switched among doors; added an event; generated a text download; composed an invitation; observed no JavaScript page errors.
- Do not treat a passing test or local report as proof of abuse, a support provider affiliation, or a production deployment.

## Future work (only if explicitly authorized)

1. Accessibility assessment on Android with TalkBack and real low-bandwidth phones.
2. Review language and local resource referrals with a qualified domestic-violence advocate (including providers serving men) and an attorney familiar with parenting matters.
3. Optional **user-controlled encrypted** carry-forward storage if security can actually be demonstrated; no automatic upload, AI training, indexing or GRAFT ingestion of personal case records.
4. Voluntary, explicitly permissioned peer navigation with real human safeguarding and moderation, never a public allegations board.

The first meaningful return is not a new user in a system; it is one person leaving with a safer next step and a more portable story.
