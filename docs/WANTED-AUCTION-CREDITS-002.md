# WANTED-002 — Auction Credits / Reverse eBay

**State:** Experimental browser-local lab on `feature/wanted-demand-first-001`. **Not** a real market, proof of buyer demand, money, payment service, escrow, licensed stored value, or proof of fulfillment.

A person said: *“reverse eBay, like auction credits somehow.”* This branch makes the unfinished thought playable without prematurely deciding what “credits” must mean.

## What is being inverted?

An eBay-style forward auction has a seller's one thing and many buyers trying to acquire it. A conventional reverse auction has a buyer's request and multiple sellers bidding downward. The U.S. FAR and USPS acquisition guidance describe the latter as an established procurement mechanism: it is not new by itself.

Our **proposed distinctive combination** is a time-bounded **demand-first field market** where buyer intent is visible **before** someone searches an attic/garage for supply, optional scout/supplier participation is budgeted explicitly, and the buyer's selection is not mechanically awarded to the lowest bid.

The four small signals are deliberately different:

1. `WANT` — what somebody needs, how soon, and the ceiling they might pay.
2. `CREDIT` — a committed capacity to buy, *only after an external payment rail really verifies it*. In the lab, all credits are imaginary.
3. `POKE` — “I might have it.” No exclusive rights or actual possession proof.
4. `OFFER` — “I can provide it at this price, by this time.” Unverified until inspected. Buyer chooses; quotation is not a completed sale.

Do not blur `POKE ≠ CLAIM ≠ SELECTED ≠ DELIVERED ≠ PAID`.

## Three candidate experiments

### A. FLASH BOUNTY: a fixed price, speed matters

A buyer credibly commits up to $20 for a working drill needed within two hours. Finders see that *demand*, not an empty listing. No bidding down required: the first supplier who can actually meet the terms may get the full quoted amount. Scarcity and speed may be more important than pennies saved.

**Failure to avoid:** a distressed person needing $20 should not be forced into a reverse bidding race that drives what they earn toward zero.

### B. REVERSE QUOTES: sellers compete, buyer chooses

Multiple sellers can quote below the ceiling. For example, one offers to supply in ten minutes for 18 units while another offers 90 minutes for 14 units. A buyer can choose the fast one even though it costs more. A selection is reversible until a separately authorized transaction actually commits.

**Failure to avoid:** the lowest quote may be poor quality or too slow. Do not silently award the cheapest offer.

### C. AUCTION CREDITS: budget can be distributed across contributors

Suppose a fictional buyer allocates **20 demo credits** to one want:

```text
20 imaginary credits allocated to buyer's wanted drill
   ├─ 2 imaginary credits reserved for scout, if there is one
   └─ 18 imaginary credits maximum offered to supplier
```

If supplier bids 15 and the scout share is 2, **only 17** fictional units are consumed on a *simulated confirmation*, and **3** return to the demo wallet. Before simulated confirmation, the full cap remains reserved. No credit is minted by splitting the reward; finder plus supplier cannot exceed the buyer ceiling.

The lab starts with **60 imaginary credits**, 20 allocated, and 40 unallocated. The viewer can boost a bounty, change the scout share, poke, submit fictional supplier quotes, select an offer, reopen, confirm, cancel and reset. Each action records a local event. `localStorage` is optional, origin-scoped and not authoritative.

**Never call these points redeemable, paid, earned dollars, available bank money, settled funds or an actual financial obligation.** In this prototype they are play counters with **zero cash value**.

## Other interpretations worth testing later

- **Buyer-side competitive demand:** several buyers independently commit to buy a *quantity* of an item; suppliers see aggregate **units demanded**, without pretending all buyers compete for the same physical item. Each individual order remains independent.
- **Community purchasing pool:** several consenting people contribute to one *shared* asset (a ladder, tool library, community heater). Governance must state who owns, stores, maintains, may access and may recover the asset; contributors do not each get to own it individually.
- **Reciprocal earned work credit:** one person performs a confirmed useful act and earns a transferable community ledger credit. This is a separate economic and legal system, not an automatic feature of an auction. Explore accounting and redemption separately.
- **Trust/participation credit:** verified service reputation, not a currency, never purchasable as bid advantage.
- **Buyer boost:** unallocated budget can move toward a want, making previously unattractive supply offers possible, without creating new purchasing power.

## First test of an actually meaningful $20 pathway

1. Locate one existing real buyer with a specific ordinary, lawful need, price ceiling, and two-hour horizon. Do not fake demand.
2. Locate one person with a plausible item or method, ideally found through the displayed order, rather than an unsolicited listing.
3. Compare `POKE → SEARCH → OFFER → BUYER ACCEPTANCE → SETTLEMENT` timestamps. Count money actually received, not selected bids, pending payouts or survey credits.
4. Identify the bottleneck: real buyer discovery, purchase authorization, finding the item, evaluating condition, handoff, settlement speed or provider rules.
5. Only thereafter wire a provider-backed funds gate, atomic multidevice claims, dispute/refund handling, privacy controls and legitimate payout semantics.

## Payment and auction-credit constraints

An e-money/stored-value wallet, custody of buyer funds, and transferable redeemable credits carry substantial legal, commercial and regulatory issues. The sensible first real version has a **per-order payment authorization handled by a licensed payment provider**, with actual provider confirmation, chargebacks, cancellation, capture expiry, and payout rules. Even that does not guarantee instant settlement or support every auction model. Do not market a provider authorization as irrevocably secured funds.

Claims need a server-side conditional transition and idempotency key, not `localStorage`, and a short lease after proof of availability. The current experiment has **no** real claim lock.

## Reconstructible evidence

- `wanted/auction/model.mjs` — pure credit-budget transition model.
- `wanted/auction/index.html` / `ui.mjs` — phone-first, local-only playground.
- `tests/wanted-auction.test.mjs` — accounting invariants, buyer choice, bad bids, late offers, expiry, and distinction between simulated confirmation and money received.

The local simulation, tests and UI represent an **idea worth field-testing**, not field proof. The source itself remains on a draft pull request pending review and is not deployed.

**Question still open:** Should “auction credits” mean prepaid demand, a finder/supplier allocation mechanism, shared purchasing power, earned reciprocity, or some novel combination? Preserve all four hypotheses until real users supply evidence.
