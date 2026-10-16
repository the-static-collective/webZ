# BANANAS-001 — Seed Reactor on the Abundent Door Composer

**Working branch:** `experiment/abundent-banana-reactor-001`  
**Base:** `release/needs-001-abundent-live` (unmerged draft PR #64).  
**Source:** planZ draft PR #19, exact source commit `7481da74c98b66ef34daf04a6d36458fedae7167`.

## One particular, eight possible futures

On `/composer/#reactor`, the existing source-bound navigation composer remains intact. A visitor can select a real catalog particular above the reactor or enter up to 160 characters of optional local text, choosing one of seven input types (song/story/world/question/need/object/machine).

The static reactor uses a **pinned, first-party, public-safe snapshot** of the 64 candidates and the eight proposal-only chamber recipes. It ranks chambers by *curated medium affinity*, not compatibility, actual availability, owner permission, or implementation readiness.

Each chamber can expose its proposed five-to-six core PlanRecord leads, optional orbit leads, suggested smallest pilot, proposed return, candidate owner repositories, and **unsatisfied independent gates**. A visitor deliberately selects a chamber and may copy the resulting **UNISSUED** JSON capsule. If clipboard is unavailable the same opt-in click downloads a JSON file.

The 64 records preserve their original **UNKNOWN / LOW** status. The copied capsule explicitly marks **published/executed/ownerAdmitted/mediaTransferred = false**. No runtime or host receives an approval from this instrument.

## Source custody and replay

The browser requests only:
- its existing same-origin `field/public-field.json` and `music/rooms/catalog.json`;
- `composer/reactor-catalog.json`, a checked-in, constrained public snapshot.

The snapshot carries the source planZ commit, exact Git blob SHA for the 64-plan harvest and eight-chamber recipe file, and a link to the draft. It is **not** a live API query, proof of source transcript custody, or verified owner-capability audit.

The pure model `composer/reactor.mjs` validates exactly:
- **64** unique and well-formed plan IDs;
- **eight** unique chambers;
- **98** composition membership edges;
- **34** seeds repeated in multiple chambers;
- no missing, invented or duplicate local member;
- all PlanRecord leads still `UNKNOWN / LOW`;
- independent human/source gates and a non-authoritative catalog status.

On malformed/stale data, the reactor shows an error; the original navigation composer stays operable. The two components are deliberately loosely coupled via a browser event carrying only the currently selected committed catalog particular.

## Privacy and rights

Local visitor text stays in page memory only, not the URL, browser local/session storage, a remote submission, nor a query string. No login, telemetry, HTTP POST, account, upload, recipient, media conversion, model API, third-party network connection, live planning change, or publication exists. Copy/download is an explicit manual action and the user must inspect personally entered content before redistribution.

Unquoted seeded titles and proposals are provided only as bounded public-safe conversation **reconstruction clues**. Their owners, source rights, original transcripts, current code, planned work and compatibility are not established by this map. Public GitHub data is read-only here.

**ONE PARTICULAR → CANDIDATE CHAMBER ≠ EXECUTION.**

## Public release and integration

The immutable export allowlist in `scripts/build-release.mjs` now includes the **four** new reactor assets. `/composer/` is already exported; its existing `/week/` and music-room entry doors are unchanged. As before, the composer is **not** in the generated offline service-worker precache. The cached homepage and fixed shell are intentionally unchanged to avoid a false offline identity. The branch is suitable for preview/review after CI; **no live deployment is claimed**.

To run local checks:

```sh
npm test
npm run field:verify
npm run build
node scripts/verify-release.mjs dist
python tests/composer_browser.py
```

The browser test covers nested-path hosting, 320px viewport, source-bound switching, local entry, no data in URL/storage, CSP and same-origin requests.

## Next independently authorized field gate

Choose one rights-permitted particular (a specific track, story seed or harmless question). Verify its owner/source byte identity and choose **one** chamber. An owning repository must then run a real native pilot and return an independently auditable HOLD/REFUSE/test receipt. Only *after* that independent event should a separate Abundent public return or workflow integration be designed.

Do not promote provisional PlanRecords or automatically merge the planZ branch to make this launch appear complete.
