# STATIC FIELD — HUMAN ENTRY 001: Five Empty Chairs

**Status:** offline local experiment. The button-first version is `Human_Entry_001_Buttons.html`; the original form-style baseline is `Human_Entry_001_Offline.html`. No server, account, installation, database, external API, or package download is required. Designed to be legible on phone screens and usable in a browser on a Mac; macOS 10.14.6 Mojave browser compatibility and localStorage/file downloads require actual device testing.

## Button-first alternative (November 3, 2026)

**Start here for a lower-friction trial:** open `Human_Entry_001_Buttons.html`. It replaces the initial worksheet layout with one contextual question, large action buttons, one optional conversational reply box, tappable role cards, and progressive disclosure. A fictional example takes one tap; a user can leave chairs empty and return later. Local role labels are still **not** human identity, verified consent or proof of work. It shares the same browser storage key and JSON note schema as the original; only one version should be used at a time in the same browser profile. This is a *guided offline interface*, not an AI chatbot. Browser-level Playwright/Chromium `set_content` checks passed the draft-to-review flow and a terminal refusal; actual Mojave Finder launch, storage persistence and device-level downloads remain unverified.

**Interaction principle:** Buttons before forms; one conversational reply before multi-field worksheets. Offer an understandable next action, with undo/refusal and an optional details view. Do not force people to complete administrative setup to explore.

## Purpose

Prove that an activity can remain at an explicit *empty chair* until a volunteer takes the required human responsibility. It provides one fictional rehearsal for a proposed community welcome table, not an enrollment system or a claim that the venue granted permission.

Five roles: Host (permits scope), Steward (coordinates), Participant (accepts and reports), Witness (observes), Reviewer (independently reviews). Labels are typed into a local file and **cannot authenticate a human**. Reviewer must differ from Participant, Steward, and Witness; Witness must differ from Participant. These are string comparisons, not actual independence verification.

Workflow:

`DRAFT → HOST_AUTHORIZED → STEWARD_SCOPED → PARTICIPANT_ACCEPTED → WORK_REPORTED → WITNESS_RECORDED → REVIEW_CONFIRMED`

Any assigned chair can choose `REFUSED` before the terminal step. Refusal ends that local activity without a substitute. A missing role prevents advancement only at the step requiring that role.

## Try it

1. Double-click the standalone HTML. Note the five genuinely empty chairs and disabled first action.
2. Click **Load fictional rehearsal**. Five explicitly fictional labels populate the chairs.
3. Record each sequential step. Try changing the witness to `River` (the participant) before the first step to see the witness guard when that step arrives. Or clear the board, leave a chair empty, and observe the activity halt there.
4. Export an **unsigned JSON note**. Inspect it with the page's read-only file input. It does not mutate the board.
5. Reload the browser to see whether local storage saved the state. If not, use JSON export as a personal reference; there is no state import in this version.

## Boundary to native Circuit 006

This page deliberately **does not sign anything**. Its JSON is a forgeable local note, *not* a native GHoT or reLATTE receipt, proof of human consent, project approval, actual work, identity, physical custody, or money/credit issue. Circuit 006's separate field kit in `../crossing-006/FIELD_CARD.md` is the working native `source → signed crossing → receiver HOLD/REFUSE → signed return verification` procedure. Circuit 006 requires **Python 3.11+, Node 22+, the pinned Revival/GHoT/reLATTE donors, and two actual compatible computers** for a physical trial. It is not a Mojave click-once application.

**Bridge not implemented:** The browser board cannot promote its unsigned local claims into a native signed crossing, and Circuit 006's optional Scripture method review is not the same as a real welcome-table work report. Keep the two experiments separate unless a future authorized, donor-owned adapter is deliberately built and tested.

## Acceptance / future field evidence

- [x] Offline no-network user interface with five empty roles, fictional demo, bounded action order, local refusal, no review-by-participant, unsigned export and read-only inspection.
- [ ] Verify operation on user's actual Mojave machine and other browser(s), including local persistence and JSON download.
- [ ] Perform independent human usability review of the empty-chair instructions and refusal UX.
- [ ] Execute Circuit 006's existing pinned native signed crossing on two real compatible computers with two willing operators and full independent fingerprint comparison.
- [ ] Obtain event-specific host permission before adapting any task to Fellowship, and separate any actual personal data from public demos.
- [ ] Independently confirm a real useful act using authorized evidence, not this unsigned JSON.

No merge, production deployment, real person enrollment, invitation, payment, Jubilee-credit issue, native Full Measure or GrO write, or live-event authorization is included.