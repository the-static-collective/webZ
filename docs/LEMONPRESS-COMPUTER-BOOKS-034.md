# LEMONPRESS-COMPUTER-BOOKS-034 — Abundent public machine editions

## Scope

This is a source-derived **candidate** for the public webZ site, based on `feature/abundent-auto-crossings-033`. The intended host is `abundent.org`; source preparation does not prove the domain currently serves these URLs.

On `npm run build`, the existing commit-bound public release process now creates:

- `/llms.txt`, `/robots.txt`, and `/sitemap.xml` for public discovery;
- `/for-computers/index.json`, `/for-computers/README.md`, and a minimal landing page;
- a JSON card and a Markdown reading card **for each public HTML index page actually copied into the release**;
- a lemonPRESS COMPUTER-BOOK-001-compatible `manifest.json`, `fragments/*.json`, and `relations.jsonl` so every public page is an individually attributable fragment of *The Garden Can Be Entered Anywhere*;
- `rel=alternate` links from each released human HTML page to its own machine cards;
- two experimental machine-native pamphlets: *A Leaf Is Not the Forest* and *The Door and the Empty Hand*.

This is not a crawler scraping the world; the input is only the repo's explicit release allowlist. No database reads, cookies, personalized content, visitor submissions, API queries, or private Firebox material are ingested. Derived HTML bytes and generated machine files are hashed in `release.json`, with the original committed HTML hash retained as `sourceSha256`.

## Reproduction

```sh
npm test
npm run field:verify
npm run build
node scripts/verify-release.mjs dist
cat dist/llms.txt
cat dist/for-computers/index.json
cat dist/for-computers/manifest.json
```

The normal offline portal verification workflow also checks reproducible builds. The machine generator is deterministic for an exact source commit.

## Source / projection / house boundaries

The metadata, atlas and pamphlets are **provisional**, lemonPRESS-inspired reading editions. The machine atlas follows the executable `COMPUTER-BOOK-001` fragment grammar found in `the-static-collective/lemonPRESS` branch `feat/computer-book-002-severance`: every fragment carries work and edition identity, manifest locator, local traversal, source ancestry, no-authority state and uncertainty. This is a structural adaptation; separate execution of the source verifier is not yet demonstrated by this PR. They are not formal house admissions and do not edit the lemonPRESS source register. A machine card is not the full page. A page is not a verified field outcome. A link is not permission to execute, republish, train on, or move private material.

`robots.txt` is for discovery and not a substitute for access control or consent. The generated `llms.txt` and JSON cards are documentation, not an official machine-to-machine API contract.

## Deployment boundary and other Abundent rooms

The release bundle comes from **webZ only**. Separate deployments, notably `garden.abundent.org` and other Vercel preview projects, have independent source/build ownership and are intentionally **not counted as covered**. A second phase can expose a voluntary per-site `/for-computers/index.json` at each confirmed host and publish a top-level federation catalog linking only checked manifests. Do not infer partnership, visibility, source authority, or shared private data from URL adjacency.

No production domain, Vercel alias, project root directory, DNS record, or other repository is changed by this branch. Validate the real deployed route, HTTP content types, phone navigation, and independent subdomain sources before making an apex-wide coverage claim.

**SOURCE != PROJECTION. RETRIEVAL != COMPLETE READING. DISCOVERY != ENDORSEMENT. PROPOSAL != ADMISSION.**
