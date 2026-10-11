# Branch Workshop 001 — view, don't pretend to execute

Static mobile-friendly workshop under /workshop/ for a human-readable, dated branch-native capability catalog. Source anchors point to **exact pinned commits** and their entrypoint file, not moving branch tips. Observed CI links remain separate from source and from execution permission.

The bundled catalog is a dated human-curated projection. No live source indexing, external network requests beyond user-selected links, auth system, status polling, machine action or execution API is implemented.

Update rules:
1. Review the planZ 004 capability census and source commit evidence.
2. Independently review exact source pins, CI and gates; do not silently call experimental code deployed.
3. Update catalog.json with provenance and date; preserve field categories and refusal language.
4. Run node --test tests/branch-workshop.test.mjs.
5. Review/merge/deploy only through the webZ/Abundent owner workflow.

The branch workshop does not install GHoT or reLATTE, assert human authority, or cause donor code execution. The button that would run an arbitrary branch is deliberately absent.
