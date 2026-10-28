# LINK WALLET 001 — One person's private WebZ keyring

**October 28, 2026. Browser-local encrypted storage; not a global account or service-issued identity.**

## Core metaphor
Every WebZ door has an address. Some public addresses are bookmarks. Others include **bearer capabilities** — possession of the link confers limited access to an externally governed room. This personal link wallet collects the user's voluntarily saved addresses and metadata in one encrypted container, while the originating systems continue to decide which permissions are active.

## Workflow
1. Open /commons/wallet/ from the Abundent Switchboard or Living Inbox.
2. Create a wallet with a memorable 12–200 character passphrase. Neither it nor plaintext is uploaded.
3. Copy a known HTTPS link from the existing service, and explicitly paste it into the Add a door form. Label its scope (owner / reviewer / submitter / invitation / public / other) and optional project group. Access scope is a **user label**, not verified authorization.
4. Use search/filters, Open door or Copy link. Private URL fragments and query strings are hidden from the wallet list, but **opening the external destination or copying to clipboard shares the secret with that destination or the clipboard**.
5. Lock to discard the decrypted contents and non-extractable CryptoKey from the page's application state. After 10 minutes idle or 5 minutes in background, it auto-locks. Reloading also returns to the locked state.
6. Download an encrypted JSON backup and privately import it on another device or on another Abundent hostname. The browser origin owns its own independent IndexedDB; we intentionally offer **no automatic synchronization**.
7. Rotate the wallet passphrase if desired; **also download a fresh backup**. This changes only the local vault encryption. Use the originating service's owner controls to revoke leaked bearer links. Deleting a wallet item does not revoke it.

## Encryption and limits
- AES-256-GCM with fresh 96-bit random IV on every save and fixed additional authenticated data label.
- 600,000 PBKDF2-HMAC-SHA256 iterations, independent 128-bit random salt per vault/passphrase. The derived CryptoKey is non-extractable and only stored in memory while unlocked.
- Single ciphertext blob with *all* URL data, titles, group and notes encrypted. IndexedDB holds only schema/kdf/iterations, salt, IV, ciphertext, revision and time.
- Import validates exact version and bounded crypto parameters, then authenticates/decrypts *before* any local overwrite.
- IndexedDB compare-and-set revision detects most simultaneous-tab write conflicts. Only one tab should edit the same wallet at a time.
- Max 200 links, HTTPS-only links without embedded basic-auth, 2,048 characters per URL; plaintext backup is never offered. Static assets may be cached for offline reopening after initial load but **wallet records never enter service worker caches**.
- No analytics, external images, SDKs, servers, browser-sync, wallet seed phrases or Web3 private keys. It is not a cryptocurrency wallet.

## Important security limits
A website's JavaScript must decrypt links to render and open them. Thus compromised same-origin scripts, malicious browser extensions, device malware, unlocked-device access, hostile clipboard readers and phishing links remain relevant risks. A password cannot be recovered by Abundent. All the browser's cached data may be cleared by the OS or user, which is why a backup matters. Wallet secrets are not linked to human identity or proof of ownership; an owner key is powerful even if the label is misleading. Use the original room's rotate/close controls to revoke a link. The browser does not check if a saved invitation is still live.

The current first pass requires **manual, explicit paste** (or private encrypted backup import). It does not silently harvest links from pages, emails, browser history, chats or other users' invitations. Future opt-in integration could permit reviewed same-origin handoffs only with consent and a separately unlocked wallet.

**Privacy law:** SAVE != SHARE; HOLDER != VERIFIED_OWNER; WALLET != ACCOUNT; BACKUP != RECOVERY_SERVICE; DELETE_LOCAL != REVOKE_REMOTE.
