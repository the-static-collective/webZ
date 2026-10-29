# SUITCASE-001 — The Room That Leaves Home

**A working static, offline-first, device-local research demonstration. No institution has enrolled and no real coordination has occurred.**

Open `/bridge/suitcase/` on the **GitHub Pages-hosted** Abundent Switchboard. Pages publication copies all of `bridge/**`; no Vercel or external API needed.

## Delivered on October 28, 2026
- Graphic-novel-styled six-panel field story and print layout. These are explicitly fictional and not field evidence.
- A device-local room key generator using **P-256 ECDSA Web Crypto**, nonextractable private keys in **IndexedDB**, exportable *public* JWKs and SHA-256 fingerprints. A locally created "church" room is labeled **CANDIDATE**; a browser key does not establish identity, venue permission or verified stewardship.
- A minimal signed cross-room envelope carrying a bounded `OFFER` (open or addressed by recipient fingerprint), a `DISPOSITION` (`HOLD`, `REFUSE`, `REVIEW`) bound to the original offer digest, or `HOST_INTENT` with the fixed **`UNVERIFIED_HOST_PROPOSAL`** classification. No `ACCEPT`/field authorization is implemented. Recipients sign with their own separate key; sender cannot edit responses without breaking the signature. A proposal's recipient fingerprint is an **address constraint, not encryption**.
- Human-carried JSON export and import using direct transfer of files (USB/Bluetooth/phone share). No outbound web fetch, email send or central record. Import verifies SHA-256, ECDSA, issuer public key fingerprint and payload schema; **key possession is not human or organizational identity**.
- Six planned physical-node archetypes, each with owner permissions and safety/power veto: individual suitcase; church fellowship; campus lab; farm/co-op/food shelf; festival; library/community center. Generate a signed **unverified** host-intent draft and print questions for prospective stewards. No real hardware operation, power dispatch or authority.
- Service worker caches ONLY an explicit allowlist of public same-origin app-shell assets (HTML/CSS/JS/manifest/icon). It never caches dynamic imported packets, API calls or cross-origin requests. After first successful HTTPS visit and SW installation, page reloading can work offline. Browser/device storage is limited and can be cleared.
- Automated protocol and two-independent-browser-context tests, including signed offer → separate receiver REFUSE → signed receipt back, tampering rejection, proposed church node and offline reload.

## Boundaries: what we did **not** build
- **No encrypted correspondence:** JSON packets and stored proposal text are plaintext. Do not include personal information, names of survivors, resident identities, actual service addresses, emails, secret tokens or anything confidential. Use the existing encrypted Outbox for private draft custody. The public keys are not a human-identity proof.
- **No portable private keys:** the first demo keeps signing keys nonexportable on the originating device. Device loss, storage wipe or origin migration loses that signing identity; recovery/rotation/revocation remains unsolved. No false claim of seamless device migration.
- **No authenticated institutional invitations:** an operator may type a church or campus label but this does not establish affiliation, site agreement, safeguarding, children/youth permissions, physical nodes or public services.
- **No relay or live peer synchronization:** the mechanism moves JSON files through intentional human transfer; it does not deliver packets over the network, pair phones automatically or create an encrypted shared database. Any future relay requires consent, encryption, anti-abuse, authentication and availability design.
- **Not wire-compatible with reLATTE:** this is an independently implemented SUITCASE experimental envelope borrowing HOLD/REFUSE separation. Native reLATTE receiver admission/signature, persistent reLATTE custody, GRAFT code review, planZ owner-selection and GHoT energy-policy integration remain separate, gated engineering tasks.
- **No assertion of work performed:** a receiver `REVIEW` disposition means review of a proposed file, not admission, resource acceptance, field work or independently verified outcome.

## Operational system: what the physical host might actually look like
**First pilot:** two devices in airplane mode after the app is installed; one uses a generic Garden room and another a generic church-host-candidate room; sender signs a fictional public-safe question; transfers `OFFER` file via a local transport; receiver imports, checks out-of-band fingerprint and signs `HOLD`; file returns and signature verifies. Separately, print the church host proposal and ask a steward if they want to review it. No church is enrolled until an actual named official opts into an agreed scope.

**Non-software host gates:** named authorized steward, host/venue permission, scope & safeguarding, accessibility, fixed hours, no confidential client information, backup/recovery owner, electricity/network/fire code compliance, safe shutdown, budget, appropriate independent review and a clear right to decline.

## Progression
1. **SUITCASE-001**: working offline public-safe signing and host-proposal demo (this branch).
2. **CUSTODY-002**: encrypted-at-rest room data, independently authenticated identity directory, recovery/rotation, per-device role separation.
3. **POSTMARK-003**: optional encrypted receiver-controlled relay with bounded capacity, spam controls, expiration, receipts and no implied read/delivery.
4. **NODE-004**: physical church/campus/coop candidate steward consent, inventory, power budgets, installation and GHoT policy enforcement—**only after** willing owner.
5. **CROSSING-005**: adapt to native reLATTE wire contracts, GRAFT provenance and planZ decision statuses; test malicious packets and separately reviewed real pilot.

## Run tests
`node --test tests/suitcase.test.mjs` and `python tests/suitcase_browser.py` (Playwright installed). `npm test` and `npm run test:browser` include these in the full repository suite.
