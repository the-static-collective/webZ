# SPAM MUSUBI 002 · The edible part is the test, not the spam

**State:** separate experimental stacked branch from HEY-001. Not merged or deployed. No actual community moderation, classification or contact.

## The discovery

The first real HEY test was playful: a response card with context "southpark!" and an absurd question about Roger Rabbit. This was not evidence of a bot. It demonstrated that the response grammar needed a first-class way to say **I'm playing** rather than forcing humor into ASK.

A second challenge: any open interface will eventually encounter trolls, automated spam, repeated sales copy, bad-faith input and outright abuse. Can some of that pressure be useful *without paying the troll with attention or punishing legitimate people*?

## The recipe

```
UNTRUSTED PASTED TEXT
       ↓ (local, bounded parsing)
CONTENT-FREE STRUCTURAL HINTS
       ↓
SYNTHETIC FALSE-POSITIVE / ROBUSTNESS TEST RECIPES
       ↓ (human reviews and decides what, if anything, to test)
BOUNDARY IMPROVEMENT CANDIDATE
```

The original payload, URLs, user names, demands, or offensive phrases never enter the generated recipe or exported JSON. No source hash (low-entropy reversal or unwanted correlation risk). Original text is cleared from the UI after a successful local analysis. Reloading forgets the session.

Four formatting hints only: multiple link-shaped strings, repeated lines, high uppercase proportion, long text. These are **not** bot/human, malicious/benign, sincerity, spam, mental-state, threat, or policy-violation classifications. They are intentionally weak and create no automatic moderation consequences.

**Always** include the human-joke false-positive test. Off-topic questions, unusual language, humor, accessibility-related atypical writing, and playful teasing must not be punished by default. When a potential signal occurs, the tool outputs a general test recipe — without returning or restating the attack material.

## New behavior

- HEY has a seventh human-selected first-class response **PLAY**, with joke, riff, absurd what-if and teasing refinements. It has no offer/consent or moderator implication.
- New independent page `/response-grammar/compost.html` is local-only. It can load an explicitly fictional example or accept user-pasted text, compost once, clear input, show safe candidate tests, and export generic JSON.
- `spam-musubi.mjs` is deterministic and independent of UI/network.
- Unit regression tests cover false positives, no raw text echo, repeated lines, suspicious-looking URLs, uppercase, overlong input, and non-authorizing disposition.

## Stop conditions

No auto-engagement, quote-posting abuse, sending raw spam to another AI, synthesizing users, public shaming, moderation bans, account scoring, notification to the sender, inferred human identity, malicious links followed, harvesting personal data, proof of malicious intent, or automated updates to security rules.

**Hold → Review → Separate local disposition** must remain independent if this is ever connected to Porch. Any actual enforcement needs security review, appeal, rate limiting, human authority, and explicit receiver permissions. This branch has none of those effects.

## Honest evaluation

1. Run `node --test tests/response-grammar.test.mjs tests/spam-musubi.test.mjs` and source-owned repo tests.
2. Open `/response-grammar/`; create a PLAY card for a strange nonmalicious joke.
3. Open `/response-grammar/compost.html`; load the synthetic example. Confirm the raw input disappears and the recipes contain no example URL.
4. Test an innocently weird human sentence. Expect **no spam classification**, a playful-false-positive question, and no restriction.
5. Deliberately inject repeated lines and links; verify only a content-free review recipe, no links in export.
6. Independently inspect security, accessibility and browser behavior before linking the page publicly or merging.

A source-level V8 check of `spam-musubi.mjs` performed during creation passed nine targeted assertions. It is not a substitute for the full Node, browser, security, abuse, or real-world field tests.

## In one line

**Don't feed the spam to the town. Feed the pattern to a test bench — and leave strange humans alone.**
