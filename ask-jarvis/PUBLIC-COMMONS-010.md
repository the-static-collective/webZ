# COMMONS-010 — Everybody inherits a usable starting point

## Problem addressed

Previously, FIELD-WITNESS-009 required an operator to upload a local JSON file **per browser page session**. It was never a shared server memory, a production knowledge index, or public provider training. This defeated the intended "anyone we send to Abundent stands on earlier work" experience.

## Implemented

- `public/commons.mjs`: an openly distributable static, curated, non-identifying **15-note editorial project snapshot**, sourced by human selection from a separate owner-held Drive source register. There is no secret file, personal roster, private Drive URL, Google OAuth token, or third-party consent claim in the public package.
- `selectCommons(question)`: deterministic, bounded, low-cost local relevance selector, including cross-project lane diversity. It is not a search engine over every GitHub repo or over live Drive changes.
- `src/worker.mjs`: every ordinary `/api/ask` response automatically selects and *includes* relevant project notes, a reasonable first check, and a separate `Public Commons` step. Those selected editorial statements are included in the return's SHA-256 evidence receipt. This does **not** make the editorial summaries evidence of current real-world conditions.
- Public JAR UI displays the selected notes directly in the answer with status and owner-held source-register keys.
- `/commons.html`: static, account-free, zero-inference public project index with local search and pinned public GitHub methodology/source-code doors. No app upload, login, API token or AI provider charge.
- Protected `/api/council` now uses the same question-selected public notes by default even without an operator upload. Groq scout and Gemini critic still receive those notes **only after an explicit Council click**. Source status `SITE_PUBLISHED_UNVERIFIED` is preserved in the response and checked against the original local selection; owner-controlled local JSON import remains an optional override.

## Scope and source honesty

The fifteen seeds are author-curated summaries of *planning documents*, not public republications of the underlying native Docs. Those original Drive files and their original source IDs remain under owner custody. The public index prints that original source ID as an owner-held lookup key, **not** a citeable public document. Pinned GitHub methodology doors do not verify claims about neighbors, organizations, or economic impact.

This is not fine-tuning, a permanent self-updating memory, unbounded web retrieval, a production AI-chatbot or any invitation to share personally identifying information. It is a first **versioned public knowledge layer** that all visitors receive on every ask. It works with AI off.

### Explicit system boundaries

- Built-in Commons is cheap static code. Model inference in Council remains *Preview-only* and has no public rate or cost guarantees.
- No public visitor can edit published notes; changes require an attributable versioned source commit and code review.
- No publishing the complete owner Drive, partner contact details, congregation records, donor/beneficiary details, unpublished sensitive material or real-time local intake without independent human review.
- A keyword match is relevance only, not consent or evidence.
- Future extension: owner-approved ingest queue from GitHub/Drive -> public/private classifications -> inspected source versions -> editorial review -> new immutable Commons release -> optional searchable embeddings/index -> bounded retrieval on every question. A change in private Drive should not silently rewrite the public record.
- Before broad use, route the static public Commons into the public production JAR/Abundent page after normal PR/release review. Do not promote protected model keys or preview council to production.

## Smoke questions

- "Which existing food-exchange experiment could be adapted for a neighborhood grocery?" should surface the grocery plan and PENNY fictional handoff while refusing to infer operating food delivery.
- "How could a church music team collaborate on a traveling supper?" should surface church-music, hospitality and Road conceptual work, while refusing church sponsorship.
- "What would it take to host a Mankato arts gathering with the Coalition?" should expose Coalition/arts ideas and ask who would authorize them.
- "What is the purpose of TABLElogic or LOADOUT?" can link the pinned public methodology, not invent native runtime execution.

**The first public insight:** No upload is needed. Everyone gets versioned shared research context. A writable living graph and real-time research require further explicit, source-accountable work.
