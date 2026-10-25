# DISCOVERY-011 — JAR;VIS Living Context Engine (bounded vertical slice)

**Status:** protected-preview integration candidate, operator-enabled only; does **not** change Abundent production or replace the original deterministic JAR. All external search is visitor-triggered. **No general autonomous web crawling**, public AI launch, partner communication, or automatic truth promotion is implemented.

## The three layers

**North Star (operator-authored):** `context/mission-v1.json` expresses Abundent's purpose, workstreams, known experiments and constitutional gates. This is intentionally compact; it is **a compass, not an advertising script**. It has a version, change-controlled repository history, and public project source references. The goals do not grant ownership of any partner, volunteer or resource.

**Library (reviewed public source references):** The existing owner-pinned public project reads remain part of regular JAR. A separate source nursery has a private `town_research_candidates` table (Supabase `pantry-gate` project) storing public search **snippets only**, a source link, a categorical editorial relation and `PENDING` status. Questions and visitors' identity are not stored in the research table. A reviewer must check the original source and explicitly set `status='REVIEWED'`, `review_status='SOURCE_LINK_CHECKED'`, `source_reviewed_at`, and `expires_at` before it can enter the publicly readable reviewed-context response. Reviewed links are still dated snapshots, not live service availability or partner permission. No such record has been approved or assumed.

**Free Graph (possible connections):** `town/catalog.json` already compiles to a native-validated, content-addressed `free-graph.packet/v0`. DISCOVERY-011 performs ephemeral question-to-seed relevance ranking and proposes links to external search results. These ephemeral relations have authority **none** and status **proposed**, and never modify that packet or turn a search snippet into evidence of real-world activity.

## Question loop

1. **Orient:** Load `mission-v1.json` and the eight curated `catalog.json` entries. Rank workstreams and existing ideas using deterministic lexical overlap. If unrelated, say independent rather than cross-selling a project.
2. **Remember:** Read only `REVIEWED` source references from the public filtered `discovery-memory` edge endpoint, label review date, and return only those relevant to this question. If none have been reviewed, show none, rather than invented recall.
3. **Search:** Only after visitor explicitly presses **DISCOVER PUBLIC SOURCES** on their own JAR result, `/api/discover` sends the question to exactly one known search API. If `BRAVE_SEARCH_API_KEY` is set server-side, use Brave Web Search. Without it, use Wikimedia's official `en.wikipedia.org/w/rest.php/v1/search/page` API, which is appropriate for encyclopedic background but **not** live local businesses.
4. **Local HOLD:** For nearby businesses, open-now, repair, food-shelf hours, etc., when general web search is not configured, return `HOLD_LOCAL_LOOKUP_NOT_CONFIGURED`. Never supply invented hours or locations. The existing independently sourced Town Desk food-shelf resource remains separate from this API.
5. **Weave:** Form bounded hypothetical relations without elevating source snippets into verified facts; show primary clickable source URLs and uncertainty. **No external result is fetched from the search URL or executed**; only trusted fixed API endpoints are queried.
6. **Nominate:** A person can optionally send the **first public source snippet** to the private `discovery-memory` moderation queue. This never submits the raw visitor question; the visitor's action is explicit and the response is a `PENDING_PRIVATE_SOURCE_REVIEW` receipt. This is not public memory until a reviewer independently verifies the source.
7. **Return:** Hash the complete research receipt locally (unsigned). The original question/response, free-graph seed graph, and other experiments remain independently usable if search or the private queue is down.

## Scale and controls

- `JARVIS_DISCOVERY_ENABLED=1` **and** `VERCEL_ENV=preview` are required for external research; production returns HOLD. A future public release requires deliberate policy review, domain routing and hard global rate ceilings.
- No NVIDIA trial/model tokens are used in DISCOVERY-011. The existing VIS/Nemotron preview remains a separate opt-in, developer-only model function.
- Each request fetches **up to 4 search snippets**, at most **one** fixed external search endpoint and **one** small reviewed-link query, with bounded request/response bytes and short timeouts.
- Serverless instance-local cache avoids some repeated queries for 10 minutes; **it is not a shared cache or enforceable global quota**. No guarantees of service freshness or accuracy beyond source links.
- Reviewed context is limited to up to 3 query-relevant links drawn from the most recent 15 human-reviewed eligible entries. A reviewer has to retire expired or inaccurate entries.
- Supabase candidate intake enforces approximate per-IP four nominations/day and 100 global nominations/day using existing atomic `town_consume_quota` RPC. No rows read by anon/authenticated Data API; only Edge Function's service role can access the underlying RLS-protected table.
- At 0 requests, no search calls or model tokens; at 200 requests in a single day, naive deployment might still perform 200 search calls, which could incur cost or API rate limits. **Do not enable unrestricted public research just because tests pass.**
- Do not imply that a document, relationship, search snippet or approved resource listing authorizes a real-world action. Use native LOADOUT/human gates before actions.
- Privacy: no raw visitor questions stored in cross-visitor memory; still, the query is sent to the selected external search provider after explicit user action. No passwords, email addresses, phone numbers or other sensitive personal information should be queried.

## Operator review process

Inspect `town_research_candidates` via private Supabase Dashboard. Discard malicious, identifying, stale or irrelevant entries; open the source URL manually and assess date, legitimacy and suitability; add an explicit review disposition and expiry only when appropriate. NEVER bulk-approve candidates merely because multiple visitors nominated the same result. `REVIEWED` denotes **source-link review**, not locally verified food access or partner consent. Independently approved project/municipal claims belong in project-owned sources, not this public-search nursery.

## Readiness gates

1. Node tests: `node --test test/discovery.test.mjs`; syntax checks in `ask-jarvis.yml`. Verify no credential is included in client bundles.
2. Separate Supabase Edge `discovery-memory` active, table RLS enforced, no anon/auth Data API access, and non-reviewed results not returned in public read.
3. Protected Vercel Preview deployment with `JARVIS_DISCOVERY_ENABLED=1` and real request to Wikimedia official endpoint; verify search timeout and invalid-question HOLD.
4. Verify preview response UI including links, source citations and opt-in private candidate nomination. Then inspect pending database record for source only (no question), decline synthetic test record before public use.
5. Public release demands global search quota/budget, local resource verification and explicit provider/license policies; Vercel Hobby's use restrictions still apply. `abundent.org` production is on a different Vercel project from this preview.

**Native source contract:** This adds a bounded lookup layer beside JAR's verified source-first model; it does not claim ALEX/3rdi/LOADOUT or GRAFT native runtimes were invoked on a discovery request, and it does not modify their repositories.
