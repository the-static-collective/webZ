# ASK JAR;VIS — Public return loop 002

**One question. A small thing you can take away.**

The 1999 Ask JAR;VIS front page now has a structured public return loop. The existing production page remains at [abundent.org](https://abundent.org); this branch prepares its next release. See [release 002](RELEASE-002.md) for actual verification and preview state, and [release 001](RELEASE-2026-10-23.md) for the original hostname cutover and Garden rollback.

## What works

- One question returns a **question card**, **editable invitation draft**, **possible source door**, or **original song sketch**. An optional selector overrides deterministic intent rules.
- The encounter preserves the question, possible topics, unresolved gaps and fact/idea/relation distinctions. Unknown or mixed contexts keep uncertainty visible. There is no hidden model.
- Three relevant documents are read through fixed adapters for JAR;VIS, Workbench, TABLElogic, planZ, CANNON, GHoT and reLATTE. Each entry names an exact Git commit and a document owned by that project. Full bytes are hashed; unavailable, oversized or timed-out reads have no digest. A source pin is an address, not owner-selected canon.
- All draft prose is locally composed from explicit templates and the question. Source inspections supply provenance and possible document doors; reading a README does not run that project or make its author a participant.
- Invitation drafts leave time, place and organizer open. Edits stay in page memory and download separately as edited unsigned drafts.
- Songs include original template lyrics and a new deterministic melody seeded from the question. Browser-local synthesis makes a playable/downloadable PCM WAV instrumental sketch. Nothing plays automatically and no recording service is contacted.
- Text returns, complete JSON receipts and prepared Workbench requests can be downloaded explicitly. Printing prints the original return.
- The browser independently recomputes the evidence digest before displaying the artifact. The receipt contains the complete evidence it hashes, including sources, encounter, original artifact, trace and handoff. It is **unsigned**; a digest cannot authenticate the author or prove a claim true.

## Run locally

Node 22+, with no runtime dependency installation:

```sh
cd ask-jarvis
npm test
npm run serve
# Open http://127.0.0.1:8799/
```

In a proxy-managed Node 24 environment, `node --use-env-proxy scripts/serve.mjs` honors the inherited proxy for public source reads. Normal local machines can use `npm run serve`.

Real desktop/mobile browser checks (from the repository root):

```sh
python -m pip install -r tests/requirements.txt
python -m playwright install chromium
python ask-jarvis/test/browser.py
```

This browser test starts the loopback server with the explicit `--fixtures` flag. Its document reads are synthetic test fixtures; its Chromium interactions and WAV playback are real. The flag is confined to the development server, which is not part of the hosted API. Evidence lives in `evidence/ask-jarvis-return-002/`. Separate live-source/preview checks establish actual public reads.

Cloudflare development remains available through `npm install` and `npm run dev`. The Worker and Vercel adapters share the same assembly implementation. No Cloudflare custom domain or Worker cutover is claimed.

## Contracts and future Workbench bridge

`POST /api/ask` accepts `{ "question": "8–360 characters", "kind": "auto" }`. Kinds are `auto`, `question`, `invitation`, `door`, and `song`. Requests are bounded to 1,800 UTF-8 bytes. Each source read has a 2.8-second deadline and a 90,000-byte budget, including its body. Questions are not placed in source URLs or transmitted to source repositories.

The existing `ask-jarvis/return-v0` fields remain available. Additions:

| Field | Contract | Meaning |
| --- | --- | --- |
| `encounter` | `ask-jarvis/encounter-v1` | Literal normalized question, local classification and gaps |
| `return` | `ask-jarvis/artifact-v1` | Original draft body, kind, next question and optional score/source doors |
| `evidence` | `ask-jarvis/evidence-v1` | Complete unsigned evidence body |
| `receiptHash` | SHA-256 of `JSON.stringify(evidence)` UTF-8 bytes | Reproducible digest; property order is part of this encoding |
| `workbenchRequest` | `ask-jarvis/workbench-request-v1` | Manual-only `PREPARE_DRAFT` handoff with `authority: NONE` |

The Workbench handoff has no destination URL and no dispatcher. It is not yet an accepted native Workbench import format. Adding that bridge requires an operator-reviewed endpoint and authentication, a source-owner capability contract, receiver-issued outcomes and reconciliation. TABLElogic is a conceptual source whose distinctions inform this local adapter. Native CANNON validation, GHoT execution and signed reLATTE crossings remain separate integrations.

No database, visitor question storage, analytics, cookies, external model calls, arbitrary URL fetching, external writes, partner messages or automatic project execution is added. Drafts leave the browser only when the visitor explicitly saves them or follows a document link; the initial question is sent to the same-origin API to compose its return.

The original Garden remains preserved at https://webz-field-porch-theotherlucasv-1250s-projects.vercel.app/. No production alias or DNS change is included in this branch.
