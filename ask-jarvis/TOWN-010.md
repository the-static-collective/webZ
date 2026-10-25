# TOWN-010 — The Waseca Town Desk / Free Graph seed-to-review loop

**Location:** `/town/` inside the existing Ask JAR;VIS/Abundent website; **release stage: protected preview, not yet production**. This is independently operated by Static Collective. There is no claimed affiliation with the City of Waseca, Coalition of Care, community-grocery organizers, churches, local businesses or parks.

## What a flyer visitor can do without an account

1. Browse eight **editorial hypothetical** options and their source-attributed connections, on an entirely static no-model page. No personal data or visitor identity is required. The 8 possible paths are grocery access, surplus produce, neighborhood tables, volunteering, arts, stewardship, neighbor repairs and transportation obstacles. None is advertised as an actually available service.
2. Choose an option, see one bounded first-test proposal and related options. Open a **question-only** link back to deterministic JAR;VIS, or move into an optional native/Nemotron investigation (only in its protected Preview).
3. Submit **one optional public-safe need/offer/question/idea** into a strictly **private human-review inbox**. The Edge function generates a private, one-time withdrawal key. It does not sign the person up, reply to them, contact partners, or publish what they wrote. No phone, name or email requested here. The separate contact page remains available for consented follow-up.
4. If the inbox is unavailable, **save a local draft**; the seed graph and question links remain independently browsable.

## Real Free Graph packet, not an invented social graph

`town/catalog.json` is editorial source. `scripts/build-town-graph.mjs` converts that exact file to canonical `free-graph.packet/v0` with a source digest, source/node/link content-addressing and an overall packet ID. It creates an unresolved Task World Cut. Only portable `connects` edges with status `proposed` and authority `none` occur. No `constitutes`, `bears-on`, locally adopted outcome, organization partnership or real-world witness is synthesized.

The packet is emitted as `public/town/graph.json` **at build time**. GitHub Action `abundent-town-freegraph.yml` pins the Free Graph owner source at commit `ec0ad8743c5faac3f3675760bbafcbcb1df846c1` and executes the owner's actual Python packet validator and digest command against our generated packet. Vercel's build emits it as a static file.

## Where incoming public ideas go (not automatically to Free Graph)

Existing active **Supabase** project `pantry-gate` has a new, separate pair of RLS-protected tables: `town_ideas` and `town_quotas`, and an isolated Edge function `town-intake`. Direct anon/authenticated Data API access is revoked. The function checks allowed origins and exact small input shape, rejects contact URLs, emails, phone numbers and obvious street-address formats, caps body length at 260 characters, enforces an opt-in review checkbox and atomic quotas, and saves **PENDING** rows for owner review. Private hashed withdrawal tokens enable deletion. It does not read other apps' sensitive content, auto-publish, contact third parties or call models.

**Human moderation is a hard separate gate.** An administrator first reviews a pending record in Supabase Dashboard, removes dangerous or identifying material, checks for duplicate / fictional claims, asks permission for anything attributable, and then intentionally edits `town/catalog.json` or emits a separate owner-attested packet in a reviewed PR. The raw free-text database is **not** a Free Graph packet, an automatic public feed, or consent to process private information further. A later product version can add richer moderation and community export tools. There is no automatic reconciliation job yet.

**Daily durability qualification:** The Free Graph town map is static CDN-hosted and requires no database at all to browse. The free Supabase queue **may pause after approximately seven days of insufficient activity**. The public form must show a clear queue-unavailable fallback, never falsely say an entry was received. Vercel Hobby is also subject to noncommercial-use restrictions and finite compute budgets; do not assume a production marketplace or unlimited workload is free.

## Peak-day and quiet-day budgets

- Static `/town/` and `/town/graph.json`: no LLM, no dedicated warm server, no DB query per visitor. 200 browser visits in one day are negligible relative to typical CDN request allotments, provided site hosting stays within plan terms.
- Optional proposal intake: one HTTPS POST per submitted idea; server-side limits of 18 per hashed IP/day, 240 submissions globally/hour and 1,100 globally/day. At 200 *total browsing inquiries*, normal traffic should fit, but a shared network or hostile bursts can hit gates.
- Each anonymous submission is PENDING; 0 submissions on a quiet day causes no function invocations beyond visits.
- Public JAR deterministic questions still read up to three pinned GitHub source documents per request; 200/day means up to 600 upstream reads **if all questions actually use JAR**. Future load tests should verify caching, upstream health and fallback.
- Native Python owner kernels and NVIDIA trial AI are **NOT** called automatically, do not have public-production licensing/quotas and must remain behind preview/operator choice.
- Manual moderation labor, security, privacy, rollback and host domain routing remain deployment gates. A review queue of 200 entries/day is an operational workload, not a solved AI problem.

## Public flyer readiness checklist (before printing)

- `https://abundent.org/town/` must return a public HTTP 200 **without Vercel Authentication** and resolve via the actually active production domain. A preview URL alone does not establish that.
- Test a mobile visit, a normal preview question, a safe optional submission (with deletion), a malformed input, and a Simulated outage fallback.
- Confirm moderation access and daily review availability; publish a clear independent/nonofficial disclaimer and emergency/urgent help exclusion.
- Keep native trial inference private; retain static fallback even if Supabase pauses.
- Publish the source packet on reviewed production commit and rehearse rollback. Do not flypost services that do not exist.
