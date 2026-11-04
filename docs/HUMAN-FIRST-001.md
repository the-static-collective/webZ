# HUMAN FIRST 001 — Buttons before worksheets

**Status:** unmerged website UX proposal for `webZ`. Inspired by the tested Human Entry 001 button-first rehearsal, this is **not** a claim that volunteers or the public have validated the design.

## Principle

> The machine carries the structure. The person should encounter one useful next action.

- **Buttons > worksheets:** start with a small set of honest actions, not a taxonomy of projects.
- **Conversation typing > worksheets:** one optional plain-language prompt can offer a route without requiring fields.
- **Participation > configuration:** no setup to explore; private or authoritative acts still require deliberate confirmation.
- **Refusal and leaving are valid outcomes:** never equate curiosity, a click, a form draft or an unsigned note with enrollment, consent or a completed act.
- **Progressive disclosure:** the full archive of specialized doors and tracing controls remains available, but not dominant.

## Implementation in this PR

| Entry | Before | After | Boundary |
|---|---|---|---|
| `/` (abundent.org) | Newspaper and 15+ navigation links before a clear first move | Four large action choices, then an optional one-line local intent guide; extensive nav behind `More doors` | Text is not sent or stored; suggestions are links, not work requests |
| `/apps/` (the switchboard source) | World index and 20+ project cards preceded the use case | Five short choice buttons and a short natural-language search feeding existing category/search filters | No automatic contact, subscription or wallet storage |
| Technical archive | Trace controls in expanded default panel | Advanced local trace collapsed by default; every existing control preserved | No authority or signature behavior changed |
| Specialized links | Large downstream link list | Opt-in `Show the specialized doors` detail panel | Existing links and independent project boundaries retained |

External `apps.abundent.org` is a distinct Vercel project; verify it deploys the updated `apps/` source rather than assuming the root webZ project publishes it. `hello.abundent.org` remains a separate project; it is **not edited** by this change.

## Acceptance

Automated Node tests exercise the pure local intent routing and the structural presence of the four homepage actions, five directory filters, search controls, collapsed advanced menus and local-only guarantee. Browser tests remain necessary on narrow screens, keyboard navigation, the live app domain, and macOS Mojave.

Human trial (when consenting people exist): observe whether someone can find one useful direction in 10 seconds, **without explaining our architecture**; allow them to decline and leave; record confusion or failed destinations instead of inventing success. No private personal information or implicit tracking.

## Explicit non-goals

No live production deploy, no automatic AI chat, no form submission, no identity assertion, no remote matching, no user data capture, no merge of sovereign projects, no crypto receipt, no verified volunteer action, no venue authorization, no live promise that a receiving project can fulfill a need.

## Next changes by priority, after field feedback

1. Identify which tasks visitors choose and which public doors are genuinely usable.
2. Apply the same one-question/one-action pattern to the Hello and Garden entries **in their source-owning projects**.
3. Shorten intermediate screens only where navigation or manual testing shows friction.
4. Add an accessible back/undo route before introducing any multi-step data collection.

**Proof hierarchy:** source change ≠ deployed site ≠ browser behavior ≠ user comprehension ≠ consent ≠ verified useful work.
