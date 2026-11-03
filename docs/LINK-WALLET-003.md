# LINK WALLET 003 — Owner Delegation Desk × WORLD-FORGE-008/009

**Draft proposal, not yet a deployed or merged feature.** Attached to the real Abundent Link Wallet under `/commons/wallet/authority/` and linked from `/commons/wallet/`. Builds into the portable `apps/dist/commons/wallet/authority/` static site.

## Existing production contracts preserved

- LINK WALLET 001 remains an encrypted, account-free personal **HTTPS link keyring** using local AES-256-GCM and PBKDF2 600k rounds, stored as a single encrypted IndexedDB envelope. The **ciphertext storage schema and backup format are UNCHANGED**. The existing wallet can store owner/reviewer/submitter invitations but **does not grant the indicated role**.
- LINK WALLET 002 remains a **same-origin, explicit handoff**, with opener verification, random challenge, inert `?handoff=1` popup marker, origin-targeted `postMessage`, unlocked wallet and a separate **Keep link** click. A new explicit source path `/commons/wallet/authority/` is allowlisted, but it can offer only its own **public HTTPS page address**, never a signed owner grant, fingerprint, secret, revocation, invitation URL, or signing key.
- No backend, account, Supabase, Vercel, DNS, user grants, Web3 assets or cryptocurrency code is changed.

## New clickable owner desk

1. **Choose a public WF008 signed grant file.** Reuse the original verbatim WORLD-FORGE-008 cryptographic validator from reLATTE, checking strict ECDSA-P256-SHA256, exact domain-separated canonical body, expiry, audience and five scoped project-assistance operations. The file remains only in tab memory, never sent to a service or automatically persisted.
2. **See signer fingerprint, signed grant digest and permitted scope.** The fingerprint is a pseudonymous key identifier, **not verified personhood**. The grant is a self-attestation, not a universally recognized institutional credential.
3. **Separately type the entire 64-character fingerprint and check explicit consent** to record a local trust pin. A signed grant alone never enrolls a key. The pin binds the **EXACT signed grant digest** (not only the key) to this browser's separate authority IndexedDB.
4. **Click HOLD or REFUSE on an individual proposed project action.** Only five grant-scoped actions may HOLD for review; merge, money, admission and arbitrary operations REFUSE. A different browser-local nonextractable P-256 key signs a downloadable **owner-desk review receipt**. The receipt explicitly says it is **not a native reLATTE R3 receipt** and does not exercise, execute or approve any external account operation.
5. **Import a separately owner-signed WF008 revocation** from the original owner console, verify the exact grant and key, and record the signed document locally. Subsequent HOLD attempts fail once revocation is in effect. No remote notifications happen; the original browser owner key never enters this app.
6. **Optionally save a public shortcut** to the desk inside the original encrypted Link Wallet using the existing 002 same-origin handoff and separate Keep click. The wallet saves **only the public desk URL**, not any owner credentials. Its encrypted backup does **not** include the separate desk metadata.

## Storage and security limitations

- The new desk has its **own IndexedDB** `abundent_link_wallet_authority_003`. Its local pin fingerprint, signed grant digest and signed revocations are **public metadata stored without the Link Wallet passphrase**. Their privacy is weaker than wallet links. The review-signing `CryptoKey` is **nonexportable** but still usable by hostile same-origin scripts if those compromise the page. *No real grant is stored, no owner's private key is saved, and user-specific enrollment is never pushed to GitHub.*
- The owner might have signed WF008 from a `file://`/offline origin. Its private key remains tied to that original browser storage and is **not imported or synchronized** into Link Wallet. Revocation requires that original key (or separate owner-controlled recovery not implemented).
- Revocation copies in local IndexedDB are subject to local-device compromise, origin storage clearing or other tab race conditions. This is a **prototype** and not production-grade protected revocation infrastructure. There is no secure timestamp authority, freshness service, live service status check, external identity proof, remotely authenticated receiver action or automatic sync.
- Local browser receipt signatures verify the browser's **separate receipt key**, not the original owner. The receipt is not a reLATTE native `R3_HOLD/R3_REFUSE` crossing. The existing WORLD-FORGE-009 local Node receiver independently generates actual native reLATTE receipts; this browser desk **does not** silently substitute its browser records for them.
- No automatic merge, money, credential rotation, legal agency, third-party consent, cartridge admission or physical actuation can occur from this UI.

## Tests

```sh
npm test
python tests/wallet_authority_browser.py
python tests/wallet_browser.py
python tests/wallet_handoff_browser.py
npm --prefix apps run build
```

`.github/workflows/link-wallet-003-owner-desk.yml` runs synthetic owner ECDSA tests, strict typed fingerprint and signed revocation cases, mobile Chromium UI grant import → local HOLD → unsafe REFUSE → owner-signed revocation → subsequent HOLD refusal, plus the actual Link Wallet 002 **encrypted** bookmark handoff and existing wallet regressions. All generated keys in CI are synthetic. No user's actual signed WF008 grant or private key is included.

**Law:** LINK != AUTHORITY · SIGNATURE != IDENTITY · RECOGNITION != CONSENT · HOLD != ADMIT · REVIEW RECEIPT != NATIVE R3 · DELETE LOCAL != REVOKE EXTERNAL
