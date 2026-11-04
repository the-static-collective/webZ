# HUMAN FIRST 003 — Jubilee participation before invitation forms

The Jubilee page now starts with eight direct choices: bring a song, food, gathering space, event skills, tools/repair, time to organize, teaching/translation, or simply listen. Each participation button records **only a local UI choice** and jumps to the existing invite composer, where the person can type their actual proposed contribution.

An optional one-sentence field copies text into that composer. It sends nothing and stores nothing. The participation selector starts with **no role chosen**, so nobody accidentally becomes a musician by default. A separate, initially unchecked public-information confirmation is still required before the existing `prepareInvitation` validator can create a local draft. Preparing an invitation **does not send email**; email application opens only if the user deliberately chooses the mailto link.

The existing operational protocol, local steward approval, artist licensing, independent partner consent, and real-world verification rules remain unchanged. Roles are proposals, not live volunteer slots.

Test via `node --test tests/jubilee-human-first.test.mjs` and `python tests/jubilee_entry_browser.py`. Chromium phone flow covers tapped role, plain-language text, a required public-only check, local draft, stale-draft invalidation, and no external requests or localStorage. A passing automated test is not a human usability study.
