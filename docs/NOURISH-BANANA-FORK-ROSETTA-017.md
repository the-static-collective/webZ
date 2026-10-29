# NOURISH / BANANA FORK ROSETTA — VOQAL-017

**Review-only · October 29, 2026.** What each similar name *actually owns*, followed by executable cross-repository evidence. Fictional pantry, no real service, no beneficiary, no grant submission. This draft stacks on WebZ [VOQAL-016](https://github.com/the-static-collective/webZ/pull/211), not on main. No old owner is silently absorbed or merged.

## The names, untangled

| Name | Source | Owns / distinctive job | Does not automatically own |
| --- | --- | --- | --- |
| **Nourish Kids** | [Nourish-Kids](https://github.com/the-static-collective/Nourish-Kids) | Parent's meal/budget questions, reviewed ingredient requirements, known/missing/unknown declaration, **only selected unmet** help-slip source. | A food delivery, clinical nutrition clearance, a partner referral or a public household profile. |
| **BananaGram / Gram-to-Fork** | [BananaGram-Gram-to-Fork](https://github.com/the-static-collective/BananaGram-Gram-to-Fork) | Earlier family/neighbor **chat and participation prototype**, with ideas about a basket, seeds, witness receipts and a porch. | Production Telegram affiliation, authoritative AI allergy verification, real receipt confirmation, a second trusted ledger. Its README makes aspirational AI claims, not externally substantiated feeding evidence. |
| **NanaSpork / BananaSpork** | [BananaSpork](https://github.com/the-static-collective/BananaSpork) | Android/web **field instrument**; Garden device-local HOLD, strictly admitted help slips, per-requirement preview; separately authorized Campfire need/offer/confirm. **This is the native receiving owner used in VOQAL-017.** | Publishing merely on import; a login, live multi-account proof, or child-feeding outcome from a fixture. |
| **Garden** | [BananaSpork README](https://github.com/the-static-collective/BananaSpork/blob/main/README.md) | Humane local interface: *how did this become, what remains unresolved, where can I participate?* | A replacement central database or new sovereign ledger. |
| **Campfire / Jubilee Campfire** | [Jubilee-Campfire](https://github.com/the-static-collective/Jubilee-Campfire) | Original Offer → Join → Remember community-ecology hypothesis; BananaSpork Campfire's live authority is a separate authenticated boundary. | Entitlement to enter someone else's household or act without membership. |
| **gramfork** | Private [gramfork repository](https://github.com/the-static-collective/gramfork) | Separately developed household need/pledge/report/confirm authority design and potential live app; **not read, imported or disclosed in this public PR**. | A cross-app universal membership or proof that two-account field verification happened. |
| **Jubilee Engine VM** | [Jubilee-Engine-VM](https://github.com/the-static-collective/Jubilee-Engine-VM) | Optional later **Book of Acts**, bounded occurrence/provenance review. | Automatic promotion of a help slip to public history, token money, reputation, or confirmed feeding. |
| **GrO** | [GrO](https://github.com/the-static-collective/GrO) | A future *possibility/next-action* encounter seed, local admission and refusal. | Claiming capacity just because a link or proposal exists. |
| **Second Table / Still Here** | [WebZ VOQAL-016](https://github.com/the-static-collective/webZ/pull/211) | Human co-designed method to test voluntary, independent community continuity after useful acts. | Authority over any owner repository, actual human enrollment, or institutional endorsement. |

> **Compressed identity:** Nourish identifies the selected meal gap → NanaSpork can privately HOLD it → a real, authorized Campfire member could separately choose whether to pour one requirement → the caregiver confirms actual receipt → only then can an independently governed table evaluate whether a successor is useful. BananaGram is a predecessor of the *porch metaphor*, not the authority itself.

## The new *real code* crossing — what ran

The WebZ runner `scripts/nourish-banana-native-crossing.mts` clones (via dedicated CI) **two exact original owners**:

- Nourish source at draft FULFILLMENT #2 head `669d9750d62c670cfd3894fcffe367af83e85374`.
- BananaSpork main at `f4c4067b5896eb5eb20a7498f89da38f04731d73`.

Actual owner functions are imported and executed at the pinned files, not reimplementations or shared pasted fixtures. The runner asks the **original Nourish recipe evaluator** to distinguish (1) one explicitly available ingredient, (2) one explicitly absent ingredient, and (3) one undeclared unknown ingredient. Its original `createFulfillmentEnvelopeV0` emits a **single selected**, `status: "unmet"` requirement.

The original **BananaSpork** `admitHelpSlipCarrier` admits that JSON while preserving a source payload hash and refusing extra fields. The actual `HelpSlipHoldStore`, with a deliberately supplied *in-memory test storage*, accepts two differently formatted arrivals as **one held case**; neither is transmitted. The original `buildCampfirePourPreview` preserves unit and quantity and omits original recipe/envelope/private metadata. The original `pourHeldRequirement` is called **only with explicitly denied synthetic authority**; no shared need is opened and no requirement link is written. The original `projectHelpSlipResidual` correctly reports **zero confirmed units** and the source requirement still outstanding.

### Adversarial mutations sent to actual BananaSpork admission

The independent receiver must **REFUSE** (not silently drop sensitive data and then claim success):

1. Additional `privatePantry` field;
2. Claimed already-fulfilled status;
3. `omittedPrivateContext:false`;
4. Unexpected source household identifier;
5. Quantity without unit;
6. Zero quantity;
7. Empty requirements;
8. Unsupported schema.

Source-review tests assert that the example contains no private child identity, exact address, auth token, AI service call, real person, network send, new payment, or partnership. Original receiving owner Help Slip test suite is also run by CI.

### Execute it independently

After checkout of the original pinned Nourish and BananaSpork commits:

```sh
# Use original BananaSpork's pinned dependencies and its TS runner
(cd /path/to/BananaSpork && npm ci --ignore-scripts --no-audit --no-fund)
# From this WebZ branch:
 /path/to/BananaSpork/node_modules/.bin/tsx scripts/nourish-banana-native-crossing.mts /path/to/Nourish-Kids /path/to/BananaSpork
```

A successful execution prints one fictional JSON evidence packet with both commit pins, original functions executed, eight mutation refusals, deduplicated arrivals, the public-safe preview, a denied authorization attempt, and explicitly zero real-world effects. CI uploads only this synthetic artifact.

**Code correctness is not human truth**: nothing proves a caregiver wants this, a Waseca food shelf has agreed, food is safe, a resource exists, an offer is real, a household confirmed delivery, or an independent Second Table has formed. No Supabase migration or private gramfork code is touched.

## What to smash next WITHOUT crossing the truth line

- **Field discovery:** compensated caregiver/disabled-resident co-design and qualified child-food/access safety review. They can reject the premise. Do not recruit children or extract personal histories as proof.
- **Real operation only after permissions:** consented individual caregiver chooses one gap; independent authorized organization decides whether to accept; original owner retains private context. No user account required just to join an offline community conversation; an actual shared Campfire mutation would require its own authenticated membership and RLS.
- **Confirmed consequences:** only original recipients may independently confirm real outcomes, and only after the real safety/ownership gates. `reported != confirmed`. Repeat imports/duplicate potential offers must never multiply a family's need.
- **Book of Acts / GrO / Second Table:** later *optional* review of nonidentifying confirmed activity and voluntary successor requests, with distinct owner admission. A new table must be allowed to decline founder control.
- **Musical alternative:** the same first-table method can start with a song or repair instead of food; there is no compulsion to disclose pantry data, identify a child, join a church, use AI or install an app.

## Money, people and Voqal

The existing **$30,000 applicant-review budget remains unchanged**. This crossing uses already allocated meals, access/transit, paid resident co-design, independent food-safety/accessibility review and applicant organizing support. It does not pay influential people to convene, claim any of the user's five in-person contacts have committed, or assert Coalition of Care sponsorship. Nourish comes forward because it is a **bounded practical first doorway** for the father-first goal: a world children can inherit *and enjoy*. The fellowship is a proposal, deadline Oct 31, and is not yet submitted.

**Invariant:** SOFTWARE HOLD != A CHILD FED. CHAT IDEA != AUTHORITY. IMPORT != PUBLICATION. OFFER != DELIVERY. REPORT != RECIPIENT CONFIRMATION. REPLAY != AN INDEPENDENT HUMAN TABLE.
