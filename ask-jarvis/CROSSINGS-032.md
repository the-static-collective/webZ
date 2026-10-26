# ABUNDENT CROSSINGS-032 · one card across our recent experiments

**Date:** 2026-10-26  
**Branch:** `feature/abundent-crossings-032`  
**Ancestry:** `feature/abundent-public-first-yes-030` (including merged Commons PR #137)  
**Status:** Source candidate / draft. No production claim or partner affiliation.

## Why this crossing exists

The week of October 19–26 produced several separate Abundent doorways.
A person can already ask JAR;VIS, print First Yes / field cards, read a Workboard,
find a Campfire place, invite a Seventh Table, sketch a Weave, see the Garden,
or explore Still Here. These services have distinct review, privacy,
deployment and authority boundaries. **A collection of links is not an
integrated backend.**

CROSSINGS adds a **small, actually portable file protocol** that a person
can carry by choice from First Yes to Crossings without transmitting the
original question or assuming a live receiver. The Crossings page imports
the strict `abundent/public-crossing/v0` ticket locally, renders fixed
topic-appropriate links, and can export an explicit local self-reported
return (`abundent/public-crossing-return/v0`). No automatic cross-post,
central identity, approval, inbox, account, or network matching is added.

## The human path

1. At `/first-yes/`, prepare a public community question, optionally
   reading **human-reviewed, not fact-verified** Workboard contributions.
2. Download **Save crossing ticket (.json)**. The file contains only
   topic, type of voluntary action, date, optional public publication-review
   entry ID, and explicit all-false authority flags. It excludes the question.
3. At `/crossings/`, open the ticket in the browser. The original
   question is not recoverable from the ticket. Or simply browse by topic.
4. Choose a link. This opens a separate, owner-bound door with no query,
   fragment, personal content, keys or file data in its URL. **The destination
   does not automatically import the ticket**.
5. Back on Crossings, save a narrowly selected self-report without names or
   narrative. "Completed" is labeled unverified; a refusal is preserved as
   a valid return. Nothing has been posted to the Workboard or a partner.

## Different rooms, distinct handling

- **Food** → public moderated Workboard, independent Garden, a seven-day
  invitation and print cards. This is not official cooperative intake.
- **Artists** → Workboard, Campfire, invitation and Weave.
- **Parks** → Workboard, print cards, Campfire and Weave.
- **Church** → Workboard, invitation, Campfire and separate optional contact.
- **Care** → *only* Still Here, Still Here stewardship, and Campfire.
  Do not route private survivor cases or names into public Workboard,
  Table, contact or general-question URLs.

`/crossings/` deliberately has no text entry, storage, server API,
identifier sync or automatic delivery. The browser's downloaded files and
history may be visible on a shared device.

## Release and verification gates

- Source: run `cd ask-jarvis && npm test` (contains strict crossing model,
  return and static UI tests). Also check the real phone upload/download
  round trip with airplane mode.
- Verify public `/first-yes/`, `/crossings/`, and their reciprocal links
  on the exact target Vercel project and commit in preview.
- Verify cross-domain Garden link, and on-phone print/readability.
- Check that all sensitive routes and forms fail closed.
- **Do not merge to `main`, alter the public domain alias, or treat
  preview success as a staffed moderation process.** Owner approval and
  release evidence are separate.
- Next genuine integration: destination-owned import adapters and explicitly
  permissioned moderated submissions, not passing unsanitized local data
  between existing databases.

**Integrity > Continuity. Selection ≠ evidence. Proposal ≠ admission.**
