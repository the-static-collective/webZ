# FIRST CONTACT 028 — Abundent preview candidate

**October 22, 2026. Draft / HOLD. No production deployment or publication permission granted by this Git branch.**

## What changed

This is a deliberately isolated native static page at `/field/first-contact/` on the *webZ production-ancestry branch*, not an old `main` branch. It moves CANNON's [human field prototype PR #34](https://github.com/the-static-collective/CANNON/pull/34) into a site tree in which an actual web preview can be built and scanned **after** separately reviewing its URL and host access. All six original web-facing code/assets are byte-for-byte copies from exact CANNON commit `2152730d1b300933ce484f455bbdb2da4ab09dd3`, including QRCode.js with the MIT notice. The webZ route is not a source-owned live aid or artistic submission pipeline.

The ancestry is explicit:

- verified Abundent production-source candidate `webZ@65539f065db609c97e5c3ca1ca0b2d0f90c7498a` on NEEDS PR #64 (per historical release evidence; **do not assume this is still today's live deployment**);
- [webZ #67](https://github.com/the-static-collective/webZ/pull/67): field cards release reconciliation;
- [webZ #68](https://github.com/the-static-collective/webZ/pull/68): observation-to-question / local private return;
- [webZ #69](https://github.com/the-static-collective/webZ/pull/69): circulation evidence door, parent exact commit `07ebe108908b3aea93585cd4deb8002590f3ad7d`;
- this separate field-first-contact candidate branch, preserving the existing garden, music, listening rooms, NEEDS, field cards and circulation page.

The garden's public-only `scripts/build-release.mjs` explicitly includes the six field-first-contact web assets, each checked against their own original Git blob at the selected release commit. Existing release metadata and other site artifacts remain otherwise unchanged. Two human-readable site links open the new route from the garden and card browser. The new route has a narrowly scoped CSP allowing only local scripts/styles and the inline image data created by local QR generation, and disallowing network connections, forms and frames. **Vercel automated Git deployments remain disabled.**

## The human-facing sequence

1. Read one clear question without needing a repository account or knowing our technical vocabulary.
2. Select HELP, QUESTION, CREATE, or BROWSE. The last choice explicitly allows no involvement.
3. Optionally write a local-only note (max 180 characters) with a privacy warning. The note remains unsent browser memory unless *the person deliberately downloads it*. Neither the web server nor any public QR receives the note.
4. A field steward can prepare a 9-up US Letter mini-card print layout or a larger 4-up invitation layout.
5. Without a tested address, the printed proof has **no usable QR**. At a hosted preview page, an operator must separately attest they opened the exact address on another device before the print tool creates a QR. This attestation is not evidence of an independent physical scan. A local-LAN HTTP QR remains labeled `DO NOT DISTRIBUTE`.
6. Every QR encodes only `project=living-commons-listening-001` and one public door key in the URL fragment. A scan neither enrolls anyone nor creates a live request.

There is **no external communication, CRM, volunteer assignment, participant graph, backend form, money, PII collection, actual public endpoint, real music release or help fulfillment** here. People cannot submit to project maintainers from this page. If someone needs real help, this prototype is not the channel.

## Review gates

**S0 — source-grafted static application:** Git source hashes, branch ancestry, source-object parity, immutable manifest, content security policy and automated Node tests. `npm run build` must succeed on the *exact commit*. This builds a local `dist/`, not a deployment.

**S0b — mobile simulated browser:** Playwright Chromium on a mobile viewport checks all four options, no storage or external requests, local note/export/erase, contact-looking content rejection, 9-up no QR without operator attestation, 4-up private-LAN QR under locally marked self-attestation, and mismatched address refusal. This does not emulate a real human, actual photo print or second physical phone.

**S1 — reviewed preview address and separate phone (NOT automatically done):** obtain a deliberately created Vercel preview URL or host the source on an authorized reachable HTTPS staging host; compare exact tree and independent HTTP asset responses. Test the QR with a separate camera-equipped phone, a real paper print and cut margins. **A plain localhost URL is not a valid address for a second person's phone.**

**S2 — actual human comprehension (NOT automatically done):** a voluntary tester can understand a QR is an invitation, not a registration or submission; a no is a valid response. Seek consent before any observing/note taking. Do not capture any identifying or sensitive information as part of this experiment.

**S3 — steward/rights/privacy (NOT automatically done):** get explicit host and participating steward review; decide whether a safe opt-in reply method is needed; establish actual privacy, deletion, accessibility and rights policies; test any protected feedback channel separately.

**S4 — production (NOT authorized):** separately approve actual release; verify current live Vercel source, build and preview; review all routes, service-worker cache, root navigation and CSP; manually promote only the reviewed SHA and conduct public HTTP smoke checks. Do not accidentally deploy merely because a PR exists.

## Technical reproduction

From the root of this webZ branch:

```sh
npm test
npm run field:verify
npm run build
python3 -m http.server 8000 --directory dist
# Open http://127.0.0.1:8000/field/first-contact/ on the SAME device.
# Private paper proof only; no actual cross-phone confirmation.
```

Optional real browser test if Python Playwright and Chromium are available:

```sh
python3 tests/first-contact-browser.py
```

Test file `tests/first-contact-release.test.mjs` explicitly guards six CANNON source Git object hashes. Any code adjustment needs conscious repinning and separate human review. Tests are not evidence of real participants or project authorization.

**SOURCE PIN ≠ ENDORSEMENT · PRINT ≠ DISTRIBUTION · QR ≠ CONTACT · CLICK ≠ COMMITMENT · SUCCESSFUL SOFTWARE TEST ≠ HUMAN COMPREHENSION · BRANCH ≠ PRODUCTION.**
