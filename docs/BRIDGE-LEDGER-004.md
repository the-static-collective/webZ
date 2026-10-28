# BRIDGE-LEDGER-004 — The Operator's Private Relationship Ledger

**Source:** `webZ/bridge/desk/`. **Status:** real encrypted browser-local journal for the operator, **not** a live institution integration, shared CRM, submitted application, identity service or award verification.

## Purpose

[BRIDGE-001](./BRIDGE-001.md) invented the portable institutional invitation. [BRIDGE-NETWORK-003](./BRIDGE-NETWORK-003.md) mapped 23 prospect institutions to nine possible project instruments. **BRIDGE-LEDGER-004** adds a separate, operator-owned journal that can survive page reloads and retain application/outreach history without the prototype quietly promoting an institutional prospect into a partner.

A **prospect remains a prospect** until an independently controlled institution actually responds, and this first implementation records only *what the operator attests* occurred. Even entering a response, award or independently reviewed act is not independently authenticated by this software.

## Shipped interactions

- `/bridge/desk/`: work queue derived from all 23 `BRIDGE-NETWORK-003` prospects, with eligibility gates, dated deadlines and a focused next preparation.
- Local operator may append one of 12 typed entries, including source checked, applicant/steward permission reported, draft prepared, outbound message reported, application reported submitted, response recorded, discussion reported, task report, distinct independent review reported, refusal or withdrawal.
- Entries require a short factual note; an optional *public HTTPS source link* may be attached, but a URL with query, fragment or credentials is refused (avoid sharing bearer links). No private contact, case, beneficiary or institutional correspondence should enter the note. The field is limited, not a privacy filter.
- Immutable sequence in the application model: UUID, institution ID, typed event, note, optional evidence link, browser date, previous SHA-256 digest and current SHA-256 digest.
- Browser displays local event timeline, reported-submission and reported-review counts **explicitly qualified as operator-entered**. Past deadlines become **DEADLINE_PASSED_UNRECHECKED**; no application automatically closes.
- AES-256-GCM with PBKDF2-SHA256 (600,000 iterations), unique 128-bit salt per vault, fresh 96-bit IV per save and domain-separated authenticated additional data. Derived non-extractable key lives only in memory while unlocked. IndexedDB stores only ciphertext envelope. Distinct database from the existing Link Wallet.
- Ten-minute idle lock; five-minute background lock; encrypted JSON download, check-and-restore on a fresh origin, passphrase unrecoverable. Browser storage is subject to clearing; user must retain backups.
- IndexedDB compare-and-set on revision prevents most lost updates when two tabs share one origin; failed writes do not falsely update the visible log.
- CSP `connect-src 'none'`; no fetch, remote scripts, backend write, mail delivery, contact discovery or institutional identity assertion. No plaintext export by default.

## Safety, authority, and limitations

`NOTE_ENTERED != REPORT_VERIFIED`; `SOURCE_LINK != THIRD_PARTY_SIGNATURE`; `SUBMITTED_CLAIM != SUBMISSION_RECEIPT`; `RESPONSE_RECORDED != PARTNER`; `REVIEW_DECLARED != INDEPENDENTLY_VERIFIED`; `LOCAL_ENCRYPTION != SAFE_COMPROMISED_DEVICE`; `CANDIDATE_LINK != RELATIONSHIP`; `SIGNED != TRUE`.

The hash chain is **tamper-evident within an exported, authenticated sequence**, not append-only physical storage or an independently witnessed chain: a person who controls the vault/passphrase can create a new chain. Even an authentic external link might not support the operator's claim. External identity/permissions and proof of completed acts remain receiver-owned.

This is **not** a multi-device synchronized ledger, user-management service, multi-operator CRM, digital signature issuer or reLATTE receipt store. The parallel Link Wallet manages bearer capabilities independently; this journal expressly refuses bearer URLs in its evidence URL field.

An encrypted backup restores only when the destination's ledger database is empty, after passphrase-authenticated decryption and full hash-chain verification. To replace an existing ledger, the operator must handle storage removal intentionally; the page does not silently overwrite. Passphrase and browser storage are not recoverable by the Static Collective.

## Concrete first day

1. Open the operator journal and create a local vault.
2. Select **Voqal** and visit the official source; only then record `SOURCE_CHECKED`. Record actual eligibility questions, not a made-up approval.
3. Select **Nexus** and record the real group-participation permission only after a willing actual group has agreed.
4. Use `Copy unsent introduction` to prepare a public-safe draft. Sending still occurs separately through the institution's own contact method.
5. If an application is genuinely filed, append `APPLICATION_REPORTED` with actual non-sensitive evidence. The system will call it *reported*.
6. Save an encrypted backup to user-controlled storage.

## Next independent system crossings (not implemented here)

- A **private** planZ owner can explicitly accept a source-pinned sanitized work item; do not place private event notes in a public repo or plan index.
- An approved JAR;VIS session may later offer one locally reviewed next task without accessing the user's ledger by default.
- A reLATTE recipient may *independently* sign RECEIVE, HOLD, REFUSE or scope-specific review; this event stream is not a substitute for that signature.
- Public demonstration artifacts may be exported from separate, reviewed, redacted source data only; never publish this personal encrypted ledger or its decryption key.
- A real external response should be independently authenticated before recording verified relationship/award status.

## Release gate

The new route is part of the existing portable `apps/build.mjs` copy of `bridge/`. Its source and CI checks cannot by themselves prove the current Vercel app or custom domain has received this new code. Verify `/bridge/desk/index.html`, `/app.mjs`, `/vault.mjs`, `/store.mjs`, `/ledger.mjs` and `../network/model.mjs` at the **actual target production domain** after release, respecting [Bridge production hold #173](https://github.com/the-static-collective/webZ/issues/173). Do not attempt bulk quota-hitting deploys, change DNS, leak credentials or call a READY unrelated deployment the correct one.
