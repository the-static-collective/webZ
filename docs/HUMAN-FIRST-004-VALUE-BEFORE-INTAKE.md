# HUMAN FIRST 004 — Value before information

**Problem observed:** changing an intake sheet into four buttons did not change the actual journey. The first tap still led to another form. Buttons alone are not the achievement; the experience must immediately do something useful.

## Design law

**First useful consequence before first required field.** A tap should let a person try, discover, make, or use something. Intake is an optional downstream service boundary, not the default entrance. The machine holds the structure and should only ask for human context when it truly cannot proceed without it.

## This change

- **Porchlight Commons /commons/**: Start with a visibly fictional, branching micro-situation about possible surplus vegetables and a community table. A single tap reveals the consequence and a reusable question. Optional clipboard copy uses an explicit click. **The existing organizational intake is collapsed**, not deleted, and all safety/receipt math remains unchanged. The experience claims no actual producer, recipient, permission, match, or delivery.
- **Jubilee /jubilee/**: Participation buttons now produce an immediately usable sentence and a specific suggested next question **in place**, instead of jumping visitors straight to an intake form. Typing a sentence also makes the idea visible and copyable without first selecting a role. A separate **Make it mine (optional)** button opens the existing composer. Its consent checkbox, local validation and explicit mailto step remain required for more formal invitations.
- **Offline**: The Commons scene and progressive-entry modules join the first-party static cache (no personal data added).

## Evidence and release gate

Node tests: `tests/value-before-intake.test.mjs`.
Browser flow coverage extended in `tests/commons_entry_browser.py` and `tests/jubilee_entry_browser.py` for immediate outcomes on 390×844 Chromium.

Test success verifies software behavior under test conditions; it does not prove visitors find the interaction useful. Real field observation remains an open question. Rehearsal content is illustrative and is never counted as work, permission, or verified aid.

**Test to hold ourselves to:** can a first-time visitor get a coherent result *before* giving us any information?
