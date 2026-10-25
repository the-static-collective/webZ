# FIELD-WITNESS-009 — One Table · Grocery · Church Music · Road

**Operator-only, protected preview. This is retrieval-grounded context, NOT model fine-tuning.**

## Purpose

The initial council inspected a handful of public README excerpts. It reasonably returned HOLD for a hypothetical missing local steward, but knew almost nothing of the already documented *work and proposals*. A project-ecosystem observer needs a wide, bounded field, with observation ≠ commitment and fictional demo ≠ actual service.

A **private native Google Drive owner-review document**, `FIELD WITNESS 001 — One Table · Garden · Road · Church`, now contains fifteen selected, non-identifying, documented project observations and a nine-file source register. The Drive file retains the full original source URLs and texts under the owner's access controls. The owner retains authority to revise and select data. **The Google Drive URL, content and credentials are intentionally NOT committed to this public repository.**

The separate `ask-jarvis/field-witness-v1` JSON file is the bounded *operator-controlled import*. The preview file selector parses it **entirely in page memory** (no localStorage, no auto upload, no server-side persistence). Once the user explicitly invokes Council, only whitelisted `id`, `lane`, `status`, `observation`, `firstCheck`, `sourceId` fields are sent to the private-preview JAR Vercel API, then to two configured external free-tier AI model providers. No Drive account or API key is supplied. Providers may retain prompts under their own terms.

This architecture is intentionally **manual**, not an automated Google Drive sync, background crawling, or learned model weight update. The imported summaries remain `OPERATOR_SELECTED_UNVERIFIED`. The response includes a hash of the normalized input and selected IDs, enabling the browser to verify the material reviewed. An unsigned hash authenticates neither identity nor evidence.

## First corpus lanes

Waseca grocery economics and physical custody; fictional PENNY aid receipts; gathering host kit; volunteer OFFER/NEED/BUILD/QUESTION cards; Coalition three-chair conversation; Garden/Common federation idea; Real Life worship-team conversation as a separately governed music discussion; existing home-dinner possibility; Road music and optional worship gatherings; proposed future PUBLIC HEARING festival; Table & Road artistic deck; accountless online portal; ASK/RETURN field protocol.

Every entry records the *status of the document's claim*, not the actual readiness of a real project. It does not assert a willing steward, organization approval, partner participation, food safety clearance, active fundraiser, church endorsement, festival date, volunteer roster, or real grocery operation. Do not expose third-party contact data.

## Where the evidence comes from

The nine owner-held native Google Docs are selected project planning briefs, working charters, host kits and field cards created 2026-10-23 through 2026-10-25. The private owner-review document has the complete source register and editable notes. The selected snapshot can diverge as Docs evolve; use `stale/needs-review` rather than silently asserting freshness.

## Council flow

JAR's normal public-source inspection stays intact.
The reader imports an explicit, under-14-KB JSON file from their own device.
Client validates a strict 3–15 entry, field-only, contact-free schema; no automatic transmission.
An explicit council click sends the selected short statements to Groq scout and Gemini critic through the existing separate preview API.
Models are told summaries are unverified and can be wrong. No identity, authorization, venue approval, resources, community need or consent can be inferred from source names.
The browser checks the returned unsigned council receipt, all fixed source pins, original JAR return and the exact normalized field pack hash.
All actions remain local drafts or HOLD. No public rollout or automatic sync.

## Demo test

1. Open the newest **protected preview**, ask a grocery/music/church question, and inspect the normal JAR receipt.
2. Use `FIELD WITNESS 001` import to select the owner-held `jarvis_field_witness_001.json` snapshot.
3. Confirm 15 entries and their project lanes are reported as ready **on this page only**.
4. Click `FIND THE MISSING INGREDIENT` once. This sends the selected summaries to two external free-model providers (prompt retention / quotas apply).
5. Verify that the output states 15 **unverified field notes**, identifies one missing real-world particular, preserves Gemini's challenge and never invents the church, grocery or Coalition having agreed.

**Safety:** This is not secure PII de-identification. Mechanical email/phone/URL and obvious key-like patterns are rejected, but a human still must review inputs for private names, congregant records or sensitive details before importing. An untrusted JSON file could contain other private facts not mechanically detected; never load it.

**Release:** The public Abundent inference route stays disabled. Preview requires the existing operator-only protection and JARVIS_COUNCIL_ENABLED flag. Distributed rate limits, authorized identity and privacy reviews are outstanding before any public model calls.
