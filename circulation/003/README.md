# CIRCULATION-003 · THE QUESTION IS THE DOOR
### October 24, 2026 · Greater Mankato Coalition of Care gathering

**Status:** independently authored field-kit proposal / draft / HOLD. Not organizer-endorsed. No real encounter recorded by this repo. This branch is stacked on CIRCULATION-001 webZ #69 and unrelated to a deployed production route.

## Carryable experiment

**Objective:** return with up to three *voluntarily shared, non-identifying public questions*, not three participants enrolled or three services promised. Even one properly permitted question is enough. If nobody wishes to share one, zero is a valid result. The paper encounter is useful regardless of the software.

Suggested introduction (not a script anybody must follow):

> “We're trying an experiment where people can carry a question to someone who may find it interesting. No account, commitment or contact details. Want a card?”

Use a small, tactile 8×10 **eight-up pocket-card sheet**: 2 columns × 4 rows, with OFFER / NEED / BUILD / QUESTION repeated. You can print on ordinary paper or photo stock. The back is optional; do not ask for personal information. Test physical margins and readability: photo labs crop differently and glossy photo stock may not accept handwriting well.

## Human choices come before software

1. Offer a card, invite—not require—a conversation. A refusal ends the interaction, with no record about that person.
2. If someone volunteers a possible idea, first distinguish **what they said** from what you inferred or might build.
3. Ask expressly whether the **exact deidentified wording** can travel as a public, unverified question. The person may decline or revise it. Never use a person's name, address, phone, confidential story, or claim of organizational affiliation.
4. Only then, optionally use the **local-only question press** to prepare a `circulation.field-question/v0` *unpublished candidate*. The two checked attestations are the current browser operator's statements, not a cryptographic proof of informed consent.
5. The browser downloads a **public-safe candidate JSON file to the user's device**, only on a second explicit save click. No server-side intake, storage, upload, tracking, QR or account. Never place the raw conversation online.
6. A separately owned recipient must later decide whether to consider the question. Nothing in the card, packet or diagram presumes they did so. In particular, **BananaSpork Help Slips are not created** by making a question.

## Data model and purpose

`packet.mjs` and [CANNON CIRCULATION-003](https://github.com/the-static-collective/CANNON) share a strict, domain-separated SHA-256 canonicalized packet grammar. It contains only the one chosen public question, kind, fixed event identifier/date, `AUTHOR` or `FACILITATOR_WITH_PERMISSION` source claim, and rigid false flags for publication/owner admission/fulfillment/identification. Its evidence class is always `SELF_ATTESTED_UNVERIFIED`.

**A hash detects byte drift. It does NOT verify that any person was present or gave permission.** Basic contact-shaped input filtering is not sufficient for privacy; the independent human wording review is required. Avoid sensitive details before typing, not merely during export.

The field gate in CANNON only produces a typed `HOLD_UNPUBLISHED` and a source-bound receipt; it neither registers a need nor contacts any organization.

## On-the-day acceptance checklist

- [ ] Eight cards fit a real 8×10 print with safe margins and legible type.
- [ ] Cards can be carried and used entirely offline, with no digital requirement.
- [ ] One person can say “no” without being recorded.
- [ ] Wording is reviewed with the source person, and permission for precisely that wording is explicitly requested.
- [ ] Public question contains no identifying or sensitive details, and can be further reduced if necessary.
- [ ] Public candidate can be downloaded locally; page creates no remote state.
- [ ] No person, assistance, volunteer, organization, grocery, church, publisher or Coalition organizer is shown as enrolled, endorsing or committing.
- [ ] Post-gathering notes keep observation, permission claim, proposal, independent recipient review and verified real-world outcome separate.

## Deployment and print

Website candidate path: `/circulation/003/`. A successful branch build shows it is **deployable**, not deployed. Vercel deployment is disabled in `vercel.json`. Production release requires exact branch/source validation, mobile/print proof, organizer approval if using the organizer's name/branding, a separate human go/no-go decision, and a post-deployment smoke check.

Run `node --test tests/circulation-003.test.mjs` plus the existing webZ suite; immutable release manifest should include the HTML, CSS, app and packet module. The cards can be printed without internet after opening a local/static copy of the page; no QR destination depends on deployment.

**A QUESTION IS NOT A REQUEST FOR SERVICE. A CARD IS NOT CONSENT. A CONVERSATION IS NOT PUBLICATION. A RETURN IS NOT COMPLETION.**
