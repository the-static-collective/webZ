# ROOTLINE 005 · The underground encouragement relay

**Status:** draft experiment, stacked on [Wandering Letter 004 PR #41](https://github.com/the-static-collective/webZ/pull/41). No newsletter, provider configuration, SMS integration, Cloudflare migration, DNS change, production deployment, or subscriber collection.

## Hypothesis

Can one person send a small, independently verifiable public encouragement seed to another, who may simply **keep it**, voluntarily append their own note, or pass it on—with no mandatory forwarding, follower graph, tracking, automated contact lookup or central message registry?

**Success condition:** Three isolated browser contexts A/B/C, with A and B closed before C receives. C independently re-verifies the immutable origin and B's voluntary added note while disconnected from the network, optionally adds a third note, and can export the bounded chain. A tamper (without recomputing a SHA-256 link) causes a HOLD. No message is automatically sent or saved.

## User journey

- **Plant at A:** Write a short public encouragement (3–220 visible characters). Explicitly confirm you authored it and are comfortable with voluntary public sharing. A SHA-256 content link is created in memory. Nothing is sent, uploaded or published.
- **Carry A→B:** A chooses **Copy friendly text**, **Copy verifiable parcel**, or **Carry full seed (.json)**. They manually paste into a messaging service *they choose* or hand over the file. Clipboard and local file operations are initiated by a direct click.
- **Receive at B:** Paste the JSON or select the file. The browser verifies origin content and all optional hop hashes. B can choose **Keep it. That's enough.** This does not save, reply, or forward.
- **Grow at B:** Optionally add up to one 220-character note, explicitly authorizing its possible public forwarding. It is linked but remains separate from the origin; B cannot overwrite the first person's words using normal UI. A signed authorship claim is **not** made.
- **Carry B→C:** As above, deliberate manual text or JSON handoff. Close/disconnect B before C opens the already loaded page. C can read and keep it offline, optionally append a third note, and export the parcel.
- **Stop anywhere:** No pressure to share; a copy need not be opened or passed along. **Clear this page's seed** removes current in-memory state. There is no localStorage, IndexedDB, server storage or audience analytics in this experiment.

## Protocol

`post-office/rootline/rootline-core.mjs` defines:

- Exact `abundent/rootline-encouragement/v0` envelope.
- One origin `{id, message, kind, permission, link}`, with `link = SHA-256(canonical({id,message,kind,permission}))`.
- Zero to two additions `{index,message,previous,kind,link}`, each chained to the previous link.
- `policy = KEEP_IS_ENOUGH_NO_FORWARD_OBLIGATION`, hard-coded rather than remotely mutable.
- Random 128-bit local seed ID, maximum 220 Unicode code points per note, maximum 3800 UTF-8 bytes per parcel, exact schemas and hop count.
- Validation rejects links, common email addresses and phone-like numbers as an **incomplete** anti-disclosure safeguard. It cannot guarantee messages contain no identifying content. No private testimonies or other people's details should be entered.
- Deliberate no-tracker semantics. No time stamps, sender names, recipient names, referrals, delivery logs, SMS integration, comments feed, links to people or unique contact lists.

**Important distinctions:**

- **SHA-256 ≠ sender identity or consent proof.** An adversary can replace public notes and recompute every unsigned hash. It detects modification *against a trusted copy of the original digest*, not a motivated forgery.
- **Friendly text ≠ verified packet.** Text-only is human-readable for SMS; it doesn't carry verifiable links. Full JSON (copy/download) retains hash data.
- **Copy ≠ deliver.** Ordinary SMS has provider metadata and is not generally end-to-end encrypted. Clipboard may be available to other local software; share only something genuinely public.
- **"Anonymous" ≠ anonymity guarantee.** In this prototype no identifiers are collected by ROOTLINE itself, but communication channels and browsers may disclose IP, phone number, account name or other metadata to their operators.
- **Keep ≠ store.** The active tab holds data in memory; closing or reloading loses it unless the recipient explicitly exported it. "Clear" only clears the app's memory; it cannot erase a file or message already copied elsewhere.
- **Public-share permission ≠ ownership grant for other media.** Rights and privacy for future songs, images, correspondence and signed personal feeds require separate contracts.

## Verification

- `tests/rootline-005.test.mjs`: bounded schemas, provenance chain, refusal of forged hops, unwanted contacts and mandatory-forward rules, no passive network or persistent browser storage.
- `tests/rootline_browser.py`: three isolated Chromium browser contexts: A plants and leaves, B imports and keeps/grows only with consent, B leaves, C imports and grows offline, a recipient can clear/stop, and tampering rejects. It observes no third-party HTTP requests.
- `npm test`, `npm run field:verify`, `npm run build`, `npm run test:browser` required prior to real deployment.
- The public release allowlist exports only `post-office/rootline/` approved static assets, excluded from the immutable PWA service worker's fixed offline cache. Production stays unmodified.

## Follow-up experiments — HOLD

1. Human subject / opt-in field research: 3 people who have chosen to participate, clear opt-out, no unsolicited messages. Ask whether receipt was helpful, and **do not measure recruitment or require forwarding**.
2. Optional QR print layer: only nonpersonal public seeds. Measure accessibility and optical error rate, provide text alternative.
3. Signed publisher identities: independent trust anchors, key rotation and revocation. Do not promise anonymity or signed custody based on hash links.
4. Peer transit adapter: link ROOTLINE public envelopes into Seed 003 WebRTC and Seed 004 A→B→C custody with manual approval at each crossing.
5. Consentful community stewardship: deliberate public collections of **approved** notes with no contact graph, no default public reply publication, and human curation rather than autonomously publishing anything.

**The metric is not virality. A letter is complete even when one person keeps it.**
