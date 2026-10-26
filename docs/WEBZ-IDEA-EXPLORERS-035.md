# WEBZ-035 — An organization-shaped empty chair and two explorable source engines

**Prepared:** 2026-10-26  
**Status:** Source-implemented and CI-gated; no claim of deployment, live subdomains, or editorial admission.

## Why these pages exist

The Static Collective's newly adopted *working* identity is **"an organization of organizations that don't exist yet."** That is an invitation architecture, not a claim that organizations, staff, stewards, partnerships, or legal entities already exist.

The `/becoming/` page is a human-accessible descendant of the public GitHub profile, and its three-fragment machine counterpart is at `/for-computers/ideas/identity/manifest.json`. Source decisions remain with the profile and individual projects.

The next step is not turning every repo into the same generic website. It is building navigable, inspectable **public projections of distinct source owners**:

| Human page | Source lane | Owner | Proposed dedicated address (not deployed) |
| --- | --- | --- | --- |
| `/explore/` | Two-engine crossing desk | webZ proposal only | `abundent.org/explore/` |
| `/explore/slice/` | Historical formation witness | `the-daily-slice` | `slice.abundent.org` |
| `/explore/treasure/` | Evidence-constrained case research | `national-treasure` | `treasure.abundent.org` |

`/explore/catalog.json` is **source-pinned**, manually derived from publicly accessible owner repositories; it is not dynamic ingestion, full repository mirrors, or continuously updated content. Initial scope:

- **29** Daily Slice chronological index pointers from exact public commit `23c3d4bf7e4febb89919a3d54b6e8aaf3a764120`. The underlying individual slices and their corrections remain at the owning repository.
- **17** National Treasure `main` case READMEs plus **2** explicitly incubating research clues, from exact public commit `a6f1533537f88e837ba1560731d23645676a5b52`. Presence in `cases/` is *landed repository state*, not factual, scientific or historical endorsement. One case is explicitly a failed/synthetic specimen.

No private Idea Grove app, secrets, user-submitted drafts, survivor records, personal correspondence, or external partnership claims enter this catalog.

## What the UI actually does

1. Filter/search the two source lanes locally.
2. Choose one Daily Slice source and one National Treasure source; both remain visibly attributable to pinned upstream GitHub URLs.
3. Generate a **proposal only** using one of five lenses: productive question, small community experiment, falsification test, unoccupied stewardship chair, creative/story prompt.
4. Copy the proposal or save it as Markdown with local browser functions. No sign-in, telemetry, remote completion, saved profile, external AI, or backend writing.
5. A "Surprise me" button selects a pair locally. Source juxtaposition is a *question*: resemblance cannot become implied common ancestry.

This is a starter shelf, not a claim to import 15,000 works, index every issue, or supply findings not read from the original.

## Computer-native source editions

The build emits three independent machine books under `/for-computers/ideas/`:

- `identity/manifest.json` — **3** speculative/invitation fragments that cannot instantiate organizations or consent.
- `slice/manifest.json` — **29** fragments with exact historical source references and local catalog-neighbor graph.
- `treasure/manifest.json` — **19** research fragments with exact source pointers and uncertainty. No source claims a completed proof through retrieval.

Each computer-book fragment carries `work_id`, `edition_id`, `fragment_id`, `retrieval.warning`, manifest path, local continuation, source ancestry, explicit `authority.level: none`, and unresolved uncertainty. The immutable release includes source-derived HTML alternates for the four human pages.

**RETRIEVAL != READING · PROPOSAL != ADMISSION · RESEMBLANCE != ANCESTRY · DISCOVERY != ENDORSEMENT.**

No lemonPRESS `main` house admissions are created by this publishing experiment.

## Reproducible test and build

```sh
npm test
npm run field:verify
npm run build
node scripts/verify-release.mjs dist
```

`scripts/build-release.mjs` checks source bytes against the exact Git commit first, then generates the computer books and writes the immutable `release.json` with every resulting file hash.

The existing PWA homepage shell and `sw.js` are intentionally byte-stable while these separate public pages enter the release. Future homepage integration must regenerate and verify the service worker cache version together.

## Deliberate subdomain rollout — not yet completed

Before any new DNS or domain alias is attached:

1. Get a **READY, tested** Vercel deploy of the exact feature head for the shared webZ output `dist/`. Because Vercel's daily API deployment quota was previously hit, inspect quota/status before attempting to relaunch.
2. Open and verify `/becoming/`, `/explore/`, both lane pages, `/explore/catalog.json`, three machine manifests, and a sample fragment. Check proper MIME, CSP, hashes, and browser functionality. None are published at the time of this source change.
3. For `slice.abundent.org` and `treasure.abundent.org`, prefer **dedicated Vercel projects** reading the same *verified* repo SHA and exporting full `dist`; configure a project-local `^/$` rewrite to `/explore/slice/` or `/explore/treasure/`, respectively. Do not alias the root on a project that serves an unrelated homepage. Only attach a custom domain after the desired root and supporting absolute `/explore/*` assets return 200.
4. Confirm each project/host controls its own identity and machine entry points. A shared static code archive does **not** confer cross-repository editorial authority. Machine editions can remain federated in `abundent.org/for-computers/`.
5. A project owner reviews future automated source ingest before adding live updates. Track branch/commit, last successful refresh, failed source, and the difference between an absent item and a removed one.
6. Test rollback: remove only new domain mappings or restore the last known good Vercel deployment. Leave already working Garden, Connections, MSyoU, Reality and the JAR;VIS apex routes untouched.

## Expansion recipe

Each future candidate (Daily Slice, National Treasure, WITNESS, Story DNA, Free Graph, GRAFT, other owner-approved public projects) needs an explicit owner adapter: a source and commit, a bounded discovery grammar, distinct evidence/status labels, public/private classification, a useful human exploration move, and a machine book that survives partial retrieval.

**An unoccupied chair is a legitimate beginning; a nonexistent organization is not a fake institution.**
