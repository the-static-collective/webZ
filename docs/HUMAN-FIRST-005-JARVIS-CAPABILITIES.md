# HUMAN FIRST 005 — JAR;VIS should do the useful part first

**Status:** static, rules-based entrance improvement; not a live model, autonomous agent, GitHub crawler, authenticated partner network, or field-tested service.

## The change

A person lands at the public webZ home and sees one question:

> What are you trying to get done today?

Before a project directory, account request or referral, the home page checks a **small, explicitly reviewed list of existing capabilities** from real project-owned code and documentation. If the current browser can actually produce useful work, it does so in place.

```
person's goal
  → privacy/size gate
  → match a reviewed local capability
     ├ NOW: perform the local transformation; render ready-to-use guide/draft
     ├ PARTIAL: provide the useful part + named missing factual/permission gate
     └ HOLD: state that this tool cannot do the requested work, ask one concrete question
  → optional copy
  → optional project-owned source/context
  → only then an independently chosen door into wider coordination
```

The underlying *doable now* library is the already tested `first-circle/work.mjs`. Additional event/music guides and a newsletter skeleton are deliberately local and bounded. Seven current capability IDs are `repair`, `food`, `volunteer`, `offer`, `event`, `music`, and `newsletter`. This catalog is **not** a complete inventory of every GitHub project or current service availability.

## Important distinctions

| Thing the software can do now | Thing it must not infer |
| --- | --- |
| Prepare a recipe | Ingredients, dietary safety or a meal delivered |
| Provide a bounded device check | A diagnosis, a repaired device or a technician |
| Write an offer or volunteer request | A sent invitation, accepted pledge or screened helper |
| Give a runnable meeting outline | A venue, a cooperating church, attendees or permission |
| Create an editable newsletter | A connected farm system, subscriber consent or email delivery |
| Name a source repository | A callable running worker, authenticated capacity or real partnership |

The front door runs wholly in the browser. It has no network POST, persistence, LLM key, API requests or user-question logging. Obvious secrets, contact details or exact street addresses trigger a local warning without echoing the data back. This is a **best-effort regex safety check**, not a comprehensive protection for sensitive information; visitors are asked not to enter personal details.

For unresolved requests, `HOLD` means no verified tool was selected, **not** that no one in the world can do it. We prefer an honest blocker over an endless sequence of invitations.

## Where this belongs in the larger architecture

**JAR;VIS front / human conversation** → **capability registry / source-owned signed or verified advertisements (future)** → **select a bounded tool** → **produce usable local work** → **receiver permission / stewardship where needed** → **witness real consequence** → **return and improve the routing**.

Current version is deliberately static to make useful-results and nonclaims testable. The next protocol increment should not teach the model to guess from repository names. Instead, each source project publishes a compact capability profile with version, input/output contract, user-facing verb, proof of runtime availability, safety conditions, consent owner and a receipt/return adapter. JAR;VIS can inspect profiles but must not inherit owners' authority. Unknown versions and stale sources HOLD.

## Falsifiable first-human test

Show the entrance without explanation to three first-time, nontechnical users. Ask each to use one realistic request. After two minutes ask: **What usable thing do you have now?** Then test whether they can describe the missing step, whether any unearned real-world outcome was implied, and whether there was an unnecessary second question. Success cannot be inferred from a Node test or a browser click alone.

Code tests: `node --test tests/jarvis-human-first.test.mjs`. Browser smoke: `python tests/jarvis_human_first_browser.py` with Playwright installed.
