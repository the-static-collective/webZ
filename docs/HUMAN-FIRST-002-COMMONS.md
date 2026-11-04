# HUMAN FIRST 002 — Porchlight Commons

**Status:** review-stage UX change to the independently published Commons prototype at `/commons/`. No provider, donor, organizer or recipient has been enrolled. No forms submit to a server.

## Why change the entrance?

The Commons page began with organization-level comparison and a full multi-field HOLD worksheet. That remains valuable to a steward, but it is too much to demand of a curious visitor.

The new first screen asks **"What brings you here?"** with four actions: describe a need, offer something through a separate human porch, review a card in the separate Living Receiver, or explore. The user can type one sentence and tap a category. The full HOLD-form opens only when the person chooses to continue.

**Fictional one-tap mode** populates an explicitly invented region, need and quantity, then triggers the existing local validation to produce an unsigned HOLD card. It never fabricates reviews, costs, permissions, provider approvals, dispatch, receipt or money.

## Boundaries

- A sentence is not a request for service; a category is not a verified classification.
- The quick-entry fields and draft packet live in the browser only; no API call, storage or transmission.
- Real drafting still requires a broad region and a real approximate amount. The code does not quietly carry the previously displayed Ghana example into an actual person's draft.
- Every local draft remains `HOLD`, `UNVERIFIED_OPERATOR_DRAFT`, and `dispatch: DISABLED`.
- Offer and receiver are **links into separate tools**; the home page cannot imply that another organization accepts or acts on a proposal.
- No changes to approval policies, recipient validation, comparison math, live inbox capabilities, accounts, domain ownership, or existing receipt formats.

## Tests and acceptance

`node --test tests/commons-entry.test.mjs` checks example safety and navigation structure. `python tests/commons_entry_browser.py` clicks the real 390×844 Chromium flow, generates the fictional card, clears it, starts with one real-world sentence, and verifies no data leaves the page.

Prioritize field observation: can a first-time visitor choose a useful option without an explanation? Does an editor understand why a real quantity and broad region are still needed? Does a demo clearly remain fictional? A successful CI run demonstrates behavior in the test environment, not human comprehension.

**The machine carries the structure. The person encounters one useful next action.**
