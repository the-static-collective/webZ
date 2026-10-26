# WEBZ-036 — Doors into organizations that do not exist yet

Prepared October 26, 2026. Status: source-built, not yet deployed.

## Premise
A door can be prepared without manufacturing the institution behind it. Six independent **proposed organizational possibilities** have public discovery cards at /becoming/doors/; the seventh, Unnamed Chair, is simply an empty local drafting form. No proposal creates an organization, enrolls a member, recruits a steward, confers authority, or registers a nonprofit.

## The six candidates
- The Garden Table: design a consent-reviewed sample-table invitation, not a new operating store or co-op.
- Porchlight Circle: explore privacy-first peer belonging without a public survivor directory or confidential case intake.
- The Common Press: draft author-rights checklist and permitted mock edition, not a lemonPRESS admission.
- The Useful Tool Shed: create fictional repair guidance; no third-party hardware or electrical work.
- The Artist Commons: sketch an artist-led gathering without assuming any partner venue, festival or performer.
- The Return Table: trace a fictional need, offer, review, permission, refusal and possible return.

Source: /becoming/doors/seeds.json. Every card has a first question, a bounded first act, a possible steward ROLE (never an assigned person), minimum return evidence, guardrail, and inspirational project links. Links are not affiliations.

## Local handoff
The user chooses a seed or the empty chair, edits five non-identifying purpose fields in memory, explicitly acknowledges that this is an unshared proposal, and may deliberately copy or download Markdown/JSON. The exported machine sheet has schema webz/organization-seed-sheet/v1, status UNFORMED_CANDIDATE, proposalOnly=true and authority.level=none. Changing the fields invalidates a prior draft. No visitor records, identifiers, survivor stories, telemetry, server submissions or automatic invitations are collected.

## lemonPRESS-style Books for Computers
/for-computers/organizations/ contains 6 source-linked fragments, individual machine cards and Markdown chapters, manifest.json, index.json, relations.jsonl and README.md. All fragments have identity, provenance, local continuation, uncertainty and no-authority boundaries. Any suggested subdomain is an UNCONFIGURED PROPOSAL. A public machine-readable file is not a lemonPRESS house admission.

## Release contract
The immutable exporter adds these static public paths to the verified source allowlist; the original offline shell and service worker do not change. The final release receipt hashes every public emitted file.

Commands: npm test; npm run field:verify; npm run build; node scripts/verify-release.mjs dist; npm run test:browser; WEBZ_TEST_SITE=dist python tests/organization_doors_browser.py.

Run desktop and 320px Chromium tests, consent-gate test, local JSON/Markdown exports, source and machine manifest checks, privacy/no outbound request check, and released dist browser check.

Before production, require successful latest-HEAD GitHub Actions, a READY exact-SHA isolated deployment, and 200/MIME/CSP smoke tests; then only on the actual apex-owning project stage narrow paths for /becoming/doors/* and /for-computers/organizations/* while preserving all other existing routes. Do not claim these pages live until that is checked. Deployment quota was previously blocked; no silent billing changes.

## The distinction
Not a click, a visit, or a proposed charter: a genuine we've is a voluntary, consented, attributable useful act inspected by the people involved. Refusal and UNKNOWN remain legitimate states.

INVITATION != CONSENT. PROPOSAL != INSTITUTION. CONNECTION != COMMITMENT.
