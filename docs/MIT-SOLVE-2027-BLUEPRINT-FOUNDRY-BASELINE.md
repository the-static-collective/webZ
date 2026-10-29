# MIT SOLVE 2027 — LIVING SUITCASE / BLUEPRINT FOUNDRY

**Working presentation baseline · 2026-10-29 · Candidate 002 · DRAFT, NOT SUBMITTED**

**Primary challenge:** MIT Solve [2027 Global Economic Prosperity Challenge](https://solve.mit.edu/challenges/2027-global-economic-prosperity-challenge). It requires a working solution prototype rather than a concept alone. This document is an *evolving introduction* to the project, not a declaration that the integrated product exists or that external organizations have joined it.

## Front door

> **A finished object is one useful thing. A tested blueprint gives another community the possibility of making one of its own.**

**LIVING SUITCASE — The Blueprint Foundry**

A portable, community-owned kit for turning available materials, skills and infrastructure into independently usable capabilities—and preserving verified build methods so another community can reproduce them. The vision combines material accounting, consent-based work, source-addressed build evidence, witnessed functionality and offline-capable computers. Our first candidate object is the Suitcase itself: a functioning local computer/router/phone node built from reclaimed equipment.

**Economic problem:** Limited-cash communities often possess usable equipment, space, materials and skills but lack a low-cost, trustworthy method to discover what is compatible, coordinate work, prove that a particular construction works, and repeat the result elsewhere without purchasing a proprietary system. We do **not** yet have measured evidence of savings, income creation or beneficiary improvement; the first pilot must compare these outcomes with ordinary manual coordination.

**Scope discipline:** The immediate technological experiment is a *source-addressed, inspectable build packet and repeatability protocol* for a small local computer node. Wider material transformation, a marketplace, open-hardware federation, organizations and humanitarian distribution are plausible adjacent futures, not part of the currently demonstrated integrated product.

**Explicit boundary:** No real cross-node build reproduction has been demonstrated yet. No new cryptocurrency is required; possible NFT or public-chain attestations are optional, externally reviewed features rather than a premise of this proposal.

## The visual five-move story

```text
  01  CLAIM / NOTICE
      Someone has a reclaimed computer, phone, router and safe power supply
        ↓
  02  COMPOSE / AUTHORIZE
      Blueprint lists constraints, BOM, roles, missing parts, permission gates
        ↓
  03  BUILD / WITNESS
      A human assembles; independent function checks return bounded evidence
        ↓
  04  LEARN / BLUEPRINT
      Working build → candidate recipe → independent second-build reproduction
        ↓
  05  HAND OFF / REPRODUCE
      Another independent community receives method, sources, tests,
      failure notes and may build a new node without surrendering authority
        ↺
```

The feedback loop is **not autonomous replication**. Real materials, skilled people, permission, money for unmet costs, electricity and legal compliance remain necessary. Evidence of one working device is not evidence that the blueprint is reproducible.

## Where the architecture meets

| Component | Particular responsibility | Evidence / limit |
| --- | --- | --- |
| Mattercraft | A typed, conserved material/resource candidate and transformation history | GrO [MATTERCRAFT-001 draft](https://github.com/the-static-collective/GrO/pull/32) only projects fictional 42 WOOD, disputed observation, and inert wood→ash preview. No issued real inventory. |
| GrO | Encounter local, deliberately published opportunities | Existing [GrO](https://github.com/the-static-collective/GrO) FORAGE/GLEAN/field model; observation is not collection permission. |
| Full Measure | Participation/quest and separate human-witnessed deed/history | [Full Measure World Layer](https://github.com/the-static-collective/full-measure-world-layer); a build report is not a Deed. |
| PENNY / Jubilee Treasury | Typed owner-local inventory, commitments, physical custody and obligations | [Jubilee Treasury](https://github.com/the-static-collective/Jubilee-treasury) has independent synthetic specimens; no live tokens, bank or site treasury. |
| JAR;VIS / planZ | Propose compatible parts, missing prerequisites, work plan | [JAR;VIS](https://github.com/the-static-collective/JAR-VIS); software does not select owners or authorize physical assembly. |
| GHoT + STATIC OS | Real computation/hardware candidates and mission-first local computer operating environment | [STATIC OS Suitcase PR #91](https://github.com/the-static-collective/static-os/pull/91) has tested read-only composition + inert LAN server; physical ISO boot and user hardware unverified. |
| TranchNode / Project0 / Corpus OS | Versioned source, provenance, constituted local admission and refused authority | [STATIC-NODE-001](https://github.com/the-static-collective/tranchnode/pull/73) is a separate verified-child build experiment, not a physical hardware build certification. |
| GRAFT | Candidate reusable patterns, blueprint descent and lineage | New physical blueprint promotion/compatibility contract **not implemented**. |
| reLATTE / Suitcase | Independent receiving organization accepts/refuses a signed crossing | [reLATTE](https://github.com/the-static-collective/reLATTE); no live blueprint federation or deployed encrypted transport. |
| TABLELIGHT / Voqal complement | Real willing stewards, consent, useful-work evaluation | No assumed church, university, NGO, Voqal, food-coop or MIT sponsorship. Voqal social assistance and MIT technical evaluation may complement one another but have independent governance and applications. |

## The blueprint contract (proposed, not yet encoded)

**Build recipe** includes: canonical blueprint ID and version; functional objective; bill of materials with accepted substitutions and incompatibilities; exact OS/software source versions, checksums and licenses; safe assembly instructions; power/electrical constraints; data-wipe and backup rules; operator authorization; required functional tests; accessible alternative procedures; and recovery/maintenance instructions.

**Build receipt** describes **one particular object**, a versioned blueprint candidate, observed parts, actual deviations, who attests to what, original measurements/files and hashes, test environment and timestamp, failures, unresolved dependencies, and local reviewer decisions.

**Promotion ladder:**

1. **PROPOSED RECIPE** — unbuilt, no function claim.
2. **WORKING BUILD** — one device passed named tests with retained evidence. Only those functions are supported.
3. **BLUEPRINT CANDIDATE** — tested build plus sufficiently complete, lawful, safe recipe.
4. **INDEPENDENTLY REPRODUCED** — another operator uses the pinned recipe or documents explicit substitutions; the second artifact passes the required tests under disclosed conditions.
5. **FIELD-SUITABLE FOR A GIVEN CONTEXT** — qualified safety, privacy, maintenance, operator accessibility and cost gates reviewed separately. Not a universal certification.

A blueprint never grants title, manufacturing permission under third-party patents, professional credentials, electrical safety approval, humanitarian authority, guaranteed income, or an automatic royalty. Contribution history is distinguishable from IP/contractual economic rights. Public blockchains/NFTs are **optional external attestations via the Belt**, not the internal economic constitution and not a deployment requirement.

**Conservation rule:** 42 claimed wood pieces remain only a declared resource until steward admission and appropriate evidence. Transforming four pieces creates a new *candidate* ash/heat lineage with unknown quantities; old wood cannot be spent again after an actual, authorized retirement. One successful build never manufactures missing physical parts or duplicates inventory.

**Verification rule:** `HASH != PHYSICAL TRUTH`, `SIGNED != INDEPENDENT WITNESS`, `WORKING BUILD != REPRODUCIBLE BLUEPRINT`, `BLUEPRINT != AUTHORIZATION`, `BLUEPRINT DESCENDANT != INHERITED PASS`, `NODE != VERIFIED ECONOMIC OUTCOME`.

## The first MIT demonstration — three levels

**What can be demonstrated now (no false hardware claims):**
- Two separate client-side browser rooms can sign and examine fictional offers/responses via the existing [Suitcase demo](https://github.com/the-static-collective/webZ/tree/main/bridge/suitcase). It does not verify real identities.
- The read-only STATIC OS [mission composer](https://github.com/the-static-collective/static-os/pull/91) generates **HOLD-only** proposed configurations, not OS installs.
- The GrO [Mattercraft specimen](https://github.com/the-static-collective/GrO/pull/32) takes **42 claimed WOOD / 39 candidate observed** and correctly refuses to treat a disputed count or one banana proposal as spendable inventory/payment.
- Separate TranchNode software-source experiments demonstrate descendant build and proof continuity; this is not yet physical blueprint certification.

**Next field demonstration (not performed):** Collect two user-owned expendable computers/phones/router, document actual working condition, boot an official safe live Linux environment, demonstrate local network without internet and cold reboot, write and verify an exact blueprint candidate describing the known-good configuration. No soldering or mains/battery modification required in this trial.

**Decisive independent replication (not performed):** A second independent operator receives only the blueprint packet, constructs another node from available compatible equipment, performs fresh tests, retains unedited evidence, and can REFUSE the upstream governance, publicity and any other resource invitation. No automatic organization founding, financial issuance or personal data disclosure.

## One-minute introduction for a reviewer (proposed voice, user must rewrite)

A community can own working computers, tools and skilled people and still be unable to turn them into lasting infrastructure. Our idea is the **Living Suitcase**: a small, locally operated computer and founding kit that helps people describe their real resources, coordinate permitted work, test what they build, and carry the instructions to someone else. When the first Suitcase functions, that gives us evidence of one particular build. A reproducible **blueprint** is earned only when the design, parts, tests and limitations are documented and another independent operator can make it work. Existing parts of the system already support browser-side signed coordination and read-only hardware composition. The physical end-to-end blueprint loop is the next experiment, not an achieved result. We want to learn whether communities can convert reclaimed equipment and shared know-how into useful local infrastructure at lower cost and with stronger independence.

## Evaluation and economic claim

**Primary testable outcome:** for a named rural volunteer organization, a second independently operated local communications/computing node is built from a documented recipe and passes **the same explicitly declared offline functionality tests**, with measured build cost, labor minutes, time-to-working, required purchases, failure/repair rate and accessibility. Compare with buying a prepared computer or repeating a manual setup without the blueprint.

**Secondary, only after first gate:** a permissioned, real resource handoff whose cost and completion are independently reviewed. Separate successful source-code tests, assembled hardware, independent reproduction, organization adoption, economic impact, and actual human benefit.

Do not claim generated jobs, solved homelessness, operating relief distribution, verified savings, token appreciation, or environmental benefits until measured. The absence of a public chain or a central identity does not solve legal ownership, physical fraud, global double-spending, safeguarding or liability.

## Candidate slides / presentation pacing

1. **A finished thing / A reproducible possibility** — a suitcase, two phones and ordinary reclaimed computers.
2. **Economic constraint** — useful parts/skills exist, yet the knowledge to combine and maintain them is fragmented.
3. **The crafting loop** — resources → agreements → built node → function tests → evidence → blueprint.
4. **The living world** — GrO encounter + Full Measure task + PENNY accounting; 42 wood is the bounded analogy.
5. **The hard distinction** — one device works ≠ recipe works for someone else.
6. **Institutional network** — churches, universities, cooperatives, NGOs only as willing, independently responsible nodes; no implied affiliations.
7. **What actually runs** — browser Suitcase, STATIC OS HOLD planner, GrO HOLD encounter, separate provenance prototypes.
8. **First reproducibility trial** — one cheap local node, independent second build, receipts and failures.
9. **Measures of success** — real time, purchases, support burden, function success, accessibility, reproducibility.
10. **Ask MIT** — technical rigor, research collaborators, physical test instrumentation, safety evaluation, evaluation design and pilot introductions with consent.

## Specific unresolved proof and application gates

- [ ] Record the user's actual available equipment and independently observed capabilities; current physical tests are **not yet verified**.
- [ ] Decide whether the existing **narrow solution** currently meets MIT's **Prototype** threshold. The physical Foundry may still be **Concept** and ineligible alone; do not mask this with unrelated working code.
- [ ] Implement and test a machine-readable blueprint and build receipt contract separately from mere project documentation.
- [ ] Complete a real local functional test and independently witnessed second replication.
- [ ] Establish first willing steward and authorized pilot venue; no claimed church/college/NGO partnership.
- [ ] Obtain real economic baseline and participant input; ensure no vulnerable household data appears in public demos.
- [ ] Clarify safe DIY hardware use, licenses, repair and warranties, potentially relevant local permitting.
- [ ] Owner rewrites and approves the MIT application; **no submission has occurred**.

**Application deadline:** November 6, 2026, **12:00 p.m. EST / 11:00 a.m. CST**, as shown by the [official MIT Solve challenge](https://solve.mit.edu/challenges/2027-global-economic-prosperity-challenge); preserve the existing packet's note about inconsistent earlier draft PDF date.

**Current parent packet:** [MIT-SOLVE-2027-LIVING-SUITCASE.md](./MIT-SOLVE-2027-LIVING-SUITCASE.md). **Review doorway:** [webZ branch page](../bridge/mit-solve/index.html). Future versions should revise evidence and presentation, never silently increase claims.
