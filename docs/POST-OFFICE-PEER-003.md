# POST-OFFICE-PEER-003 · direct crossing laboratory

Status: **EXPERIMENTAL DRAFT**. Stacked on Seed Lab 002 and Post Office 001, both unmerged. No automatic promotion to `abundent.org`, no change to DNS or Buttondown. No external signaling service is hosted.

## Experiment
Could two people with browsers and a separate way to exchange small pairing descriptions transmit a **verified public letter seed** directly across a WebRTC DataChannel, without Abundent storing or relaying their file?

1. Device A visits `/post-office/seed-lab/peer/`, deliberately loads an allowed public seed and creates an SDP offer. No seed is sent at this point.
2. A copies the offer **out of band** (chat, QR, local file, or spoken/pasted text). Signaling transport is chosen and operated by the people themselves, not by this site.
3. Device B pastes the offer, approves receiving from the chosen peer, creates an answer, and returns that answer to A out of band.
4. A applies the answer. Both browsers compute an identical 12-hex-character SHA-256 *pairing check code* from both complete descriptions. People **must** compare it by a separately trusted means. Matching codes do not prove the peer's legal identity or the author's identity.
5. A explicitly approves sending *one verified seed* and B explicitly accepts the receive after the code comparison. Only then can the public JSON parcel cross the direct DTLS-protected channel.
6. B independently checks its pre-agreed content digest and the seed's canonical SHA-256 and accepts it into page memory. B sends A an *unsigned peer receipt* for the same session and digest. Both peers can locally export seed and receipt.
7. B can import the seed into Seed Lab 002 and generate an independently opened single-file HTML page that survives without its original host.

## Design / threat model
- **No cloud seed relay.** No WebSocket, server database, account, subscription endpoint, arbitrary file upload or passive network requests in this new page. The site provides static files on initial open; all subsequent pairing exchange is manually carried by the humans.
- **Network traversal ≠ guaranteed.** WebRTC ICE candidates can connect direct on some LANs without external services. Across NATs, connections may fail. Optional **public STUN** is only enabled by an explicit checkbox *before* pressing Create offer/Create answer. If enabled, STUN providers may see the client's network address and metadata, and peers can learn address information from the copied SDP. No TURN relay or hidden fallback is configured. If direct connectivity fails, the session shows HOLD.
- **Consent gates.** B must approve preparing an answer and separately approve receipt after comparing codes. A must check code comparison and explicitly approve sending. The default is no transfer. Only the one selected, bounded seed may be sent; incoming WebRTC binary frames and unrecognized messages are rejected.
- **Strict wire schema.** Manual JSON SDP envelope, random 128-bit session id, seed digest, bounded 42KB signaling; under 26KB seed transfer; exact receipt shape/session/digest; timeouts for candidate gathering.
- **Integrity ≠ publisher identity.** The digest is not a signature. An adversary able to alter both out-of-band descriptions can manipulate pairing; users need an independently trusted means to compare codes, and the experiment does *not* certify peer identity. The returned receipt is a self-reported, unsigned local event, not a reLATTE signed RECEIVE or admission.
- **Transport ≠ publication or contact authority.** This experiment touches no subscriber data, invitations, private letters, physical objects, printing, remote execution, canonical law or external adopter.
- **Offline capability.** The *exported HTML* runs offline. The **pairing page itself needs to be opened online** first and is outside the PWA service-worker fixed cache; it is not a mesh router.

## Checks and witnessed limits
- Node tests: tamper with digest, packet, receipt and SDP; reject unsafe or oversized frames; assert source-specific and session-specific binding; ensure no server relay or subscriber storage.
- Real Chromium: two isolated browser contexts and manual (test-harness-pasted) offer/answer exchange; host-only ICE (STUN unchecked); consent withholding; matching pairing code; direct seed transfer; receiver independently verifies hash; unsigned local receipt; disconnect; checks for no third-party *HTTP* requests and no localStorage writes. This simulated pair is not a physical two-device/independent network measurement.
- Build/test: `npm test`, `npm run field:verify`, `npm run build`, `node scripts/verify-release.mjs dist`, `npm run test:browser`. New static peer paths remain outside `sw.js` cache and are explicitly listed in immutable public asset allowlist.

## Further work / intentional HOLD
- Witness one connection between two **physical** devices and record direct-vs-failed NAT outcomes.
- Add an owner-held author signature and independent trust-pinning before allowing cross-publisher seeds.
- Investigate content routing and discovery (IPFS, Hypercore, Soulseek-style index) separately, with opt-in exposure and resource limits.
- Consider reLATTE crossing receipts only after separate signing keys, authority owner and verified custody; do not rebrand an unsigned WebRTC acknowledgment as a sovereign RECEIVE.
- Keep a manual/offline file exchange path in Seed Lab 002 for devices that cannot establish WebRTC.

Scientific question: **Can a verified publication change hands over a direct consensual peer connection, with neither Abundent nor the newsletter service carrying the seed bytes?** This slice tests a bounded example, not a universal answer.
