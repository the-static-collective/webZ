# LINK WALLET 002 — One-tap handoff between Abundent doors

**Implementation:** Public Switchboard cards and owner/reviewer/submitter/rotated/current Living Inbox invitations can offer a link to the same-origin wallet. The receiving person separately reviews and explicitly saves the offered link only after the wallet is unlocked.

## Boundary and exchange
- The source button opens the local wallet with only `?handoff=1` in its navigation URL. **No bearer URL appears in this query, path, fragment, network call, analytics or clipboard.**
- Wallet checks `window.opener` is the same origin and an allowlisted Abundent source path; source checks the popup's window identity and same-origin message.
- Wallet sends a random challenge; source replies once over origin-targeted, window-targeted `postMessage` with a bounded normalized link. Acknowledgment stops the source's listener. The offer expires; it is retained in **memory only** before approval.
- The receiver shows only the proposed label, group, scope and destination hostname, not the secret URL. Receiving a message does not save anything.
- After user creates/unlocks their local wallet and presses **Keep link**, the existing encrypted IndexedDB vault is updated, checked for exact duplicate URLs.
- **Discard** drops the offered link without persistence. Locking or closing the tab loses any unsaved offer. Clipboard/manual paste remains a fallback when popup or opener communication is unavailable.
- A link is a bearer capability, not verified personhood/ownership. The wallet cannot rotate or revoke it; the original inbox does.

## Browser constraints
This is a same-origin convenience for `apps.abundent.org` routes, **not** cross-origin synchronization. Different Abundent/GitHub/Vercel hostnames continue to require private encrypted backup restore. Browsers that strip `window.opener`, disable popups, or block browser storage may require manual paste. Only explicitly clicked buttons offer a URL; no crawler, auto-save, or background collection is enabled.

## Tests
Real Chromium tests exercise a synthetic Living Inbox creation (mocked backend, zero partner contact), owner handoff, creation of a new wallet, explicit confirmation, ciphertext-only storage, and Switchboard public bookmark offer/discard. Existing wallet encryption/restore tests remain authoritative for local storage boundaries.

**Rule:** AN OFFERED LINK IS NOT AN ACCEPTED LINK; LINK != VERIFIED ROLE; KEEP != DISPATCH; ENCRYPTED LOCAL STORAGE != CROSS-DEVICE SYNC.
