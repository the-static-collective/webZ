# WHO MURDERED TOMORROW? — Reality.2 Mystery Dinner 001

**An independent, complete, runnable, 1999-ish browser tabletop mystery.** Six suspects, three envelopes of source-authored fictional evidence, a logical resolution, and one optional question card. No actual murder, compulsory initiation, personal accounts, tracked player information, real-world tasking, or organizer endorsement.

**PLAY:** Open /games/tomorrow/ (from the standalone Ask JAR;VIS static build) or open \`index.html\` on a local host that serves ES modules. Click *Open the Case File*, interview the six witnesses, release the three evidence envelopes, deliver the verdict, optionally create/download a local question card.

**Paper:** The companion native Google Drive folder \`WHO MURDERED TOMORROW — REALITY.2 MYSTERY DINNER 001\` contains (1) Host's Case File with spoilers/75-minute walkthrough, (2) Print & Play Player Case Packet, (3) Invitation & Quick Start. **Do not publish the privately held Google Docs links without a separate access decision.** They are currently scoped to the creator's Drive.

**Sources:** Existing \`COMMON_TABLE_001_Postymon_Reality2_Cards.pdf\` provides actual P05/P07/P10/P11 and R06/R07/R10/R12 card identities. The case and suspect plot are new independent original fictional text. Optional Table & Road parabolic art card is separate from operational POSTYMON/REALITY.2 declarations; nothing in the game is consent to be contacted, a donation collection, or an organizational request.

**Truthful implementation:** All drama/state is static client-side; user input for the verdict never leaves the browser. The question card is local text. JAR;VIS root remains a separate source-inspection instrument, *not* a live agent-run mystery host. There is no central database, remote execution, real identity claims, or partnership workflow.

**Production acceptance:** Verify /games/tomorrow/ GET on mobile, scripts and case.mjs load, three gates, correct and wrong verdicts, card export, printer rendering, no forms or analytics calls, reduced-motion mode, and that the root 1999 question box remains unchanged. The deployment uses exact source files and may be rolled back to an earlier Vercel deployment if needed.

**Full-length game** 60–90 min, recommended 6–12 volunteer players. A 20-minute demonstration is possible only with a willing host. \`NO ACTUAL MURDERS. BRING A CASSEROLE.\`

## 002 / THE QUESTION KEY AND THE TOWN THAT WAITS

After correctly solving the mystery, the player can select **three distinct fictional case clues**—the official claim (A02), the actual transfer (B02), and the intact cupboard inventory (C01)—to compose a local Question Key. The key is a URL-fragment game token; it is **not cryptographic authentication** and grants no real-world right or Full Measure canon.

The key opens the 1999-styled little town at **`/games/tomorrow/town/`**. Its porch, garden, stage, archive, kitchen and post office can be inspected. A POSTYMON × REALITY.2 question can be downloaded without a server request. The optional workshop imports an **unmodified and pinned** copy of Full Measure's Alchematrix reducer and lets the player perform real deterministic *fictional* composition: mining, probes, observations, an instrument-socketed workbench, a **second independent lab Question Key**, and a source-owned door-opening action. That lab consequence appears as a new local town room. Neither Question Key is an identity, authorization, or historical witness.

### Donor provenance — explicitly source-owned

- Original repo: `the-static-collective/full-measure-world-layer`.
- Experimental branch: `experimental/alchematrix-001-haunted-telescope`.
- Source commit: `587af5a8f1cb73781d1943343234d75aabd0f9c4`.
- Original file: `experiments/alchematrix-001/core.mjs`.
- Git blob SHA: `4be97563e4cdd2ba16abd597f856dd091dddc4d4`.
- Vendored file (byte-for-byte unchanged): `town/alchematrix-core.mjs`; the real source-native `step`, `initialState`, and `benchCapabilities` functions are called by `town/app.mjs`.
- The key composition and town projection are **new Reality.2 adapter code**, not a claim to be upstream Full Measure logic. The donor's world state remains fictional-local and source authority is not imported.
- Other Full Measure branches (Living Deck Quest, Frontier, PLENTY, Grace, Warm Thread) have been reviewed as candidate future adapters but are **not claimed to be executing** in the 002 release.

### Tests and boundaries

`node --test test/worker.test.mjs test/tomorrow.test.mjs test/tomorrow-town.test.mjs` from `ask-jarvis/`.

`tomorrow-town.test.mjs` exercises strict case-key evidence, source claims, wrong/tampered key rejection, a real Alchematrix crafting sequence with resource costs and two retained prism observations, source-native new-door output, and no real-world or canonical authority. All activity happens in the user browser. No accounts, remote writes, model inference, analytics, scores, activity tracking, or contact data. Refresh resets the local town; no concealed saving is performed. The archived Garden site remains separately accessible.
