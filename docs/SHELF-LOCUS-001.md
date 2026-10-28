# SHELF-LOCUS-001 — The Missing Handoff
**2026-10-28 | Documented local pressure, unconfirmed coordination gap, no partner and no field pilot.**

## The need we found
A genuine **resource-availability versus resource-reception** problem has public documentation in Waseca:

1. [WANSC GiveMN statement](https://www.givemn.org/organization/Waseca-Neighborhood-Service-Center) reports rising food assistance and strain from reduced-price food supply shortages, forcing more costly wholesale/retail sourcing. These are organization-reported pressures, **not live inventory numbers**.
2. [July 23, 2026 Waseca County Pioneer](https://www.wasecacountypioneer.com/news/food-shelf-welcomes-donations-gardens) reports 680 households and 20,000+ pounds of food support in June 2026; director Cindy Kolander welcomed garden produce and thought volunteers might help harvest. She emphasized that **cash gifts can buy significantly more through bulk purchasing**. Do not assume that a donation pickup is always better than a cash gift.
3. [October 22, 2026 Waseca County Pioneer](https://wasecacountypioneer.com/news/community-invited-learn-about-grocery-co-op) says the Waseca Area Food Cooperative was legally authorized in May; collaborators had already discussed an MSU supply-chain syllabus with **five tasks**, including local produce sourcing, voucher process design and **food rescue logistics**. This is existing local work. Do not duplicate it or claim it as our project.
4. [University of Minnesota SROC, September 9, 2025](https://cfans.umn.edu/news/harvest-research-generosity) reports a surplus-donation precedent from 2025. Not proof of current crops or current offered inventory.
5. [UMN Extension Rural Grocery](https://extension.umn.edu/food/selling-and-distributing/rural-grocery-stores) already has farm-to-grocery legality, labeling, handling and supply-chain guidance; we should reuse it.

**Testable hypothesis:** A receiver-governed, safe, transparent, low-overhead single-item handoff could sometimes help bridge an actual recurring sourcing, receiving or volunteer pickup bottleneck. WANSC has **not** told us this specific tool is needed. The co-op and MSU may already be solving adjacent pieces. We must ask before attempting integration.

## Smallest test
**Question first:** “What single part of accepting appropriate food supplies or coordinating volunteer pickups would you most like to make easier, if any?”

If an authorized local steward actually identifies an unmet step:
- The receiver defines appropriate item categories, quantity and hours privately; applicable food handling safety and compliance come first.
- A willing provider independently offers a suitable item and separately authorizes any publicity about that offer.
- A separate carrier independently chooses a bounded, permitted move. Carrier interest is not permission to transport.
- The actor separately reports what occurred (or failed). Receiver confirmation is a separate step; no third-party data may be exported.
- A locally approved, public-safe and source-pinned method is shared only with all required permissions.

**One-cycle measurement** (after permission): approved offers, time per handoff, refusal/expiry rate, actual independently verified useful units (if receiver agrees to count them), volunteer/staff effort, and safe handling failures. **Zero actual field results now.** This October is late harvest season; the first useful category may instead be shelf-stable goods, and only the receiving organization can judge it.

## Browser prototype
`bridge/locus/index.html` is a static reference. `model.mjs` has a tiny deterministic **fictional** state machine. `START -> HOLD/REFUSE/REVIEW -> CARRIER -> AUTHORIZE -> REPORT -> CHECK` preserves the essential boundaries. No browser state change sets `recipientAgreement`, `fieldAction` or `realVerified` to true. Every downloaded packet says `SYNTHETIC_LOCAL_ONLY` and `externalDelivery:NOT_SENT`.

This is a proof of **an explicitly reviewable proposal/decision sequence**, not a functioning food distribution solution. MIT Solve's Nov 6 Climate Challenge generally does not review concept-only solutions; do not claim this mock supplies a functioning logistics service or verified pilot.

## Why this is a fractal locus
- **Waseca food shelf**: a real publicly expressed sourcing pressure, but no permission or current inventory.
- **Waseca co-op and MSU**: existing sourcing/rescue/voucher learning; we should complement it if welcomed.
- **UMN Extension**: a mature practice source for legal and physical handling.
- **JAR;VIS + planZ**: proposal reasoning and blocked human gates, not automated outreach.
- **GHoT + LOADOUT**: optional offline, authorized analytical or print-render work, not autonomous driving, pickups or food-safety decisions.
- **CANNON + Free Graph + GRAFT**: exact source selected, linked evidence and a portable reproduction kit.
- **reLATTE**: prospective signed local-owner-to-local-owner request transport after actual authority exists.
- **Static Live / lemonPRESS / GrO**: a consented event can invite participants or produce print materials; no invented audience.
- **Rochester / Code for America / MIT Solve Climate / BLOOM / Institute of Global Homelessness / DPGA / Cities Deliver**: each can be approached with a *different bounded request* and separate eligibility; none is a partner.

## Human outreach drafts — NOT SENT
- WANSC office director contact published at https://www.wasecaareaneighborhoodservicecenter.com/about-us: `director@wasecaservicecenter.org`. Contact hours and phone extensions must be reconfirmed.
- For Waseca co-op and MSU, find the *actual lead* and ask what they are already working on before contacting; public reporting identifies people but does not confer authority.
- Draft introductions are exported via `model.mjs` and copied locally only. No actual message, donation, delivery, integration or grant submission has been made by this project.

**No field data, confidential addresses, household records, or sensitive materials may enter this public source.**

**Invariants:** `NEED != PERMISSION`; `OFFER != SUITABLE`; `REVIEW != AUTHORIZE`; `REPORT != VERIFICATION`; `SIMULATED != OCCURRED`; `MAIN != CANON`.
