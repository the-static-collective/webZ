# WANTED-001 — Buyer-first, precommitted demand

**Status:** working, device-local prototype on a feature branch; NOT a live marketplace, NOT deployed, NOT funded. No real buyers, offers, payments, matching, or inventory feeds were imported. The fictional drill card is a rehearsal and is never passed off as demand.

## The question that produced this

A person needs **$20 within two hours**. Conventional options require unknown future buyers, unpaid qualifying labor, or sale of bodily material. The missing primitive is not a better seller listing. It is **existing, visible demand with credible payment commitment**, discoverable by someone who already has the required thing.

> “I have it” should be the end of finding a buyer, not the beginning of finding one.

## How to inspect this bounded slice

Open `wanted/` on a static webZ server. The UI allows you to:
1. Compose and keep a local, unfunded, non-public buyer intent with an exact price and deadline, and copy a plainly labeled, unverified text card.
2. Load a clearly **fictional** $20 buyer request and rehearse `OPEN → HELD → REPORTED → ACCEPTED`.
3. Release a hold, let it expire, or rehearse a refusal and reopening.
4. Refresh and see the local cards restored if the browser permits localStorage.

It deliberately **does not** present any of these actions as a secured sale, actual payment, real inventory, public posting, or cross-device reservation. No third-party scripts, network calls, or form posts are involved. Inputs are rendered with `textContent`, not inserted as HTML. Browser storage is local to the origin and can be erased through browser site-data controls. Limit to general locations and non-sensitive descriptions.

Run `node --test tests/wanted.test.mjs` (also included in the repository's existing `npm test` glob).

## Real marketplace — proposed authority boundary (NOT IMPLEMENTED)

Buyer enters a verified *buy order*: item criteria, maximum committed amount, pickup region, maximum travel, deadline, allowed condition and quantity. The buyer chooses whether it is a single fulfillment or multiple lots.

**Funds gate:** actual payment provider authorizes or captures the buyer's amount server-side. A buyer-supplied checkbox, screenshot, locally generated token, or client `funded: true` is NOT proof of funds. Only provider-verified state, received by authenticated webhook and reconciled on the server, permits the `FUNDS_VERIFIED` label. Authorization can expire, be reversed, or require capture. “Verified authorization” is not the same as irrevocable cash in a seller's account. Never promise same-hour seller payout without actually supporting it. Do not call platform-custodied money “escrow” absent an applicable licensed arrangement.

**Claim gate:** server atomically assigns exactly one eligible claimant to an open, funded order, e.g. a serializable transaction / conditional update with expiry and idempotency key. Seller sees a 10-minute hold only after server acknowledgment. Other finders see `RESERVED` until expiry or cancellation. Seller identity and constraints are checked server-side; client timestamps are not authoritative.

**Possession gate:** before traveling, seller provides a minimally sufficient description/photo or evidence of possession as required for the category. A report is NOT confirmed fulfillment. The buyer may inspect before accepting; offer, report, inspection, refusal, and confirmation are distinct events. Buyers do not get exact home addresses by default.

**Settlement gate:** authorization/capture, refunds, payouts, and chargebacks occur through the payment provider, under documented merchant liability and payout timing. The platform never transmits arbitrary user bank information or stores raw card numbers. A dispute can interrupt payout. Every state gets its own auditable receipt and idempotent replay path.

### Proposed server-side states

```text
DRAFT
  → OPEN_UNFUNDED (never visible in funded feed)
  → FUNDS_VERIFIED_OPEN
  → RESERVED [one seller / TTL / server receipt]
  → ITEM_REPORTED [seller testimony, not buyer confirmation]
  → BUYER_ACCEPTED [inspection/consent]
  → PAYMENT_PROCESSING [provider source of truth]
  → SETTLED [provider-confirmed]
```

Rejection, cancellation, authorization expiry, dispute, timeout, and refund are separately represented. No button skips directly from an unverified seller claim to "sale secured" or "cash paid." A buyer who cannot really fund the purchase cannot advertise a funded order.

### First outside-world test

1. Recruit **one actual buyer who already wants an ordinary permitted item**, with a posted maximum purchase price and explicit deadline, not a fictional buyer or purchased traffic.
2. Confirm ordinary payment methods and safe public handoff terms outside the app; the prototype remains clearly marked `UNFUNDED`.
3. Invite **one independent finder** to try the reverse listing. Measure time to first eligible finder, time to handoff, eventual cash received, and where the deal stalled.
4. Only after an honest field result build the funded-order backend and professional payment integration. Never mistake a code test or local rehearsal for a fulfilled real-world order.

### Constraints for production

- Moderation, prohibited categories, anti-stolen-goods procedures, returns, fraud, KYC/AML as applicable, consumer protection and tax obligations.
- Rate limiting, abuse review, authentication, seller/buyer privacy, anti-bot capture, location coarsening, safe daytime meetup guidance.
- Buyer authorization terms, provider fee economics, payout delays, reversals, refunds, and financial risk; verify live payment-provider contracts before using “secured.”
- Cross-device contention, double spend, repeated requests, stale availability, stale photographs, and backdated event times.
- No fake listings or fabricated demand to solve a cold-start problem. Demand inventory may be zero. The platform must show zero honestly.

### Next technical gate

Choose an authorized backend and payment partner; only then add schema, server-side claim RPC with uniqueness constraint and race tests, webhook verification, payout reconciliation, and real mobile two-account tests. Existing reLATTE/Jubilee crossing concepts may supply portable receipts, but this project must not inherit authority from names or documentation.

**Boundaries:** candidate feature ≠ merged code ≠ deployed web app ≠ funded buyer ≠ secured reservation ≠ real sale ≠ cash received.
