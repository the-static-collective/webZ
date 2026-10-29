# FIRST-INCH-002 — The Six-Up Deterministic Planning Ecology

**Status:** review-only branch stacked on FIRST-INCH-001. This is an independent planning kernel built in webZ, not an import, fork, product release or source execution of Dogram, Haunted Toaster or Wolfram.

## Human-facing rule

Keep the first screen **one question**. A visitor who is interested can expand an *optional* planning lab. They see six distinct possible directions and may KEEP one exact draft, SCRAPE the complete family, or export an inert Dogram ablation specimen. No user has to learn graphs or internal architecture.

> The system owns possible drafts; the person owns continuation. This is inspired by Haunted Toaster's six-up, KEEP/SCRAPE and source-controlled candidate discipline. No claim that the Toaster itself generated or approved these candidates.

## Bounded source-inspired machinery

The public 9-node directed acyclic graph is declared in `start/plan-ecology.mjs`.

| Node | Prerequisites (AND) | Synthetic effort points | Independent human gate |
| --- | --- | ---: | --- |
| goal | — | 0 | — |
| question | goal | 1 | — |
| inventory | goal | 2 | — |
| draft | inventory | 3 | — |
| request | question | 2 | — |
| approval | request | 0 | real steward permission |
| trial | draft AND approval | 4 | via approval |
| outcome | trial | 0 | observed/independently checked event |
| review | outcome | 2 | via outcome |

Six candidate targets: question, inventory, draft, request, trial, review. The engine forms each target's transitive **AND-dependency closure**, sums the costs of distinct steps once (not path lengths), and reports both declared-budget results and unfulfilled human gates. **All values are invented abstract comparison points, not prices, durations or feasibility estimates**. With a budget of 8, their declared totals are **1, 2, 5, 3, 12, 14**. The first four are inside the synthetic budget. Trial and review remain HOLD regardless of budget because graph reachability is not consent or a real-world witness.

The engine compares candidate closure sets on two *separate* axes: lower effort points and inclusion of other steps. It returns a non-dominated Pareto frontier without combining the two into a fabricated numerical utility. For these six targets, all six remain incomparable: cheaper question and inventory paths have less scope, while more expensive alternatives have different steps or gates. The UI does not pretend a single 'best' plan.

Each candidate has three prewritten, accurate procedural variants. SCRAPE moves through three unique deterministic indexed alternative families, preserving the supplied text, candidate structural roles and gates. No learning from a rejection, negative preference, network randomness, LLM inference, account or personal memory. KEEP selects a verifiable exact candidate and only changes a local text card. Stale form inputs invalidate the card.

## The Dogram separation

Dogram's public `ablate@1` accepts a graph, one removed node or edge and requested reachability queries. The optional **Save Dogram graph-ablation specimen** emits a well-formed `dogram.specimen/v0` input representing the above graph and removing `approval`, with queries from goal to request, trial, and review. It includes **no visitor goal or resource text**. The visitor can independently inspect/run it in a properly installed Dogram; this browser does **not** execute Dogram. For an operator with the **original clean Dogram checkout** pinned to commit `551b5f9df18f17ec69b452ddcdff01718e0ff771`, the optional `node tools/first-inch-native-dogram.mjs --dogram /path/to/Dogram` invokes its **actual Python `ablate@1`** and cross-checks its reachability reports against the independent JS graph. It refuses mismatched or locally modified source and never runs from the public web app. This operator check has not been claimed as a successful field execution merely because its code was written.

**The critical paradox is deliberate and tested:** removing `approval` can leave a graph-theoretic path `goal → inventory → draft → trial`. But the trial has **AND prerequisites** (`draft` and `approval`). Therefore a surviving path does **not** make the trial possible or authorized. The browser includes a distinct all-prerequisites check, never upgrades a graph result to world proof.

The two applicable source-owning authorities:
- [Dogram's public `ablate` operator](https://github.com/the-static-collective/Dogram/blob/main/dogram/ablate.py) and [specimen envelope](https://github.com/the-static-collective/Dogram/blob/main/examples/mutated_mathals/trust-withdrawal.json).
- [Haunted Toaster's candidate and KEEP/SCRAPE architecture](https://github.com/the-static-collective/the-haunted-toaster/blob/main/README.md). Its current beta reconciliation is explicitly a **draft**, not adopted mainline law.

## Wolfram as optional mathematical countercheck — not the runtime

The Wolfram Language evaluator was actually consulted on a frozen, explicit six-variant specimen. Using subsets for information-coverage inclusion, nonnegative integer costs, and strict Pareto dominance, it returned:

```text
QUESTION 1; INVENTORY 2; DRAFT 5; PERMISSION_REQUEST 3; PILOT 12; REVIEW 14
budget 8: QUESTION, INVENTORY, DRAFT, PERMISSION_REQUEST
non-dominated: all six
human HOLD: PILOT and REVIEW
```

This corroborates the frozen abstract ranking fixture **only**. It does not establish ground-truth practicality, resource availability, model competence, app performance, source execution by Wolfram, or real participant consent. Wolfram is an optional independent oracle for future mathematical specimens, not a dependency or API called by the public browser. See [Wolfram graph methods](https://reference.wolfram.com/language/guide/GraphProgramming) and [Wolfram optimization](https://reference.wolfram.com/language/guide/Optimization).

## Developer and stranger checks

```sh
node --test tests/first-inch-ecology.test.mjs
node --test tests/first-inch.test.mjs
npm test
python tests/first-inch_browser.py
```

The mobile Chromium witness tests visible six-up, a HELD trial KEEP, SCRAPE regeneration, Dogram JSON download, budget changes, no external network, and no local/browser storage. The existing FIRST-INCH-001 test still checks the ordinary single-goal user flow.

## Still deliberately absent

- Real resource/skill matching; truthful interpretation of an arbitrary goal by a language model.
- Authenticating a participant or stewards; collecting their consent through a UI toggle.
- Real constraint optimization with verified time/money/stock, real safety checks, or physical proof.
- End-to-end unattended Dogram runtime execution or Toaster code integration (only an **explicit operator-run, source-pinned native Dogram checker** is provided).
- JAR;VIS/CANNON planner handoff, public deployment, new partner claims and field outcomes.

**Next proper crossing:** optional frozen proposal → JAR;VIS candidate only after a human opt-in, reviewed source contract, and explicit HOLD; native Dogram on a separately pinned test runner; use Wolfram to cross-check expanded quantitative constraints once actual dimensions and measurements exist.

**Never allow:** possibility → commitment; graph path → executable plan; planned witness → witnessed occurrence; local KEEP → outside consent.
