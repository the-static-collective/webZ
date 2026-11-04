# FIRST CIRCLE 001 — one useful act, an honest return

**Status:** experimental static, account-free, local-only human workflow. No real user study has been completed.

## Door

Open [the First Circle](../first-circle/) (or visit /first-circle/ on a deployed webZ origin).

**Buttons > worksheets.** Three choices: **I need something / I have something / Let's play**. The person can type one sentence or tap a suggested answer, choose a small next move, and receive a portable card.

There is no server request, model call, community submission, account, analytics, or automated match. No social or third-party involvement is inferred.

## Proof path

1. Tap a direction and give a short non-sensitive answer.
2. Select/type one small proposed step and create a personal card.
3. Explicitly **Keep on this device** (origin-local browser storage) or **Download card** (portable JSON).
4. Later choose **It worked / Not yet / Something else happened** and optionally type a non-sensitive note. A return is recorded **SELF_REPORTED**, never verified.
5. **Propose a reusable method** only after a return. Its status is **PROPOSAL_ONLY**; no networked reviewer, recipient, or human approval exists.
6. Import the downloaded JSON on a second device. SHA-256 catches accidental mutation, not malicious re-signing. Imported claims remain unverified.

## Evidence rules

- **DRAFT is not a request submitted to an organization.**
- **A self-report is not verified fulfillment.**
- **A checksum is not a signature or human identity.** Someone who changes the JSON can recompute its checksum; this is accidental-change detection, not adversarial authenticity.
- **A method proposal is not peer review or a licensed/validated procedure.**
- Other nearby systems (JAR;VIS, reLATTE, Full Measure, Jubilee) are conceptual neighbors here, **not invoked or automatically integrated**.
- The optional device save uses plain localStorage. Never type private or sensitive records. Removing browser storage does not revoke downloaded or shared files.
- Imported records are strictly schema-checked; arbitrary authority fields, unrecognized statuses, oversized files, changed checksums and duplicates are rejected. This does not prove a good-faith original author.
- No real-world evidence, independent recipient, signed receipt, verified authorization, or delivery crossing is performed.

## Run

From the webZ repository root:

~~~sh
npm test
npm run serve
# Open http://localhost:8080/first-circle/
~~~

No package install is required for the component; tests import a pure JavaScript contract.

## Next gates

- **Human test:** recruit a willing first-time user to complete an action on a real phone without explanation; measure where they hesitate. No participant claim until that actually happens.
- **Cross-device test:** download, transfer, and import a card using a separate real browser or phone. Automation only tests serialization so far.
- **Independent review:** design an opt-in recipient-owned review crossing. Do not treat a user-entered report as independent approval.
- **Integration:** if a particular independently governed system accepts a reviewed card, build and test that **specific** crossing; do not infer a universal link from compatible vocabulary.

**Definition of bounded success:** a real person can choose, compose, save/export, return, and draft a reusable possibility, with no claim of verified fulfillment or invisible authority.
